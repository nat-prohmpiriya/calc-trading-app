<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	let monthlyExpenses = $state<number | null>(null);
	let monthlyIncome = $state<number | null>(null);
	let currentSavings = $state<number | null>(null);
	let targetMonths = $state<number>(6);
	let jobStability = $state<'stable' | 'moderate' | 'unstable'>('moderate');

	let recommendedMonths = $derived.by(() => {
		switch (jobStability) {
			case 'stable': return 3;
			case 'moderate': return 6;
			case 'unstable': return 9;
			default: return 6;
		}
	});

	let result = $derived.by(() => {
		if (!monthlyExpenses || monthlyExpenses <= 0) {
			return null;
		}

		const expenses = monthlyExpenses;
		const savings = currentSavings ?? 0;
		const income = monthlyIncome ?? 0;

		const targetAmount = expenses * targetMonths;
		const recommendedAmount = expenses * recommendedMonths;
		const currentMonthsCovered = expenses > 0 ? savings / expenses : 0;
		const gap = Math.max(0, targetAmount - savings);
		const recommendedGap = Math.max(0, recommendedAmount - savings);

		// Calculate monthly savings needed to reach goal in 12 months
		const monthsToGoal = 12;
		const monthlySavingsFor12Months = gap / monthsToGoal;
		const monthlySavingsFor6Months = gap / 6;
		const monthlySavingsFor24Months = gap / 24;

		// Calculate savings rate if income provided
		const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
		const disposableIncome = income > 0 ? income - expenses : 0;

		// Calculate time to reach goal with current savings rate
		const monthsToReachGoal = disposableIncome > 0 ? gap / disposableIncome : Infinity;

		return {
			targetAmount,
			recommendedAmount,
			currentMonthsCovered,
			gap,
			recommendedGap,
			monthlySavingsFor6Months,
			monthlySavingsFor12Months,
			monthlySavingsFor24Months,
			savingsRate,
			disposableIncome,
			monthsToReachGoal: monthsToReachGoal === Infinity ? null : monthsToReachGoal,
			isGoalReached: gap <= 0,
			progressPercent: Math.min(100, (savings / targetAmount) * 100)
		};
	});

	function reset() {
		monthlyExpenses = null;
		monthlyIncome = null;
		currentSavings = null;
		targetMonths = 6;
		jobStability = 'moderate';
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('emergency.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('emergency.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6 space-y-4">
				<!-- Monthly Expenses -->
				<div>
					<label for="monthlyExpenses" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('emergency.monthlyExpenses')}
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
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyExpenses = 15000)}>15K</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyExpenses = 25000)}>25K</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyExpenses = 35000)}>35K</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyExpenses = 50000)}>50K</button>
					</div>
				</div>

				<!-- Monthly Income (Optional) -->
				<div>
					<label for="monthlyIncome" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('emergency.monthlyIncome')} ({$_('emergency.optional')})
					</label>
					<input
						id="monthlyIncome"
						type="number"
						bind:value={monthlyIncome}
						placeholder="50,000"
						step="1000"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				<!-- Current Savings -->
				<div>
					<label for="currentSavings" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('emergency.currentSavings')}
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

				<!-- Job Stability -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						{$_('emergency.jobStability')}
					</label>
					<div class="grid grid-cols-3 gap-2">
						<button
							class="py-2 rounded text-sm {jobStability === 'stable' ? 'bg-green-500 text-white' : 'bg-gray-200'}"
							onclick={() => (jobStability = 'stable')}
						>
							{$_('emergency.stable')}
						</button>
						<button
							class="py-2 rounded text-sm {jobStability === 'moderate' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}"
							onclick={() => (jobStability = 'moderate')}
						>
							{$_('emergency.moderate')}
						</button>
						<button
							class="py-2 rounded text-sm {jobStability === 'unstable' ? 'bg-red-500 text-white' : 'bg-gray-200'}"
							onclick={() => (jobStability = 'unstable')}
						>
							{$_('emergency.unstable')}
						</button>
					</div>
					<p class="text-xs text-gray-500 mt-1">
						{$_('emergency.recommendedMonths')}: {recommendedMonths} {$_('emergency.months')}
					</p>
				</div>

				<!-- Target Months -->
				<div>
					<label for="targetMonths" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('emergency.targetMonths')}
					</label>
					<input
						id="targetMonths"
						type="range"
						bind:value={targetMonths}
						min="1"
						max="12"
						class="w-full"
					/>
					<div class="flex justify-between text-sm text-gray-500">
						<span>1 {$_('emergency.month')}</span>
						<span class="font-semibold text-blue-600">{targetMonths} {$_('emergency.months')}</span>
						<span>12 {$_('emergency.months')}</span>
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

					<!-- Target Amount -->
					<div class="text-center mb-6 p-4 rounded-lg {result.isGoalReached ? 'bg-green-50' : 'bg-blue-50'}">
						<p class="text-sm text-gray-500 mb-1">{$_('emergency.targetAmount')} ({targetMonths} {$_('emergency.months')})</p>
						<p class="text-4xl font-bold {result.isGoalReached ? 'text-green-600' : 'text-blue-600'}">
							฿{result.targetAmount.toLocaleString()}
						</p>
						{#if result.isGoalReached}
							<p class="text-sm text-green-600 mt-1">{$_('emergency.goalReached')}</p>
						{/if}
					</div>

					<!-- Progress Bar -->
					<div class="mb-6">
						<div class="flex justify-between text-sm mb-1">
							<span class="text-gray-600">{$_('emergency.progress')}</span>
							<span class="font-semibold">{result.progressPercent.toFixed(1)}%</span>
						</div>
						<div class="w-full bg-gray-200 rounded-full h-4">
							<div
								class="h-4 rounded-full transition-all {result.progressPercent >= 100 ? 'bg-green-500' : result.progressPercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}"
								style="width: {Math.min(100, result.progressPercent)}%"
							></div>
						</div>
						<p class="text-sm text-gray-500 mt-1">
							{$_('emergency.currentlyCovered')}: {result.currentMonthsCovered.toFixed(1)} {$_('emergency.months')}
						</p>
					</div>

					<div class="space-y-3 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">{$_('emergency.currentSavings')}:</span>
							<span>฿{(currentSavings ?? 0).toLocaleString()}</span>
						</div>
						{#if result.gap > 0}
							<div class="flex justify-between text-red-500">
								<span>{$_('emergency.gap')}:</span>
								<span>฿{result.gap.toLocaleString()}</span>
							</div>
						{/if}
						<hr />

						{#if result.gap > 0}
							<div class="bg-gray-50 p-3 rounded-lg">
								<p class="text-sm font-semibold mb-2">{$_('emergency.savingsNeeded')}:</p>
								<div class="space-y-1 text-xs">
									<div class="flex justify-between">
										<span>6 {$_('emergency.months')}:</span>
										<span>฿{result.monthlySavingsFor6Months.toLocaleString('th-TH', { maximumFractionDigits: 0 })}/{$_('emergency.month')}</span>
									</div>
									<div class="flex justify-between">
										<span>12 {$_('emergency.months')}:</span>
										<span>฿{result.monthlySavingsFor12Months.toLocaleString('th-TH', { maximumFractionDigits: 0 })}/{$_('emergency.month')}</span>
									</div>
									<div class="flex justify-between">
										<span>24 {$_('emergency.months')}:</span>
										<span>฿{result.monthlySavingsFor24Months.toLocaleString('th-TH', { maximumFractionDigits: 0 })}/{$_('emergency.month')}</span>
									</div>
								</div>
							</div>
						{/if}

						{#if monthlyIncome && monthlyIncome > 0}
							<hr />
							<div class="flex justify-between">
								<span class="text-gray-600">{$_('emergency.savingsRate')}:</span>
								<span class="{result.savingsRate >= 20 ? 'text-green-600' : result.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-500'}">{result.savingsRate.toFixed(1)}%</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">{$_('emergency.disposableIncome')}:</span>
								<span>฿{result.disposableIncome.toLocaleString()}</span>
							</div>
							{#if result.monthsToReachGoal !== null && result.gap > 0}
								<div class="flex justify-between font-semibold">
									<span>{$_('emergency.timeToGoal')}:</span>
									<span>{result.monthsToReachGoal.toFixed(1)} {$_('emergency.months')}</span>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
