<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	// Thai tax brackets 2567 (2024)
	const TAX_BRACKETS = [
		{ min: 0, max: 150000, rate: 0 },
		{ min: 150000, max: 300000, rate: 5 },
		{ min: 300000, max: 500000, rate: 10 },
		{ min: 500000, max: 750000, rate: 15 },
		{ min: 750000, max: 1000000, rate: 20 },
		{ min: 1000000, max: 2000000, rate: 25 },
		{ min: 2000000, max: 5000000, rate: 30 },
		{ min: 5000000, max: Infinity, rate: 35 }
	];

	// Deduction constants
	const PERSONAL_DEDUCTION = 60000;
	const SPOUSE_DEDUCTION = 60000;
	const CHILD_DEDUCTION = 30000;
	const CHILD_BORN_2561_DEDUCTION = 60000;
	const PARENT_DEDUCTION = 30000;
	const MAX_PARENT_DEDUCTIONS = 4;
	const SOCIAL_SECURITY_MAX = 9000;
	const LIFE_INSURANCE_MAX = 100000;
	const HEALTH_INSURANCE_MAX = 25000;
	const PARENT_HEALTH_INSURANCE_MAX = 15000;
	const PROVIDENT_FUND_MAX = 500000;
	const HOME_LOAN_INTEREST_MAX = 100000;
	const DONATION_MAX_PERCENT = 10;

	// Income
	let annualIncome = $state<number | null>(null);
	let expenseDeductionType = $state<'percent' | 'actual'>('percent');
	let actualExpenses = $state<number | null>(null);

	// Personal deductions
	let hasSpouse = $state(false);
	let spouseHasIncome = $state(false);
	let numChildren = $state(0);
	let numChildrenAfter2561 = $state(0);
	let numParents = $state(0);

	// Insurance & funds
	let socialSecurity = $state<number | null>(null);
	let lifeInsurance = $state<number | null>(null);
	let healthInsurance = $state<number | null>(null);
	let parentHealthInsurance = $state<number | null>(null);
	let providentFund = $state<number | null>(null);

	// Other deductions
	let homeLoanInterest = $state<number | null>(null);
	let donations = $state<number | null>(null);

	let result = $derived.by(() => {
		if (annualIncome === null || annualIncome <= 0) {
			return null;
		}

		// Calculate expense deduction (40% max 100,000 or actual)
		let expenseDeduction = 0;
		if (expenseDeductionType === 'percent') {
			expenseDeduction = Math.min(annualIncome * 0.4, 100000);
		} else {
			expenseDeduction = actualExpenses ?? 0;
		}

		// Personal deductions
		let personalDeductions = PERSONAL_DEDUCTION;

		// Spouse deduction
		if (hasSpouse && !spouseHasIncome) {
			personalDeductions += SPOUSE_DEDUCTION;
		}

		// Children deduction
		const regularChildren = Math.max(0, numChildren - numChildrenAfter2561);
		personalDeductions += regularChildren * CHILD_DEDUCTION;
		personalDeductions += numChildrenAfter2561 * CHILD_BORN_2561_DEDUCTION;

		// Parent deduction
		personalDeductions += Math.min(numParents, MAX_PARENT_DEDUCTIONS) * PARENT_DEDUCTION;

		// Insurance & fund deductions
		const socialSecurityDeduction = Math.min(socialSecurity ?? 0, SOCIAL_SECURITY_MAX);
		const lifeInsuranceDeduction = Math.min(lifeInsurance ?? 0, LIFE_INSURANCE_MAX);
		const healthInsuranceDeduction = Math.min(healthInsurance ?? 0, HEALTH_INSURANCE_MAX);
		const parentHealthInsuranceDeduction = Math.min(parentHealthInsurance ?? 0, PARENT_HEALTH_INSURANCE_MAX);
		const providentFundDeduction = Math.min(providentFund ?? 0, PROVIDENT_FUND_MAX);

		// Combined life + health insurance cannot exceed 100,000
		const totalLifeHealthInsurance = Math.min(
			lifeInsuranceDeduction + healthInsuranceDeduction,
			LIFE_INSURANCE_MAX
		);

		// Other deductions
		const homeLoanDeduction = Math.min(homeLoanInterest ?? 0, HOME_LOAN_INTEREST_MAX);

		// Calculate net income before donations
		const netIncomeBeforeDonations =
			annualIncome -
			expenseDeduction -
			personalDeductions -
			socialSecurityDeduction -
			totalLifeHealthInsurance -
			parentHealthInsuranceDeduction -
			providentFundDeduction -
			homeLoanDeduction;

		// Donation deduction (max 10% of net income)
		const maxDonation = Math.max(0, netIncomeBeforeDonations * (DONATION_MAX_PERCENT / 100));
		const donationDeduction = Math.min(donations ?? 0, maxDonation);

		// Net taxable income
		const netTaxableIncome = Math.max(0, netIncomeBeforeDonations - donationDeduction);

		// Calculate tax
		let totalTax = 0;
		let remainingIncome = netTaxableIncome;
		const taxBreakdown: { bracket: string; income: number; rate: number; tax: number }[] = [];

		for (const bracket of TAX_BRACKETS) {
			if (remainingIncome <= 0) break;

			const taxableInBracket = Math.min(
				remainingIncome,
				bracket.max - bracket.min
			);

			if (taxableInBracket > 0) {
				const taxInBracket = (taxableInBracket * bracket.rate) / 100;
				totalTax += taxInBracket;

				if (bracket.rate > 0) {
					taxBreakdown.push({
						bracket: `${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? '∞' : bracket.max.toLocaleString()}`,
						income: taxableInBracket,
						rate: bracket.rate,
						tax: taxInBracket
					});
				}

				remainingIncome -= taxableInBracket;
			}
		}

		const effectiveTaxRate = annualIncome > 0 ? (totalTax / annualIncome) * 100 : 0;

		// Total deductions summary
		const totalDeductions =
			expenseDeduction +
			personalDeductions +
			socialSecurityDeduction +
			totalLifeHealthInsurance +
			parentHealthInsuranceDeduction +
			providentFundDeduction +
			homeLoanDeduction +
			donationDeduction;

		return {
			grossIncome: annualIncome,
			expenseDeduction,
			personalDeductions,
			insuranceDeductions: socialSecurityDeduction + totalLifeHealthInsurance + parentHealthInsuranceDeduction + providentFundDeduction,
			otherDeductions: homeLoanDeduction + donationDeduction,
			totalDeductions,
			netTaxableIncome,
			totalTax,
			effectiveTaxRate,
			taxBreakdown,
			netIncomeAfterTax: annualIncome - totalTax
		};
	});

	function reset() {
		annualIncome = null;
		expenseDeductionType = 'percent';
		actualExpenses = null;
		hasSpouse = false;
		spouseHasIncome = false;
		numChildren = 0;
		numChildrenAfter2561 = 0;
		numParents = 0;
		socialSecurity = null;
		lifeInsurance = null;
		healthInsurance = null;
		parentHealthInsurance = null;
		providentFund = null;
		homeLoanInterest = null;
		donations = null;
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('taxTh.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('taxTh.description')}</p>

			<!-- Calculator Form -->
			<div class="space-y-6">
				<!-- Income Section -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold mb-4">{$_('taxTh.income')}</h2>

					<div class="mb-4">
						<label for="income" class="block text-sm font-medium text-gray-700 mb-1">
							{$_('taxTh.annualIncome')}
						</label>
						<input
							id="income"
							type="number"
							bind:value={annualIncome}
							placeholder="0"
							step="1000"
							class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>

					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-2">
							{$_('taxTh.expenseDeduction')}
						</label>
						<div class="flex gap-4">
							<label class="flex items-center">
								<input
									type="radio"
									bind:group={expenseDeductionType}
									value="percent"
									class="mr-2"
								/>
								{$_('taxTh.percent40')}
							</label>
							<label class="flex items-center">
								<input
									type="radio"
									bind:group={expenseDeductionType}
									value="actual"
									class="mr-2"
								/>
								{$_('taxTh.actualExpenses')}
							</label>
						</div>
						{#if expenseDeductionType === 'actual'}
							<input
								type="number"
								bind:value={actualExpenses}
								placeholder="0"
								class="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						{/if}
					</div>
				</div>

				<!-- Personal Deductions Section -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold mb-4">{$_('taxTh.personalDeductions')}</h2>

					<div class="space-y-4">
						<label class="flex items-center">
							<input type="checkbox" bind:checked={hasSpouse} class="mr-2" />
							{$_('taxTh.hasSpouse')}
						</label>

						{#if hasSpouse}
							<label class="flex items-center ml-6">
								<input type="checkbox" bind:checked={spouseHasIncome} class="mr-2" />
								{$_('taxTh.spouseHasIncome')}
							</label>
						{/if}

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									{$_('taxTh.numChildren')}
								</label>
								<input
									type="number"
									bind:value={numChildren}
									min="0"
									class="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">
									{$_('taxTh.numChildrenAfter2561')}
								</label>
								<input
									type="number"
									bind:value={numChildrenAfter2561}
									min="0"
									max={numChildren}
									class="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.numParents')} ({$_('taxTh.max4')})
							</label>
							<input
								type="number"
								bind:value={numParents}
								min="0"
								max="4"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
					</div>
				</div>

				<!-- Insurance & Funds Section -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold mb-4">{$_('taxTh.insuranceFunds')}</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.socialSecurity')} ({$_('taxTh.max')} 9,000)
							</label>
							<input
								type="number"
								bind:value={socialSecurity}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.lifeInsurance')} ({$_('taxTh.max')} 100,000)
							</label>
							<input
								type="number"
								bind:value={lifeInsurance}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.healthInsurance')} ({$_('taxTh.max')} 25,000)
							</label>
							<input
								type="number"
								bind:value={healthInsurance}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.parentHealthInsurance')} ({$_('taxTh.max')} 15,000)
							</label>
							<input
								type="number"
								bind:value={parentHealthInsurance}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div class="md:col-span-2">
							<label class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.providentFund')} ({$_('taxTh.max')} 500,000)
							</label>
							<input
								type="number"
								bind:value={providentFund}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
					</div>
				</div>

				<!-- Other Deductions Section -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold mb-4">{$_('taxTh.otherDeductions')}</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.homeLoanInterest')} ({$_('taxTh.max')} 100,000)
							</label>
							<input
								type="number"
								bind:value={homeLoanInterest}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.donations')} ({$_('taxTh.max')} 10%)
							</label>
							<input
								type="number"
								bind:value={donations}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
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

					<!-- Tax Summary -->
					<div class="text-center mb-6 p-4 bg-blue-50 rounded-lg">
						<p class="text-sm text-gray-500 mb-1">{$_('taxTh.taxToPay')}</p>
						<p class="text-4xl font-bold text-blue-600">
							฿{result.totalTax.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
						</p>
						<p class="text-sm text-gray-500 mt-1">
							{$_('taxTh.effectiveRate')}: {result.effectiveTaxRate.toFixed(2)}%
						</p>
					</div>

					<div class="space-y-3 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">{$_('taxTh.grossIncome')}:</span>
							<span>฿{result.grossIncome.toLocaleString()}</span>
						</div>
						<div class="flex justify-between text-red-500">
							<span>{$_('taxTh.totalDeductions')}:</span>
							<span>-฿{result.totalDeductions.toLocaleString()}</span>
						</div>
						<hr />
						<div class="flex justify-between font-semibold">
							<span>{$_('taxTh.netTaxableIncome')}:</span>
							<span>฿{result.netTaxableIncome.toLocaleString()}</span>
						</div>
						<hr />
						<div class="flex justify-between font-semibold text-green-600">
							<span>{$_('taxTh.netIncomeAfterTax')}:</span>
							<span>฿{result.netIncomeAfterTax.toLocaleString()}</span>
						</div>
					</div>

					<!-- Tax Breakdown -->
					{#if result.taxBreakdown.length > 0}
						<div class="mt-6">
							<h3 class="text-sm font-semibold text-gray-700 mb-2">{$_('taxTh.taxBreakdown')}</h3>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b">
											<th class="py-2 text-left">{$_('taxTh.bracket')}</th>
											<th class="py-2 text-right">{$_('taxTh.rate')}</th>
											<th class="py-2 text-right">{$_('taxTh.tax')}</th>
										</tr>
									</thead>
									<tbody>
										{#each result.taxBreakdown as row}
											<tr class="border-b">
												<td class="py-2">{row.bracket}</td>
												<td class="py-2 text-right">{row.rate}%</td>
												<td class="py-2 text-right">฿{row.tax.toLocaleString()}</td>
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
