<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	let tradeAmount = $state<number | null>(null);
	let feePercent = $state<number | null>(0.1);
	let leverage = $state<number | null>(1);

	let result = $derived.by(() => {
		if (tradeAmount === null || feePercent === null || leverage === null) {
			return null;
		}
		if (tradeAmount <= 0 || feePercent < 0 || leverage < 1) {
			return null;
		}

		const positionSize = tradeAmount * leverage;
		const entryFee = (positionSize * feePercent) / 100;
		const exitFee = (positionSize * feePercent) / 100;
		const totalFee = entryFee + exitFee;
		const feePercentOfCapital = (totalFee / tradeAmount) * 100;

		return {
			positionSize,
			entryFee,
			exitFee,
			totalFee,
			feePercentOfCapital
		};
	});

	function reset() {
		tradeAmount = null;
		feePercent = 0.1;
		leverage = 1;
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('calculators.fee.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('calculators.fee.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6">
				<!-- Trade Amount -->
				<div class="mb-4">
					<label for="amount" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('fee.tradeAmount')}
					</label>
					<input
						id="amount"
						type="number"
						bind:value={tradeAmount}
						placeholder="1000"
						step="any"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Fee Percent -->
				<div class="mb-4">
					<label for="fee" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('fee.feePercent')} (%)
					</label>
					<input
						id="fee"
						type="number"
						bind:value={feePercent}
						placeholder="0.1"
						step="0.01"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<div class="flex gap-2 mt-2">
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (feePercent = 0.02)}
						>
							0.02%
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (feePercent = 0.05)}
						>
							0.05%
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (feePercent = 0.1)}
						>
							0.1%
						</button>
					</div>
				</div>

				<!-- Leverage -->
				<div class="mb-6">
					<label for="leverage" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('fee.leverage')}
					</label>
					<input
						id="leverage"
						type="number"
						bind:value={leverage}
						placeholder="1"
						min="1"
						step="1"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<div class="flex gap-2 mt-2">
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (leverage = 1)}
						>
							1x
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (leverage = 5)}
						>
							5x
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (leverage = 10)}
						>
							10x
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (leverage = 20)}
						>
							20x
						</button>
					</div>
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
					<div class="space-y-3">
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('fee.positionSize')}:</span>
							<span class="text-lg font-semibold">{result.positionSize.toFixed(2)}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('fee.entryFee')}:</span>
							<span class="text-lg">{result.entryFee.toFixed(4)}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('fee.exitFee')}:</span>
							<span class="text-lg">{result.exitFee.toFixed(4)}</span>
						</div>
						<hr />
						<div class="flex justify-between items-center">
							<span class="text-gray-600 font-semibold">{$_('fee.totalFee')}:</span>
							<span class="text-xl font-bold text-red-500">{result.totalFee.toFixed(4)}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('fee.feePercentOfCapital')}:</span>
							<span class="text-lg text-red-500">{result.feePercentOfCapital.toFixed(2)}%</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
