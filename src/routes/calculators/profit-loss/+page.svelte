<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	let entryPrice = $state<number | null>(null);
	let exitPrice = $state<number | null>(null);
	let quantity = $state<number | null>(null);
	let isLong = $state(true);

	let result = $derived.by(() => {
		if (entryPrice === null || exitPrice === null || quantity === null) {
			return null;
		}
		if (entryPrice <= 0 || quantity <= 0) {
			return null;
		}

		let priceDiff: number;
		if (isLong) {
			priceDiff = exitPrice - entryPrice;
		} else {
			priceDiff = entryPrice - exitPrice;
		}

		const profitLoss = priceDiff * quantity;
		const profitLossPercent = (priceDiff / entryPrice) * 100;

		return {
			profitLoss,
			profitLossPercent,
			isProfit: profitLoss >= 0
		};
	});

	function reset() {
		entryPrice = null;
		exitPrice = null;
		quantity = null;
		isLong = true;
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
			<!-- Language Switcher -->
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

			<!-- Header -->
			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('calculators.profitLoss.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('calculators.profitLoss.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6">
				<!-- Position Type -->
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-2">
						{$_('profitLoss.positionType')}
					</label>
					<div class="flex gap-4">
						<button
							class="flex-1 py-2 rounded {isLong ? 'bg-green-500 text-white' : 'bg-gray-200'}"
							onclick={() => (isLong = true)}
						>
							{$_('profitLoss.long')}
						</button>
						<button
							class="flex-1 py-2 rounded {!isLong ? 'bg-red-500 text-white' : 'bg-gray-200'}"
							onclick={() => (isLong = false)}
						>
							{$_('profitLoss.short')}
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

				<!-- Exit Price -->
				<div class="mb-4">
					<label for="exit" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('common.exit')}
					</label>
					<input
						id="exit"
						type="number"
						bind:value={exitPrice}
						placeholder="0.00"
						step="any"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Quantity -->
				<div class="mb-6">
					<label for="quantity" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('common.quantity')}
					</label>
					<input
						id="quantity"
						type="number"
						bind:value={quantity}
						placeholder="0"
						step="any"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
					<div class="space-y-3">
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('profitLoss.profitLoss')}:</span>
							<span class="text-xl font-bold {result.isProfit ? 'text-green-500' : 'text-red-500'}">
								{result.isProfit ? '+' : ''}{result.profitLoss.toFixed(2)}
							</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('profitLoss.percent')}:</span>
							<span class="text-xl font-bold {result.isProfit ? 'text-green-500' : 'text-red-500'}">
								{result.isProfit ? '+' : ''}{result.profitLossPercent.toFixed(2)}%
							</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
