<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	let accountSize = $state<number | null>(null);
	let riskPercent = $state<number | null>(1);
	let entryPrice = $state<number | null>(null);
	let stopLoss = $state<number | null>(null);

	let result = $derived.by(() => {
		if (accountSize === null || riskPercent === null || entryPrice === null || stopLoss === null) {
			return null;
		}
		if (accountSize <= 0 || riskPercent <= 0 || entryPrice <= 0) {
			return null;
		}

		const riskAmount = (accountSize * riskPercent) / 100;
		const stopLossDistance = Math.abs(entryPrice - stopLoss);

		if (stopLossDistance === 0) {
			return null;
		}

		const positionSize = riskAmount / stopLossDistance;
		const positionValue = positionSize * entryPrice;
		const stopLossPercent = (stopLossDistance / entryPrice) * 100;

		return {
			riskAmount,
			stopLossDistance,
			positionSize,
			positionValue,
			stopLossPercent
		};
	});

	function reset() {
		accountSize = null;
		riskPercent = 1;
		entryPrice = null;
		stopLoss = null;
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('calculators.positionSize.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('calculators.positionSize.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6">
				<!-- Account Size -->
				<div class="mb-4">
					<label for="account" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('positionSize.accountSize')}
					</label>
					<input
						id="account"
						type="number"
						bind:value={accountSize}
						placeholder="10000"
						step="any"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Risk Percent -->
				<div class="mb-4">
					<label for="risk" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('positionSize.riskPercent')} (%)
					</label>
					<input
						id="risk"
						type="number"
						bind:value={riskPercent}
						placeholder="1"
						step="0.1"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<div class="flex gap-2 mt-2">
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (riskPercent = 0.5)}
						>
							0.5%
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (riskPercent = 1)}
						>
							1%
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (riskPercent = 2)}
						>
							2%
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (riskPercent = 3)}
						>
							3%
						</button>
					</div>
				</div>

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
				<div class="mb-6">
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

					<!-- Position Size Display -->
					<div class="text-center mb-6 p-4 bg-blue-50 rounded-lg">
						<p class="text-sm text-gray-500 mb-1">{$_('positionSize.recommendedSize')}</p>
						<p class="text-4xl font-bold text-blue-600">
							{result.positionSize.toFixed(4)}
						</p>
						<p class="text-sm text-gray-500 mt-1">{$_('positionSize.units')}</p>
					</div>

					<div class="space-y-3">
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('positionSize.riskAmount')}:</span>
							<span class="text-lg text-red-500">{result.riskAmount.toFixed(2)}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('positionSize.slDistance')}:</span>
							<span class="text-lg">{result.stopLossDistance.toFixed(4)} ({result.stopLossPercent.toFixed(2)}%)</span>
						</div>
						<hr />
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('positionSize.positionValue')}:</span>
							<span class="text-lg font-semibold">{result.positionValue.toFixed(2)}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
