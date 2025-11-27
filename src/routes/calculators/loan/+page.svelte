<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	let loanAmount = $state<number | null>(null);
	let interestRate = $state<number | null>(null);
	let loanTermYears = $state<number | null>(null);
	let loanTermMonths = $state<number | null>(null);
	let paymentType = $state<'equal' | 'reducing'>('equal'); // equal = เงินต้นคงที่, reducing = เงินต้นลดลง

	let totalMonths = $derived((loanTermYears ?? 0) * 12 + (loanTermMonths ?? 0));

	type ScheduleItem = {
		month: number;
		payment: number;
		principal: number;
		interest: number;
		balance: number;
	};

	type EqualPaymentResult = {
		type: 'equal';
		monthlyPayment: number;
		totalPayment: number;
		totalInterest: number;
		schedule: ScheduleItem[];
		showEllipsis: boolean;
	};

	type ReducingPaymentResult = {
		type: 'reducing';
		monthlyPayment: number;
		lastMonthPayment: number;
		totalPayment: number;
		totalInterest: number;
		schedule: ScheduleItem[];
		showEllipsis: boolean;
	};

	type LoanResult = EqualPaymentResult | ReducingPaymentResult | null;

	let result: LoanResult = $derived.by(() => {
		if (!loanAmount || loanAmount <= 0 || !interestRate || totalMonths <= 0) {
			return null;
		}

		const principal = loanAmount;
		const monthlyRate = interestRate / 100 / 12;
		const n = totalMonths;

		if (paymentType === 'equal') {
			// Equal payment (annuity) - งวดเท่ากันทุกเดือน
			const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
			const totalPayment = monthlyPayment * n;
			const totalInterest = totalPayment - principal;

			// Generate schedule (first 12 and last 12 months)
			const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
			let balance = principal;

			for (let i = 1; i <= n; i++) {
				const interestPayment = balance * monthlyRate;
				const principalPayment = monthlyPayment - interestPayment;
				balance -= principalPayment;

				if (i <= 12 || i > n - 12) {
					schedule.push({
						month: i,
						payment: monthlyPayment,
						principal: principalPayment,
						interest: interestPayment,
						balance: Math.max(0, balance)
					});
				}
			}

			return {
				type: 'equal' as const,
				monthlyPayment,
				totalPayment,
				totalInterest,
				schedule,
				showEllipsis: n > 24
			};
		} else {
			// Reducing balance - เงินต้นลดลง (งวดแรกสูง งวดหลังต่ำ)
			const principalPayment = principal / n;
			let balance = principal;
			let totalInterest = 0;
			const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];

			for (let i = 1; i <= n; i++) {
				const interestPayment = balance * monthlyRate;
				const payment = principalPayment + interestPayment;
				totalInterest += interestPayment;
				balance -= principalPayment;

				if (i <= 12 || i > n - 12) {
					schedule.push({
						month: i,
						payment,
						principal: principalPayment,
						interest: interestPayment,
						balance: Math.max(0, balance)
					});
				}
			}

			const firstPayment = principalPayment + principal * monthlyRate;
			const lastPayment = principalPayment + (principal / n) * monthlyRate;

			return {
				type: 'reducing' as const,
				monthlyPayment: firstPayment, // First month payment
				lastMonthPayment: lastPayment,
				totalPayment: principal + totalInterest,
				totalInterest,
				schedule,
				showEllipsis: n > 24
			};
		}
	});

	function reset() {
		loanAmount = null;
		interestRate = null;
		loanTermYears = null;
		loanTermMonths = null;
		paymentType = 'equal';
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('loan.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('loan.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6 space-y-4">
				<!-- Loan Amount -->
				<div>
					<label for="loanAmount" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('loan.loanAmount')}
					</label>
					<input
						id="loanAmount"
						type="number"
						bind:value={loanAmount}
						placeholder="1,000,000"
						step="10000"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<div class="flex gap-2 mt-2">
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (loanAmount = 500000)}>500K</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (loanAmount = 1000000)}>1M</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (loanAmount = 2000000)}>2M</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (loanAmount = 3000000)}>3M</button>
					</div>
				</div>

				<!-- Interest Rate -->
				<div>
					<label for="interestRate" class="block text-sm font-medium text-gray-700 mb-1">
						{$_('loan.interestRate')} (% {$_('loan.perYear')})
					</label>
					<input
						id="interestRate"
						type="number"
						bind:value={interestRate}
						placeholder="5"
						step="0.1"
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					<div class="flex gap-2 mt-2">
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (interestRate = 3)}>3%</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (interestRate = 5)}>5%</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (interestRate = 7)}>7%</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (interestRate = 8)}>8%</button>
					</div>
				</div>

				<!-- Loan Term -->
				<div>
					<span class="block text-sm font-medium text-gray-700 mb-1">
						{$_('loan.loanTerm')}
					</span>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<input
								type="number"
								bind:value={loanTermYears}
								placeholder="0"
								min="0"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
							<span class="text-sm text-gray-500">{$_('loan.years')}</span>
						</div>
						<div>
							<input
								type="number"
								bind:value={loanTermMonths}
								placeholder="0"
								min="0"
								max="11"
								class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
							<span class="text-sm text-gray-500">{$_('loan.months')}</span>
						</div>
					</div>
					<div class="flex gap-2 mt-2">
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => { loanTermYears = 5; loanTermMonths = 0; }}>5Y</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => { loanTermYears = 10; loanTermMonths = 0; }}>10Y</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => { loanTermYears = 20; loanTermMonths = 0; }}>20Y</button>
						<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => { loanTermYears = 30; loanTermMonths = 0; }}>30Y</button>
					</div>
				</div>

				<!-- Payment Type -->
				<div>
					<span class="block text-sm font-medium text-gray-700 mb-2">
						{$_('loan.paymentType')}
					</span>
					<div class="flex gap-4">
						<label class="flex items-center">
							<input type="radio" bind:group={paymentType} value="equal" class="mr-2" />
							{$_('loan.equalPayment')}
						</label>
						<label class="flex items-center">
							<input type="radio" bind:group={paymentType} value="reducing" class="mr-2" />
							{$_('loan.reducingPayment')}
						</label>
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

					<!-- Monthly Payment -->
					<div class="text-center mb-6 p-4 bg-blue-50 rounded-lg">
						<p class="text-sm text-gray-500 mb-1">{$_('loan.monthlyPayment')}</p>
						<p class="text-4xl font-bold text-blue-600">
							฿{result.monthlyPayment.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
						</p>
						{#if result.type === 'reducing'}
							<p class="text-sm text-gray-500 mt-2">
								{$_('loan.lastMonthPayment')}: ฿{result.lastMonthPayment.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
							</p>
						{/if}
					</div>

					<div class="space-y-3 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">{$_('loan.loanAmount')}:</span>
							<span>฿{loanAmount?.toLocaleString()}</span>
						</div>
						<div class="flex justify-between text-red-500">
							<span>{$_('loan.totalInterest')}:</span>
							<span>+฿{result.totalInterest.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
						</div>
						<hr />
						<div class="flex justify-between font-semibold">
							<span>{$_('loan.totalPayment')}:</span>
							<span>฿{result.totalPayment.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
						</div>
						<div class="flex justify-between text-gray-500">
							<span>{$_('loan.loanTerm')}:</span>
							<span>{totalMonths} {$_('loan.months')} ({(totalMonths / 12).toFixed(1)} {$_('loan.years')})</span>
						</div>
					</div>

					<!-- Payment Schedule -->
					{#if result.schedule.length > 0}
						<div class="mt-6">
							<h3 class="text-sm font-semibold text-gray-700 mb-2">{$_('loan.paymentSchedule')}</h3>
							<div class="overflow-x-auto">
								<table class="w-full text-sm">
									<thead>
										<tr class="border-b bg-gray-50">
											<th class="py-2 px-2 text-left">{$_('loan.month')}</th>
											<th class="py-2 px-2 text-right">{$_('loan.payment')}</th>
											<th class="py-2 px-2 text-right">{$_('loan.principalPaid')}</th>
											<th class="py-2 px-2 text-right">{$_('loan.interestPaid')}</th>
											<th class="py-2 px-2 text-right">{$_('loan.balance')}</th>
										</tr>
									</thead>
									<tbody>
										{#each result.schedule as row, i}
											{#if result.showEllipsis && i === 12}
												<tr class="border-b">
													<td colspan="5" class="py-2 text-center text-gray-400">...</td>
												</tr>
											{/if}
											<tr class="border-b">
												<td class="py-2 px-2">{row.month}</td>
												<td class="py-2 px-2 text-right">฿{row.payment.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
												<td class="py-2 px-2 text-right text-green-600">฿{row.principal.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
												<td class="py-2 px-2 text-right text-red-500">฿{row.interest.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
												<td class="py-2 px-2 text-right">฿{row.balance.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
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
