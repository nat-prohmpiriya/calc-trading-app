<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	// Assets
	let cashSavings = $state<number | null>(null);
	let investments = $state<number | null>(null);
	let retirement = $state<number | null>(null);
	let realEstate = $state<number | null>(null);
	let vehicles = $state<number | null>(null);
	let otherAssets = $state<number | null>(null);

	// Liabilities
	let creditCardDebt = $state<number | null>(null);
	let personalLoans = $state<number | null>(null);
	let carLoans = $state<number | null>(null);
	let homeMortgage = $state<number | null>(null);
	let studentLoans = $state<number | null>(null);
	let otherDebts = $state<number | null>(null);

	let totalAssets = $derived(
		(cashSavings ?? 0) +
		(investments ?? 0) +
		(retirement ?? 0) +
		(realEstate ?? 0) +
		(vehicles ?? 0) +
		(otherAssets ?? 0)
	);

	let totalLiabilities = $derived(
		(creditCardDebt ?? 0) +
		(personalLoans ?? 0) +
		(carLoans ?? 0) +
		(homeMortgage ?? 0) +
		(studentLoans ?? 0) +
		(otherDebts ?? 0)
	);

	let result = $derived.by(() => {
		if (totalAssets === 0 && totalLiabilities === 0) {
			return null;
		}

		const netWorth = totalAssets - totalLiabilities;
		const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
		const liquidAssets = (cashSavings ?? 0) + (investments ?? 0);
		const liquidNetWorth = liquidAssets - totalLiabilities;

		// Categorize assets
		const assetBreakdown = [
			{ name: 'cash', value: cashSavings ?? 0, color: 'bg-green-500' },
			{ name: 'investments', value: investments ?? 0, color: 'bg-blue-500' },
			{ name: 'retirement', value: retirement ?? 0, color: 'bg-purple-500' },
			{ name: 'realEstate', value: realEstate ?? 0, color: 'bg-yellow-500' },
			{ name: 'vehicles', value: vehicles ?? 0, color: 'bg-orange-500' },
			{ name: 'other', value: otherAssets ?? 0, color: 'bg-gray-500' }
		].filter(a => a.value > 0);

		const debtBreakdown = [
			{ name: 'creditCard', value: creditCardDebt ?? 0, color: 'bg-red-500' },
			{ name: 'personal', value: personalLoans ?? 0, color: 'bg-red-400' },
			{ name: 'car', value: carLoans ?? 0, color: 'bg-red-300' },
			{ name: 'home', value: homeMortgage ?? 0, color: 'bg-red-600' },
			{ name: 'student', value: studentLoans ?? 0, color: 'bg-red-200' },
			{ name: 'other', value: otherDebts ?? 0, color: 'bg-gray-400' }
		].filter(d => d.value > 0);

		return {
			netWorth,
			totalAssets,
			totalLiabilities,
			debtToAssetRatio,
			liquidAssets,
			liquidNetWorth,
			assetBreakdown,
			debtBreakdown,
			isPositive: netWorth >= 0
		};
	});

	function reset() {
		cashSavings = null;
		investments = null;
		retirement = null;
		realEstate = null;
		vehicles = null;
		otherAssets = null;
		creditCardDebt = null;
		personalLoans = null;
		carLoans = null;
		homeMortgage = null;
		studentLoans = null;
		otherDebts = null;
	}

	function switchLocale(lang: string) {
		locale.set(lang);
		localStorage.setItem('locale', lang);
	}
</script>

{#if $isLoading}
	<p>Loading...</p>
{:else}
	<div class="min-h-screen bg-gray-100 p-4 md:p-8">
		<div class="max-w-2xl mx-auto">
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('networth.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('networth.description')}</p>

			<!-- Calculator Form -->
			<div class="space-y-6">
				<!-- Assets Section -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold text-green-600 mb-4">{$_('networth.assets')}</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="cashSavings" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.cashSavings')}
							</label>
							<input
								id="cashSavings"
								type="number"
								bind:value={cashSavings}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
						<div>
							<label for="investments" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.investments')}
							</label>
							<input
								id="investments"
								type="number"
								bind:value={investments}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
						<div>
							<label for="retirement" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.retirementAccounts')}
							</label>
							<input
								id="retirement"
								type="number"
								bind:value={retirement}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
						<div>
							<label for="realEstate" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.realEstate')}
							</label>
							<input
								id="realEstate"
								type="number"
								bind:value={realEstate}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
						<div>
							<label for="vehicles" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.vehicles')}
							</label>
							<input
								id="vehicles"
								type="number"
								bind:value={vehicles}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
						<div>
							<label for="otherAssets" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.otherAssets')}
							</label>
							<input
								id="otherAssets"
								type="number"
								bind:value={otherAssets}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
							/>
						</div>
					</div>

					<div class="mt-4 p-3 bg-green-50 rounded-lg text-right">
						<span class="text-sm text-gray-600">{$_('networth.totalAssets')}: </span>
						<span class="text-lg font-bold text-green-600">฿{totalAssets.toLocaleString()}</span>
					</div>
				</div>

				<!-- Liabilities Section -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold text-red-600 mb-4">{$_('networth.liabilities')}</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="creditCardDebt" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.creditCardDebt')}
							</label>
							<input
								id="creditCardDebt"
								type="number"
								bind:value={creditCardDebt}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
						</div>
						<div>
							<label for="personalLoans" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.personalLoans')}
							</label>
							<input
								id="personalLoans"
								type="number"
								bind:value={personalLoans}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
						</div>
						<div>
							<label for="carLoans" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.carLoans')}
							</label>
							<input
								id="carLoans"
								type="number"
								bind:value={carLoans}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
						</div>
						<div>
							<label for="homeMortgage" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.homeMortgage')}
							</label>
							<input
								id="homeMortgage"
								type="number"
								bind:value={homeMortgage}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
						</div>
						<div>
							<label for="studentLoans" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.studentLoans')}
							</label>
							<input
								id="studentLoans"
								type="number"
								bind:value={studentLoans}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
						</div>
						<div>
							<label for="otherDebts" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('networth.otherDebts')}
							</label>
							<input
								id="otherDebts"
								type="number"
								bind:value={otherDebts}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
							/>
						</div>
					</div>

					<div class="mt-4 p-3 bg-red-50 rounded-lg text-right">
						<span class="text-sm text-gray-600">{$_('networth.totalLiabilities')}: </span>
						<span class="text-lg font-bold text-red-600">฿{totalLiabilities.toLocaleString()}</span>
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

					<!-- Net Worth -->
					<div class="text-center mb-6 p-4 rounded-lg {result.isPositive ? 'bg-green-50' : 'bg-red-50'}">
						<p class="text-sm text-gray-500 mb-1">{$_('networth.netWorth')}</p>
						<p class="text-4xl font-bold {result.isPositive ? 'text-green-600' : 'text-red-600'}">
							฿{result.netWorth.toLocaleString()}
						</p>
					</div>

					<!-- Summary Stats -->
					<div class="grid grid-cols-2 gap-4 mb-6">
						<div class="p-3 bg-gray-50 rounded-lg text-center">
							<p class="text-xs text-gray-500">{$_('networth.liquidAssets')}</p>
							<p class="text-lg font-semibold text-blue-600">฿{result.liquidAssets.toLocaleString()}</p>
						</div>
						<div class="p-3 bg-gray-50 rounded-lg text-center">
							<p class="text-xs text-gray-500">{$_('networth.debtToAssetRatio')}</p>
							<p class="text-lg font-semibold {result.debtToAssetRatio > 50 ? 'text-red-600' : result.debtToAssetRatio > 30 ? 'text-yellow-600' : 'text-green-600'}">{result.debtToAssetRatio.toFixed(1)}%</p>
						</div>
					</div>

					<div class="space-y-3 text-sm">
						<div class="flex justify-between text-green-600">
							<span>{$_('networth.totalAssets')}:</span>
							<span>+฿{result.totalAssets.toLocaleString()}</span>
						</div>
						<div class="flex justify-between text-red-600">
							<span>{$_('networth.totalLiabilities')}:</span>
							<span>-฿{result.totalLiabilities.toLocaleString()}</span>
						</div>
						<hr />
						<div class="flex justify-between font-semibold">
							<span>{$_('networth.netWorth')}:</span>
							<span class="{result.isPositive ? 'text-green-600' : 'text-red-600'}">฿{result.netWorth.toLocaleString()}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
