<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	let principal = $state<number | null>(null);
	let ratePerPeriod = $state<number | null>(null);
	let periods = $state<number | null>(null);

	let result = $derived.by(() => {
		if (principal === null || ratePerPeriod === null || periods === null) {
			return null;
		}
		if (principal <= 0 || periods <= 0) {
			return null;
		}

		const rate = ratePerPeriod / 100;
		const finalAmount = principal * Math.pow(1 + rate, periods);
		const totalProfit = finalAmount - principal;
		const totalReturn = (totalProfit / principal) * 100;

		// Calculate breakdown by period
		const breakdown: { period: number; amount: number; profit: number }[] = [];
		let currentAmount = principal;
		for (let i = 1; i <= Math.min(periods, 12); i++) {
			const newAmount = currentAmount * (1 + rate);
			breakdown.push({
				period: i,
				amount: newAmount,
				profit: newAmount - currentAmount
			});
			currentAmount = newAmount;
		}

		return {
			finalAmount,
			totalProfit,
			totalReturn,
			breakdown
		};
	});

	function reset() {
		principal = null;
		ratePerPeriod = null;
		periods = null;
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('calculators.compound.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('calculators.compound.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6">
				<!-- Principal -->
				<div class="mb-4">
					<label for="principal" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('compound.principal')}
					</label>
					<input
						id="principal"
						type="number"
						bind:value={principal}
						placeholder="10000"
						step="any"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Rate Per Period -->
				<div class="mb-4">
					<label for="rate" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('compound.ratePerPeriod')} (%)
					</label>
					<input
						id="rate"
						type="number"
						bind:value={ratePerPeriod}
						placeholder="5"
						step="0.1"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<div class="flex gap-2 mt-2">
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (ratePerPeriod = 1)}
						>
							1%
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (ratePerPeriod = 3)}
						>
							3%
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (ratePerPeriod = 5)}
						>
							5%
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (ratePerPeriod = 10)}
						>
							10%
						</button>
					</div>
				</div>

				<!-- Periods -->
				<div class="mb-6">
					<label for="periods" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('compound.periods')}
					</label>
					<input
						id="periods"
						type="number"
						bind:value={periods}
						placeholder="12"
						min="1"
						step="1"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<div class="flex gap-2 mt-2">
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (periods = 12)}
						>
							12
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (periods = 24)}
						>
							24
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (periods = 52)}
						>
							52
						</button>
						<button
							class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
							onclick={() => (periods = 100)}
						>
							100
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

					<!-- Final Amount Display -->
					<div class="text-center mb-6 p-4 bg-green-50 rounded-lg">
						<p class="text-sm text-gray-500 mb-1">{$_('compound.finalAmount')}</p>
						<p class="text-4xl font-bold text-green-600">
							{result.finalAmount.toFixed(2)}
						</p>
					</div>

					<div class="space-y-3">
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('compound.totalProfit')}:</span>
							<span class="text-lg text-green-500">+{result.totalProfit.toFixed(2)}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('compound.totalReturn')}:</span>
							<span class="text-lg text-green-500">+{result.totalReturn.toFixed(2)}%</span>
						</div>
					</div>

					<!-- Breakdown Table -->
					{#if result.breakdown.length > 0}
						<div class="mt-6">
							<h3 class="text-sm font-semibold text-gray-700 mb-2">{$_('compound.breakdown')}</h3>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b">
											<th class="py-2 text-left">{$_('compound.period')}</th>
											<th class="py-2 text-right">{$_('compound.amount')}</th>
											<th class="py-2 text-right">{$_('common.profit')}</th>
										</tr>
									</thead>
									<tbody>
										{#each result.breakdown as row}
											<tr class="border-b">
												<td class="py-2">{row.period}</td>
												<td class="py-2 text-right">{row.amount.toFixed(2)}</td>
												<td class="py-2 text-right text-green-500">+{row.profit.toFixed(2)}</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
