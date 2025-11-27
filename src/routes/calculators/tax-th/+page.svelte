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

	// Deduction limits
	const LIMITS = {
		personal: 60000,
		spouse: 60000,
		child: 30000,
		childAfter2561: 60000,
		parent: 30000,
		maxParents: 4,
		disabled: 60000,
		maxDisabled: 4,
		pregnancy: 60000,
		socialSecurity: 9000,
		lifeInsurance: 100000,
		healthInsurance: 25000,
		lifeHealthCombined: 100000,
		parentHealthInsurance: 15000,
		pensionInsurance: 200000,
		pvd: 500000, // Provident fund
		gpf: 500000, // Government pension fund
		rmf: 500000, // 30% of income, max 500,000
		ssf: 200000, // 30% of income, max 200,000
		thaiesg: 300000,
		nsf: 30000, // National savings fund
		retirementCombined: 500000, // Combined cap for retirement funds
		homeLoan: 100000,
		socialFinanceHome: 100000,
		easyEReceipt: 50000,
		shopDeeMeeKuen: 40000,
		donationGeneral: 0.1, // 10% of net income
		donationEducation: 0.1, // 10% (but 2x deduction)
		donationPolitical: 10000
	};

	// Income
	let incomeType = $state<'monthly' | 'annual'>('monthly');
	let monthlyIncome = $state<number | null>(null);
	let annualIncomeInput = $state<number | null>(null);
	let bonusIncome = $state<number | null>(null);
	let otherIncome = $state<number | null>(null);
	let expenseDeductionType = $state<'percent' | 'actual'>('percent');
	let actualExpenses = $state<number | null>(null);

	// Computed annual income
	let annualIncome = $derived.by(() => {
		if (incomeType === 'monthly') {
			const monthly = (monthlyIncome ?? 0) * 12;
			const bonus = bonusIncome ?? 0;
			const other = otherIncome ?? 0;
			return monthly + bonus + other;
		} else {
			return annualIncomeInput ?? 0;
		}
	});

	// Personal deductions
	let hasSpouse = $state(false);
	let spouseHasIncome = $state(false);
	let numChildren = $state(0);
	let numChildrenAfter2561 = $state(0);
	let numParents = $state(0);
	let numDisabled = $state(0);
	let pregnancyCost = $state<number | null>(null);

	// Insurance
	let socialSecurity = $state<number | null>(null);
	let lifeInsurance = $state<number | null>(null);
	let healthInsurance = $state<number | null>(null);
	let parentHealthInsurance = $state<number | null>(null);
	let pensionInsurance = $state<number | null>(null);

	// Retirement funds
	let pvd = $state<number | null>(null); // Provident fund / กบข.
	let rmf = $state<number | null>(null);
	let ssf = $state<number | null>(null);
	let thaiesg = $state<number | null>(null);
	let nsf = $state<number | null>(null); // National savings fund

	// Other deductions
	let homeLoanInterest = $state<number | null>(null);
	let easyEReceipt = $state<number | null>(null);
	let shopDeeMeeKuen = $state<number | null>(null);
	let donationGeneral = $state<number | null>(null);
	let donationEducation = $state<number | null>(null);
	let donationPolitical = $state<number | null>(null);

	// Withholding tax (ภาษีหัก ณ ที่จ่าย)
	let withholdingTaxType = $state<'monthly' | 'annual'>('monthly');
	let monthlyWithholdingTax = $state<number | null>(null);
	let annualWithholdingTax = $state<number | null>(null);

	let result = $derived.by(() => {
		if (annualIncome <= 0) {
			return null;
		}

		// Calculate expense deduction (40% max 100,000 or actual)
		let expenseDeduction = 0;
		if (expenseDeductionType === 'percent') {
			expenseDeduction = Math.min(annualIncome * 0.4, 100000);
		} else {
			expenseDeduction = actualExpenses ?? 0;
		}

		// === Personal deductions ===
		let personalDeductions = LIMITS.personal;

		// Spouse deduction
		if (hasSpouse && !spouseHasIncome) {
			personalDeductions += LIMITS.spouse;
		}

		// Children deduction
		const regularChildren = Math.max(0, numChildren - numChildrenAfter2561);
		personalDeductions += regularChildren * LIMITS.child;
		personalDeductions += numChildrenAfter2561 * LIMITS.childAfter2561;

		// Parent deduction
		personalDeductions += Math.min(numParents, LIMITS.maxParents) * LIMITS.parent;

		// Disabled/handicapped person deduction
		personalDeductions += Math.min(numDisabled, LIMITS.maxDisabled) * LIMITS.disabled;

		// Pregnancy cost
		personalDeductions += Math.min(pregnancyCost ?? 0, LIMITS.pregnancy);

		// === Insurance deductions ===
		const socialSecurityDeduction = Math.min(socialSecurity ?? 0, LIMITS.socialSecurity);

		// Life + Health insurance (combined max 100,000)
		const lifeInsuranceDeduction = Math.min(lifeInsurance ?? 0, LIMITS.lifeInsurance);
		const healthInsuranceDeduction = Math.min(healthInsurance ?? 0, LIMITS.healthInsurance);
		const totalLifeHealthInsurance = Math.min(
			lifeInsuranceDeduction + healthInsuranceDeduction,
			LIMITS.lifeHealthCombined
		);

		const parentHealthInsuranceDeduction = Math.min(parentHealthInsurance ?? 0, LIMITS.parentHealthInsurance);
		const pensionInsuranceDeduction = Math.min(pensionInsurance ?? 0, LIMITS.pensionInsurance);

		// === Retirement funds (with combined cap of 500,000) ===
		// PVD/กบข. - max 15% of income, capped at 500,000
		const pvdMax = Math.min(annualIncome * 0.15, LIMITS.pvd);
		const pvdDeduction = Math.min(pvd ?? 0, pvdMax);

		// RMF - max 30% of income, capped at 500,000
		const rmfMax = Math.min(annualIncome * 0.3, LIMITS.rmf);
		const rmfDeduction = Math.min(rmf ?? 0, rmfMax);

		// SSF - max 30% of income, capped at 200,000
		const ssfMax = Math.min(annualIncome * 0.3, LIMITS.ssf);
		const ssfDeduction = Math.min(ssf ?? 0, ssfMax);

		// THAIESG - max 300,000
		const thaiesgDeduction = Math.min(thaiesg ?? 0, LIMITS.thaiesg);

		// NSF - max 30,000
		const nsfDeduction = Math.min(nsf ?? 0, LIMITS.nsf);

		// Combined retirement cap (PVD + RMF + SSF + pensionInsurance + NSF) max 500,000
		// Note: THAIESG is separate, not included in this cap
		const retirementFundsTotal = pvdDeduction + rmfDeduction + ssfDeduction + pensionInsuranceDeduction + nsfDeduction;
		const retirementFundsCapped = Math.min(retirementFundsTotal, LIMITS.retirementCombined);

		// === Other deductions ===
		const homeLoanDeduction = Math.min(homeLoanInterest ?? 0, LIMITS.homeLoan);
		const easyEReceiptDeduction = Math.min(easyEReceipt ?? 0, LIMITS.easyEReceipt);
		const shopDeeMeeKuenDeduction = Math.min(shopDeeMeeKuen ?? 0, LIMITS.shopDeeMeeKuen);

		// Political donation (max 10,000)
		const politicalDonationDeduction = Math.min(donationPolitical ?? 0, LIMITS.donationPolitical);

		// Education donation (2x deduction, max 10% of income after deductions)
		const educationDonationActual = donationEducation ?? 0;
		const educationDonation2x = educationDonationActual * 2;

		// Calculate net income before general donations
		const netIncomeBeforeDonations =
			annualIncome -
			expenseDeduction -
			personalDeductions -
			socialSecurityDeduction -
			totalLifeHealthInsurance -
			parentHealthInsuranceDeduction -
			retirementFundsCapped -
			thaiesgDeduction -
			homeLoanDeduction -
			easyEReceiptDeduction -
			shopDeeMeeKuenDeduction -
			politicalDonationDeduction;

		// Education donation cap (10% of net income before donations)
		const educationDonationMax = Math.max(0, netIncomeBeforeDonations * LIMITS.donationEducation);
		const educationDonationDeduction = Math.min(educationDonation2x, educationDonationMax);

		// General donation cap (10% of net income after education donation)
		const netAfterEducationDonation = netIncomeBeforeDonations - educationDonationDeduction;
		const generalDonationMax = Math.max(0, netAfterEducationDonation * LIMITS.donationGeneral);
		const generalDonationDeduction = Math.min(donationGeneral ?? 0, generalDonationMax);

		// Net taxable income
		const netTaxableIncome = Math.max(0, netAfterEducationDonation - generalDonationDeduction);

		// Calculate tax
		let totalTax = 0;
		let remainingIncome = netTaxableIncome;
		const taxBreakdown: { bracket: string; income: number; rate: number; tax: number }[] = [];

		for (const bracket of TAX_BRACKETS) {
			if (remainingIncome <= 0) break;

			const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min);

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

		// Calculate withholding tax paid
		let withholdingTaxPaid = 0;
		if (withholdingTaxType === 'monthly') {
			withholdingTaxPaid = (monthlyWithholdingTax ?? 0) * 12;
		} else {
			withholdingTaxPaid = annualWithholdingTax ?? 0;
		}

		// Tax refund or additional tax to pay
		const taxDifference = totalTax - withholdingTaxPaid;
		const isRefund = taxDifference < 0;
		const taxRefundOrPay = Math.abs(taxDifference);

		// Total deductions summary
		const totalDeductions =
			expenseDeduction +
			personalDeductions +
			socialSecurityDeduction +
			totalLifeHealthInsurance +
			parentHealthInsuranceDeduction +
			retirementFundsCapped +
			thaiesgDeduction +
			homeLoanDeduction +
			easyEReceiptDeduction +
			shopDeeMeeKuenDeduction +
			politicalDonationDeduction +
			educationDonationDeduction +
			generalDonationDeduction;

		return {
			grossIncome: annualIncome,
			expenseDeduction,
			personalDeductions,
			insuranceDeductions: socialSecurityDeduction + totalLifeHealthInsurance + parentHealthInsuranceDeduction,
			retirementDeductions: retirementFundsCapped + thaiesgDeduction,
			otherDeductions: homeLoanDeduction + easyEReceiptDeduction + shopDeeMeeKuenDeduction + politicalDonationDeduction + educationDonationDeduction + generalDonationDeduction,
			totalDeductions,
			netTaxableIncome,
			totalTax,
			effectiveTaxRate,
			taxBreakdown,
			netIncomeAfterTax: annualIncome - totalTax,
			monthlyTax: totalTax / 12,
			monthlyNetIncome: (annualIncome - totalTax) / 12,
			withholdingTaxPaid,
			isRefund,
			taxRefundOrPay
		};
	});

	function reset() {
		incomeType = 'monthly';
		monthlyIncome = null;
		annualIncomeInput = null;
		bonusIncome = null;
		otherIncome = null;
		expenseDeductionType = 'percent';
		actualExpenses = null;
		hasSpouse = false;
		spouseHasIncome = false;
		numChildren = 0;
		numChildrenAfter2561 = 0;
		numParents = 0;
		numDisabled = 0;
		pregnancyCost = null;
		socialSecurity = null;
		lifeInsurance = null;
		healthInsurance = null;
		parentHealthInsurance = null;
		pensionInsurance = null;
		pvd = null;
		rmf = null;
		ssf = null;
		thaiesg = null;
		nsf = null;
		homeLoanInterest = null;
		easyEReceipt = null;
		shopDeeMeeKuen = null;
		donationGeneral = null;
		donationEducation = null;
		donationPolitical = null;
		withholdingTaxType = 'monthly';
		monthlyWithholdingTax = null;
		annualWithholdingTax = null;
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

					<!-- Income Type Toggle -->
					<div class="mb-4">
						<div class="flex gap-2 mb-4">
							<button
								class="flex-1 py-2 rounded {incomeType === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
								onclick={() => (incomeType = 'monthly')}
							>
								{$_('taxTh.monthly')}
							</button>
							<button
								class="flex-1 py-2 rounded {incomeType === 'annual' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
								onclick={() => (incomeType = 'annual')}
							>
								{$_('taxTh.annual')}
							</button>
						</div>

						{#if incomeType === 'monthly'}
							<div class="space-y-3">
								<div>
									<label for="monthlyIncome" class="block text-sm font-medium text-gray-700 mb-1">
										{$_('taxTh.monthlySalary')}
									</label>
									<input
										id="monthlyIncome"
										type="number"
										bind:value={monthlyIncome}
										placeholder="0"
										step="1000"
										class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label for="bonusIncome" class="block text-sm font-medium text-gray-700 mb-1">
										{$_('taxTh.bonus')}
									</label>
									<input
										id="bonusIncome"
										type="number"
										bind:value={bonusIncome}
										placeholder="0"
										step="1000"
										class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								<div>
									<label for="otherIncome" class="block text-sm font-medium text-gray-700 mb-1">
										{$_('taxTh.otherIncome')}
									</label>
									<input
										id="otherIncome"
										type="number"
										bind:value={otherIncome}
										placeholder="0"
										step="1000"
										class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
									/>
								</div>
								{#if annualIncome > 0}
									<div class="p-3 bg-blue-50 rounded-lg text-center">
										<span class="text-sm text-gray-600">{$_('taxTh.calculatedAnnual')}:</span>
										<span class="font-semibold text-blue-600 ml-2">฿{annualIncome.toLocaleString()}</span>
									</div>
								{/if}
							</div>
						{:else}
							<div>
								<label for="annualIncome" class="block text-sm font-medium text-gray-700 mb-1">
									{$_('taxTh.annualIncome')}
								</label>
								<input
									id="annualIncome"
									type="number"
									bind:value={annualIncomeInput}
									placeholder="0"
									step="1000"
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						{/if}
					</div>

					<div class="mb-4">
						<span class="block text-sm font-medium text-gray-700 mb-2">
							{$_('taxTh.expenseDeduction')}
						</span>
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
							{$_('taxTh.hasSpouse')} (60,000)
						</label>

						{#if hasSpouse}
							<label class="flex items-center ml-6">
								<input type="checkbox" bind:checked={spouseHasIncome} class="mr-2" />
								{$_('taxTh.spouseHasIncome')}
							</label>
						{/if}

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="numChildren" class="block text-sm font-medium text-gray-700 mb-1">
									{$_('taxTh.numChildren')} (30,000)
								</label>
								<input
									id="numChildren"
									type="number"
									bind:value={numChildren}
									min="0"
									class="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
							<div>
								<label for="numChildrenAfter2561" class="block text-sm font-medium text-gray-700 mb-1">
									{$_('taxTh.numChildrenAfter2561')} (60,000)
								</label>
								<input
									id="numChildrenAfter2561"
									type="number"
									bind:value={numChildrenAfter2561}
									min="0"
									max={numChildren}
									class="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label for="numParents" class="block text-sm font-medium text-gray-700 mb-1">
									{$_('taxTh.numParents')} (30,000/{$_('taxTh.person')})
								</label>
								<input
									id="numParents"
									type="number"
									bind:value={numParents}
									min="0"
									max="4"
									class="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
							<div>
								<label for="numDisabled" class="block text-sm font-medium text-gray-700 mb-1">
									{$_('taxTh.numDisabled')} (60,000/{$_('taxTh.person')})
								</label>
								<input
									id="numDisabled"
									type="number"
									bind:value={numDisabled}
									min="0"
									max="4"
									class="w-full px-4 py-2 border rounded-lg"
								/>
							</div>
						</div>

						<div>
							<label for="pregnancyCost" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.pregnancyCost')} ({$_('taxTh.max')} 60,000)
							</label>
							<input
								id="pregnancyCost"
								type="number"
								bind:value={pregnancyCost}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
					</div>
				</div>

				<!-- Insurance Section -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold mb-4">{$_('taxTh.insurance')}</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="socialSecurity" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.socialSecurity')} ({$_('taxTh.max')} 9,000)
							</label>
							<input
								id="socialSecurity"
								type="number"
								bind:value={socialSecurity}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="lifeInsurance" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.lifeInsurance')} ({$_('taxTh.max')} 100,000)
							</label>
							<input
								id="lifeInsurance"
								type="number"
								bind:value={lifeInsurance}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="healthInsurance" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.healthInsurance')} ({$_('taxTh.max')} 25,000)
							</label>
							<input
								id="healthInsurance"
								type="number"
								bind:value={healthInsurance}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="parentHealthInsurance" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.parentHealthInsurance')} ({$_('taxTh.max')} 15,000)
							</label>
							<input
								id="parentHealthInsurance"
								type="number"
								bind:value={parentHealthInsurance}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div class="md:col-span-2">
							<label for="pensionInsurance" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.pensionInsurance')} ({$_('taxTh.max')} 200,000)
							</label>
							<input
								id="pensionInsurance"
								type="number"
								bind:value={pensionInsurance}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
					</div>
					<p class="text-xs text-gray-500 mt-2">* {$_('taxTh.lifeHealthNote')}</p>
				</div>

				<!-- Retirement Funds Section -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold mb-4">{$_('taxTh.retirementFunds')}</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="pvd" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.pvd')} ({$_('taxTh.max')} 15%)
							</label>
							<input
								id="pvd"
								type="number"
								bind:value={pvd}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="rmf" class="block text-sm font-medium text-gray-700 mb-1">
								RMF ({$_('taxTh.max')} 30%)
							</label>
							<input
								id="rmf"
								type="number"
								bind:value={rmf}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="ssf" class="block text-sm font-medium text-gray-700 mb-1">
								SSF ({$_('taxTh.max')} 200,000)
							</label>
							<input
								id="ssf"
								type="number"
								bind:value={ssf}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="thaiesg" class="block text-sm font-medium text-gray-700 mb-1">
								THAIESG ({$_('taxTh.max')} 300,000)
							</label>
							<input
								id="thaiesg"
								type="number"
								bind:value={thaiesg}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div class="md:col-span-2">
							<label for="nsf" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.nsf')} ({$_('taxTh.max')} 30,000)
							</label>
							<input
								id="nsf"
								type="number"
								bind:value={nsf}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
					</div>
					<p class="text-xs text-gray-500 mt-2">* {$_('taxTh.retirementNote')}</p>
				</div>

				<!-- Other Deductions Section -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold mb-4">{$_('taxTh.otherDeductions')}</h2>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label for="homeLoanInterest" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.homeLoanInterest')} ({$_('taxTh.max')} 100,000)
							</label>
							<input
								id="homeLoanInterest"
								type="number"
								bind:value={homeLoanInterest}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="easyEReceipt" class="block text-sm font-medium text-gray-700 mb-1">
								Easy E-Receipt ({$_('taxTh.max')} 50,000)
							</label>
							<input
								id="easyEReceipt"
								type="number"
								bind:value={easyEReceipt}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="shopDeeMeeKuen" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.shopDeeMeeKuen')} ({$_('taxTh.max')} 40,000)
							</label>
							<input
								id="shopDeeMeeKuen"
								type="number"
								bind:value={shopDeeMeeKuen}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="donationPolitical" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.donationPolitical')} ({$_('taxTh.max')} 10,000)
							</label>
							<input
								id="donationPolitical"
								type="number"
								bind:value={donationPolitical}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="donationEducation" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.donationEducation')} (2x, {$_('taxTh.max')} 10%)
							</label>
							<input
								id="donationEducation"
								type="number"
								bind:value={donationEducation}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
						<div>
							<label for="donationGeneral" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.donationGeneral')} ({$_('taxTh.max')} 10%)
							</label>
							<input
								id="donationGeneral"
								type="number"
								bind:value={donationGeneral}
								placeholder="0"
								class="w-full px-4 py-2 border rounded-lg"
							/>
						</div>
					</div>
				</div>

				<!-- Withholding Tax Section -->
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold mb-4">{$_('taxTh.withholdingTax')}</h2>

					<!-- Withholding Tax Type Toggle -->
					<div class="flex gap-2 mb-4">
						<button
							class="flex-1 py-2 rounded {withholdingTaxType === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
							onclick={() => (withholdingTaxType = 'monthly')}
						>
							{$_('taxTh.monthly')}
						</button>
						<button
							class="flex-1 py-2 rounded {withholdingTaxType === 'annual' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
							onclick={() => (withholdingTaxType = 'annual')}
						>
							{$_('taxTh.annual')}
						</button>
					</div>

					{#if withholdingTaxType === 'monthly'}
						<div>
							<label for="monthlyWithholdingTax" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.monthlyWithholdingTax')}
							</label>
							<input
								id="monthlyWithholdingTax"
								type="number"
								bind:value={monthlyWithholdingTax}
								placeholder="0"
								step="100"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
							{#if monthlyWithholdingTax && monthlyWithholdingTax > 0}
								<p class="text-sm text-gray-500 mt-1">
									{$_('taxTh.annualWithholdingTax')}: ฿{(monthlyWithholdingTax * 12).toLocaleString()}
								</p>
							{/if}
						</div>
					{:else}
						<div>
							<label for="annualWithholdingTax" class="block text-sm font-medium text-gray-700 mb-1">
								{$_('taxTh.annualWithholdingTax')}
							</label>
							<input
								id="annualWithholdingTax"
								type="number"
								bind:value={annualWithholdingTax}
								placeholder="0"
								step="1000"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					{/if}
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
						<div class="mt-2 pt-2 border-t border-blue-200">
							<p class="text-sm text-gray-600">
								{$_('taxTh.monthlyTax')}: <span class="font-semibold">฿{result.monthlyTax.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
							</p>
						</div>
					</div>

					<!-- Tax Refund / Additional Payment -->
					{#if result.withholdingTaxPaid > 0}
						<div class="text-center mb-6 p-4 rounded-lg {result.isRefund ? 'bg-green-50' : 'bg-red-50'}">
							<p class="text-sm text-gray-500 mb-1">
								{$_('taxTh.withholdingTaxPaid')}: ฿{result.withholdingTaxPaid.toLocaleString()}
							</p>
							<p class="text-3xl font-bold {result.isRefund ? 'text-green-600' : 'text-red-600'}">
								{result.isRefund ? '+' : '-'}฿{result.taxRefundOrPay.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
							</p>
							<p class="text-sm font-medium {result.isRefund ? 'text-green-600' : 'text-red-600'} mt-1">
								{result.isRefund ? $_('taxTh.taxRefund') : $_('taxTh.additionalTax')}
							</p>
						</div>
					{/if}

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
						<div class="flex justify-between text-green-600">
							<span>{$_('taxTh.monthlyNetIncome')}:</span>
							<span>฿{result.monthlyNetIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
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
