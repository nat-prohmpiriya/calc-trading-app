<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	let currentAge = $state<number | null>(null);
	let retirementAge = $state<number | null>(60);
	let lifeExpectancy = $state<number | null>(85);
	let currentSavings = $state<number | null>(null);
	let monthlyExpenses = $state<number | null>(null);
	let expectedReturn = $state<number | null>(5);
	let inflationRate = $state<number | null>(3);

	let result = $derived.by(() => {
		if (!currentAge || !retirementAge || !lifeExpectancy || !monthlyExpenses) {
			return null;
		}

		if (currentAge >= retirementAge || retirementAge >= lifeExpectancy) {
			return null;
		}

		const yearsToRetirement = retirementAge - currentAge;
		const yearsInRetirement = lifeExpectancy - retirementAge;
		const monthsToRetirement = yearsToRetirement * 12;
		const savings = currentSavings ?? 0;
		const monthlyReturn = (expectedReturn ?? 5) / 100 / 12;
		const annualInflation = (inflationRate ?? 3) / 100;

		// Calculate future monthly expenses (adjusted for inflation)
		const futureMonthlyExpenses = monthlyExpenses * Math.pow(1 + annualInflation, yearsToRetirement);
		const futureAnnualExpenses = futureMonthlyExpenses * 12;

		// Calculate total needed at retirement (simplified: expenses * years, adjusted for inflation during retirement)
		// Using present value of annuity formula
		const realReturn = ((1 + (expectedReturn ?? 5) / 100) / (1 + annualInflation)) - 1;
		let totalNeededAtRetirement = 0;

		if (realReturn > 0) {
			totalNeededAtRetirement = futureAnnualExpenses * (1 - Math.pow(1 + realReturn, -yearsInRetirement)) / realReturn;
		} else {
			totalNeededAtRetirement = futureAnnualExpenses * yearsInRetirement;
		}

		// Calculate future value of current savings
		const futureValueOfSavings = savings * Math.pow(1 + (expectedReturn ?? 5) / 100, yearsToRetirement);

		// Gap to fill
		const gap = totalNeededAtRetirement - futureValueOfSavings;

		// Calculate monthly savings needed
		let monthlySavingsNeeded = 0;
		if (gap > 0 && monthlyReturn > 0) {
			monthlySavingsNeeded = gap * monthlyReturn / (Math.pow(1 + monthlyReturn, monthsToRetirement) - 1);
		} else if (gap > 0) {
			monthlySavingsNeeded = gap / monthsToRetirement;
		}

		// Calculate if on track percentage
		const onTrackPercentage = Math.min(100, (futureValueOfSavings / totalNeededAtRetirement) * 100);

		return {
			yearsToRetirement,
			yearsInRetirement,
			futureMonthlyExpenses,
			totalNeededAtRetirement,
			futureValueOfSavings,
			gap: Math.max(0, gap),
			monthlySavingsNeeded: Math.max(0, monthlySavingsNeeded),
			onTrackPercentage,
			isOnTrack: gap <= 0
		};
	});

	function reset() {
		currentAge = null;
		retirementAge = 60;
		lifeExpectancy = 85;
		currentSavings = null;
		monthlyExpenses = null;
		expectedReturn = 5;
		inflationRate = 3;
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('retirement.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('retirement.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6 space-y-4">
				<!-- Age Section -->
				<div class="grid grid-cols-3 gap-4">
					<div>
						<label for="currentAge" class="block text-sm font-medium text-gray-700 mb-1">
							{$_('retirement.currentAge')}
						</label>
						<input
							id="currentAge"
							type="number"
							bind:value={currentAge}
							placeholder="30"
							min="18"
							max="100"
							class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label for="retirementAge" class="block text-sm font-medium text-gray-700 mb-1">
							{$_('retirement.retirementAge')}
						</label>
						<input
							id="retirementAge"
							type="number"
							bind:value={retirementAge}
							placeholder="60"
							min="40"
							max="100"
							class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label for="lifeExpectancy" class="block text-sm font-medium text-gray-700 mb-1">
							{$_('retirement.lifeExpectancy')}
						</label>
						<input
							id="lifeExpectancy"
							type="number"
							bind:value={lifeExpectancy}
							placeholder="85"
							min="60"
							max="120"
							class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>

				<!-- Monthly Expenses -->
				<div>
					<label for="monthlyExpenses" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('retirement.monthlyExpenses')}
					</label>
					<input
						id="monthlyExpenses"
						type="number"
						bind:value={monthlyExpenses}
						placeholder="30,000"
						step="1000"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<div class="flex gap-2 mt-2">
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyExpenses = 20000)}>20K</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyExpenses = 30000)}>30K</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyExpenses = 50000)}>50K</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyExpenses = 80000)}>80K</button>
					</div>
				</div>

				<!-- Current Savings -->
				<div>
					<label for="currentSavings" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('retirement.currentSavings')}
					</label>
					<input
						id="currentSavings"
						type="number"
						bind:value={currentSavings}
						placeholder="0"
						step="10000"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Expected Return & Inflation -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="expectedReturn" class="block text-sm font-medium text-gray-700 mb-1">
							{$_('retirement.expectedReturn')} (%)
						</label>
						<input
							id="expectedReturn"
							type="number"
							bind:value={expectedReturn}
							placeholder="5"
							step="0.5"
							class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
					<div>
						<label for="inflationRate" class="block text-sm font-medium text-gray-700 mb-1">
							{$_('retirement.inflationRate')} (%)
						</label>
						<input
							id="inflationRate"
							type="number"
							bind:value={inflationRate}
							placeholder="3"
							step="0.5"
							class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
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

					<!-- Status -->
					<div class="text-center mb-6 p-4 rounded-lg {result.isOnTrack ? 'bg-green-50' : 'bg-orange-50'}">
						<p class="text-sm text-gray-500 mb-1">{$_('retirement.monthlySavingsNeeded')}</p>
						<p class="text-4xl font-bold {result.isOnTrack ? 'text-green-600' : 'text-orange-600'}">
							{#if result.isOnTrack}
								{$_('retirement.onTrack')}
							{:else}
								฿{result.monthlySavingsNeeded.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
							{/if}
						</p>
						{#if !result.isOnTrack}
							<p class="text-sm text-gray-500 mt-1">{$_('retirement.perMonth')}</p>
						{/if}
					</div>

					<!-- Progress Bar -->
					<div class="mb-6">
						<div class="flex justify-between text-sm mb-1">
							<span class="text-gray-600">{$_('retirement.progress')}</span>
							<span class="font-semibold">{result.onTrackPercentage.toFixed(1)}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-4">
							<div
								class="h-4 rounded-full transition-all {result.onTrackPercentage >= 100 ? 'bg-green-500' : result.onTrackPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}"
								style="width: {Math.min(100, result.onTrackPercentage)}%"
							></div>
						</div>
					</div>

					<div class="space-y-3 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">{$_('retirement.yearsToRetirement')}:</span>
							<span>{result.yearsToRetirement} {$_('retirement.years')}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">{$_('retirement.yearsInRetirement')}:</span>
							<span>{result.yearsInRetirement} {$_('retirement.years')}</span>
						</div>
						<hr />
						<div class="flex justify-between">
							<span class="text-gray-600">{$_('retirement.futureMonthlyExpenses')}:</span>
							<span>฿{result.futureMonthlyExpenses.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
						</div>
						<div class="flex justify-between font-semibold">
							<span>{$_('retirement.totalNeeded')}:</span>
							<span>฿{result.totalNeededAtRetirement.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
						</div>
						<div class="flex justify-between text-green-600">
							<span>{$_('retirement.futureValueOfSavings')}:</span>
							<span>฿{result.futureValueOfSavings.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
						</div>
						{#if result.gap > 0}
							<div class="flex justify-between text-red-500">
								<span>{$_('retirement.gap')}:</span>
								<span>฿{result.gap.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
