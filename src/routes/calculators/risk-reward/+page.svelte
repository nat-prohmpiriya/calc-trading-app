<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	let entryPrice = $state<number | null>(null);
	let stopLoss = $state<number | null>(null);
	let takeProfit = $state<number | null>(null);

	let result = $derived.by(() => {
		if (entryPrice === null || stopLoss === null || takeProfit === null) {
			return null;
		}
		if (entryPrice <= 0) {
			return null;
		}

		const riskAmount = Math.abs(entryPrice - stopLoss);
		const rewardAmount = Math.abs(takeProfit - entryPrice);

		if (riskAmount === 0) {
			return null;
		}

		const riskRewardRatio = rewardAmount / riskAmount;
		const riskPercent = (riskAmount / entryPrice) * 100;
		const rewardPercent = (rewardAmount / entryPrice) * 100;
		const winRate = (1 / (1 + riskRewardRatio)) * 100;

		return {
			riskAmount,
			rewardAmount,
			riskRewardRatio,
			riskPercent,
			rewardPercent,
			winRate
		};
	});

	function reset() {
		entryPrice = null;
		stopLoss = null;
		takeProfit = null;
	}

	function switchLocale(lang: string) {
		locale.set(lang);
		localStorage.setItem('locale', lang);
	}
</script>

{#if $isLoading}
	<p>Loading...</p>
{:else}
	<div class="min-h-screen bg-gray-100 p-8">
		<div class="max-w-xl mx-auto">
			<!-- Header -->
			<div class="flex justify-between items-center mb-8">
				<a href="/" class="text-blue-500 hover:underline">
					← {$_('nav.home')}
				</a>
				<div class="flex gap-2">
					<button
						class="px-3 py-1 rounded {$locale === 'en' ? 'bg-blue-500 text-white' : 'bg-white'}"
						onclick={() => switchLocale('en')}
					>
						EN
					</button>
					<button
						class="px-3 py-1 rounded {$locale === 'th' ? 'bg-blue-500 text-white' : 'bg-white'}"
						onclick={() => switchLocale('th')}
					>
						TH
					</button>
				</div>
			</div>

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('calculators.riskReward.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('calculators.riskReward.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6">
				<!-- Entry Price -->
				<div class="mb-4">
					<label for="entry" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('common.entry')}
					</label>
					<input
						id="entry"
						type="number"
						bind:value={entryPrice}
						placeholder="0.00"
						step="any"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Stop Loss -->
				<div class="mb-4">
					<label for="sl" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('riskReward.stopLoss')}
					</label>
					<input
						id="sl"
						type="number"
						bind:value={stopLoss}
						placeholder="0.00"
						step="any"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
					/>
				</div>

				<!-- Take Profit -->
				<div class="mb-6">
					<label for="tp" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('riskReward.takeProfit')}
					</label>
					<input
						id="tp"
						type="number"
						bind:value={takeProfit}
						placeholder="0.00"
						step="any"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
					/>
				</div>

				<!-- Reset Button -->
				<button
					onclick={reset}
					class="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
				>
					{$_('common.reset')}
				</button>
			</div>

			<!-- Result -->
			{#if result}
				<div class="mt-6 bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold mb-4">{$_('common.result')}</h2>

					<!-- R:R Ratio Display -->
					<div class="text-center mb-6 p-4 bg-gray-50 rounded-lg">
						<p class="text-sm text-gray-500 mb-1">{$_('riskReward.ratio')}</p>
						<p class="text-4xl font-bold text-blue-600">
							1 : {result.riskRewardRatio.toFixed(2)}
						</p>
					</div>

					<div class="space-y-3">
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('common.risk')}:</span>
							<span class="text-lg text-red-500">
								{result.riskAmount.toFixed(2)} ({result.riskPercent.toFixed(2)}%)
							</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('common.reward')}:</span>
							<span class="text-lg text-green-500">
								{result.rewardAmount.toFixed(2)} ({result.rewardPercent.toFixed(2)}%)
							</span>
						</div>
						<hr />
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('riskReward.breakeven')}:</span>
							<span class="text-lg">{result.winRate.toFixed(1)}%</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
