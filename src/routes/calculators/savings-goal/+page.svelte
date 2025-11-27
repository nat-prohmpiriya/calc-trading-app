<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	let goalAmount = $state<number | null>(null);
	let currentSavings = $state<number | null>(null);
	let monthlyContribution = $state<number | null>(null);
	let interestRate = $state<number | null>(2);
	let targetMonths = $state<number | null>(null);

	// Calculate mode: either time or monthly contribution
	let calcMode = $state<'time' | 'contribution'>('time');

	type TimeResult = {
		mode: 'time';
		months: number;
		years: number;
		remainingMonths: number;
		finalBalance: number;
		totalContributed: number;
		totalInterest: number;
		goalAmount: number;
	};

	type ContributionResult = {
		mode: 'contribution';
		monthlyNeeded: number;
		targetMonths: number;
		targetYears: number;
		targetRemainingMonths: number;
		totalContributed: number;
		totalInterest: number;
		goalAmount: number;
	};

	type ErrorResult = { error: string };

	type Result = TimeResult | ContributionResult | ErrorResult | null;

	let result: Result = $derived.by(() => {
		if (!goalAmount || goalAmount <= 0) {
			return null;
		}

		const goal = goalAmount;
		const savings = currentSavings ?? 0;
		const monthly = monthlyContribution ?? 0;
		const rate = (interestRate ?? 0) / 100 / 12;
		const target = targetMonths ?? 0;

		if (calcMode === 'time') {
			// Calculate time to reach goal with given monthly contribution
			if (monthly <= 0) return null;

			let balance = savings;
			let months = 0;
			const maxMonths = 600; // 50 years max

			while (balance < goal && months < maxMonths) {
				balance = balance * (1 + rate) + monthly;
				months++;
			}

			if (months >= maxMonths) {
				return { error: 'tooLong' } as ErrorResult;
			}

			const years = Math.floor(months / 12);
			const remainingMonths = months % 12;
			const totalContributed = monthly * months;
			const totalInterest = balance - savings - totalContributed;

			return {
				mode: 'time',
				months,
				years,
				remainingMonths,
				finalBalance: balance,
				totalContributed,
				totalInterest,
				goalAmount: goal
			} as TimeResult;
		} else {
			// Calculate monthly contribution needed to reach goal in target time
			if (target <= 0) return null;

			const gap = goal - savings;
			let monthlyNeeded = 0;

			if (rate > 0) {
				// Future value of current savings
				const fvSavings = savings * Math.pow(1 + rate, target);
				const remainingGoal = goal - fvSavings;

				if (remainingGoal > 0) {
					// PMT formula
					monthlyNeeded = remainingGoal * rate / (Math.pow(1 + rate, target) - 1);
				}
			} else {
				monthlyNeeded = gap / target;
			}

			const totalContributed = monthlyNeeded * target;
			const totalInterest = goal - savings - totalContributed;

			return {
				mode: 'contribution',
				monthlyNeeded: Math.max(0, monthlyNeeded),
				targetMonths: target,
				targetYears: Math.floor(target / 12),
				targetRemainingMonths: target % 12,
				totalContributed,
				totalInterest: Math.max(0, totalInterest),
				goalAmount: goal
			} as ContributionResult;
		}
	});

	function reset() {
		goalAmount = null;
		currentSavings = null;
		monthlyContribution = null;
		interestRate = 2;
		targetMonths = null;
		calcMode = 'time';
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('savingsGoal.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('savingsGoal.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6 space-y-4">
				<!-- Calculation Mode -->
				<div>
					<span class="block text-sm font-medium text-gray-700 mb-2">
						{$_('savingsGoal.calcMode')}
					</span>
					<div class="grid grid-cols-2 gap-2">
						<button
							class="py-2 rounded text-sm {calcMode === 'time' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
							onclick={() => (calcMode = 'time')}
						>
							{$_('savingsGoal.calcTime')}
						</button>
						<button
							class="py-2 rounded text-sm {calcMode === 'contribution' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
							onclick={() => (calcMode = 'contribution')}
						>
							{$_('savingsGoal.calcContribution')}
						</button>
					</div>
				</div>

				<!-- Goal Amount -->
				<div>
					<label for="goalAmount" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('savingsGoal.goalAmount')}
					</label>
					<input
						id="goalAmount"
						type="number"
						bind:value={goalAmount}
						placeholder="1,000,000"
						step="10000"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<div class="flex gap-2 mt-2">
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (goalAmount = 100000)}>100K</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (goalAmount = 500000)}>500K</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (goalAmount = 1000000)}>1M</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (goalAmount = 5000000)}>5M</button>
					</div>
				</div>

				<!-- Current Savings -->
				<div>
					<label for="currentSavings" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('savingsGoal.currentSavings')}
					</label>
					<input
						id="currentSavings"
						type="number"
						bind:value={currentSavings}
						placeholder="0"
						step="1000"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
				</div>

				{#if calcMode === 'time'}
					<!-- Monthly Contribution (for time calculation) -->
					<div>
						<label for="monthlyContribution" class="block text-sm font-medium text-gray-700 mb-1">
							{$_('savingsGoal.monthlyContribution')}
						</label>
						<input
							id="monthlyContribution"
							type="number"
							bind:value={monthlyContribution}
							placeholder="10,000"
							step="1000"
							class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						<div class="flex gap-2 mt-2">
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyContribution = 5000)}>5K</button>
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyContribution = 10000)}>10K</button>
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyContribution = 20000)}>20K</button>
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (monthlyContribution = 30000)}>30K</button>
						</div>
					</div>
				{:else}
					<!-- Target Months (for contribution calculation) -->
					<div>
						<label for="targetMonths" class="block text-sm font-medium text-gray-700 mb-1">
							{$_('savingsGoal.targetTime')}
						</label>
						<input
							id="targetMonths"
							type="number"
							bind:value={targetMonths}
							placeholder="36"
							min="1"
							class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						<div class="flex gap-2 mt-2">
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (targetMonths = 12)}>1Y</button>
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (targetMonths = 24)}>2Y</button>
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (targetMonths = 36)}>3Y</button>
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (targetMonths = 60)}>5Y</button>
						</div>
					</div>
				{/if}

				<!-- Interest Rate -->
				<div>
					<label for="interestRate" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('savingsGoal.interestRate')} (% {$_('savingsGoal.perYear')})
					</label>
					<input
						id="interestRate"
						type="number"
						bind:value={interestRate}
						placeholder="2"
						step="0.25"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<div class="flex gap-2 mt-2">
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (interestRate = 0)}>0%</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (interestRate = 1.5)}>1.5%</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (interestRate = 2.5)}>2.5%</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (interestRate = 5)}>5%</button>
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
				{#if 'error' in result}
					<div class="mt-6 bg-white rounded-lg shadow p-6">
						<div class="text-center p-4 bg-red-50 rounded-lg">
							<p class="text-red-600">{$_('savingsGoal.tooLong')}</p>
						</div>
					</div>
				{:else if result.mode === 'time'}
					<div class="mt-6 bg-white rounded-lg shadow p-6">
						<h2 class="text-lg font-semibold mb-4">{$_('common.result')}</h2>

						<!-- Time to Goal -->
						<div class="text-center mb-6 p-4 bg-blue-50 rounded-lg">
							<p class="text-sm text-gray-500 mb-1">{$_('savingsGoal.timeToGoal')}</p>
							<p class="text-4xl font-bold text-blue-600">
								{#if result.years > 0}
									{result.years} {$_('savingsGoal.years')}
								{/if}
								{#if result.remainingMonths > 0}
									{result.remainingMonths} {$_('savingsGoal.months')}
								{/if}
							</p>
							<p class="text-sm text-gray-500 mt-1">({result.months} {$_('savingsGoal.months')})</p>
						</div>

						<div class="space-y-3 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">{$_('savingsGoal.goalAmount')}:</span>
								<span>฿{result.goalAmount.toLocaleString()}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">{$_('savingsGoal.currentSavings')}:</span>
								<span>฿{(currentSavings ?? 0).toLocaleString()}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">{$_('savingsGoal.totalContributed')}:</span>
								<span>฿{result.totalContributed.toLocaleString()}</span>
							</div>
							<div class="flex justify-between text-green-600">
								<span>{$_('savingsGoal.interestEarned')}:</span>
								<span>+฿{result.totalInterest.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
							</div>
							<hr />
							<div class="flex justify-between font-semibold">
								<span>{$_('savingsGoal.finalBalance')}:</span>
								<span>฿{result.finalBalance.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
							</div>
						</div>
					</div>
				{:else}
					<div class="mt-6 bg-white rounded-lg shadow p-6">
						<h2 class="text-lg font-semibold mb-4">{$_('common.result')}</h2>

						<!-- Monthly Needed -->
						<div class="text-center mb-6 p-4 bg-green-50 rounded-lg">
							<p class="text-sm text-gray-500 mb-1">{$_('savingsGoal.monthlyNeeded')}</p>
							<p class="text-4xl font-bold text-green-600">
								฿{result.monthlyNeeded.toLocaleString('th-TH', { maximumFractionDigits: 0 })}
							</p>
							<p class="text-sm text-gray-500 mt-1">{$_('savingsGoal.perMonth')}</p>
						</div>

						<div class="space-y-3 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">{$_('savingsGoal.goalAmount')}:</span>
								<span>฿{result.goalAmount.toLocaleString()}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">{$_('savingsGoal.targetTime')}:</span>
								<span>
									{#if result.targetYears > 0}
										{result.targetYears} {$_('savingsGoal.years')}
									{/if}
									{#if result.targetRemainingMonths > 0}
										{result.targetRemainingMonths} {$_('savingsGoal.months')}
									{/if}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">{$_('savingsGoal.totalContributed')}:</span>
								<span>฿{result.totalContributed.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
							</div>
							<div class="flex justify-between text-green-600">
								<span>{$_('savingsGoal.interestEarned')}:</span>
								<span>+฿{result.totalInterest.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
							</div>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</div>
{/if}
