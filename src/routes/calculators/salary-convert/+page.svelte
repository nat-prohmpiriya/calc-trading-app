<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	let inputType = $state<'monthly' | 'hourly' | 'daily' | 'annual'>('monthly');
	let inputAmount = $state<number | null>(null);
	let workHoursPerDay = $state<number>(8);
	let workDaysPerWeek = $state<number>(5);
	let workWeeksPerYear = $state<number>(52);
	let paidHolidays = $state<number>(15);
	let paidSickDays = $state<number>(30);

	let effectiveWorkDays = $derived(workWeeksPerYear * workDaysPerWeek - paidHolidays - paidSickDays);
	let effectiveWorkHours = $derived(effectiveWorkDays * workHoursPerDay);

	let result = $derived.by(() => {
		if (!inputAmount || inputAmount <= 0) {
			return null;
		}

		let annualSalary = 0;

		switch (inputType) {
			case 'monthly':
				annualSalary = inputAmount * 12;
				break;
			case 'hourly':
				annualSalary = inputAmount * effectiveWorkHours;
				break;
			case 'daily':
				annualSalary = inputAmount * effectiveWorkDays;
				break;
			case 'annual':
				annualSalary = inputAmount;
				break;
		}

		const monthlySalary = annualSalary / 12;
		const weeklySalary = annualSalary / workWeeksPerYear;
		const dailySalary = annualSalary / effectiveWorkDays;
		const hourlySalary = annualSalary / effectiveWorkHours;

		// Calculate per minute and per second for fun
		const minuteSalary = hourlySalary / 60;
		const secondSalary = minuteSalary / 60;

		return {
			annual: annualSalary,
			monthly: monthlySalary,
			weekly: weeklySalary,
			daily: dailySalary,
			hourly: hourlySalary,
			minute: minuteSalary,
			second: secondSalary,
			effectiveWorkDays,
			effectiveWorkHours
		};
	});

	function reset() {
		inputType = 'monthly';
		inputAmount = null;
		workHoursPerDay = 8;
		workDaysPerWeek = 5;
		workWeeksPerYear = 52;
		paidHolidays = 15;
		paidSickDays = 30;
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('salary.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('salary.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6 space-y-4">
				<!-- Input Type -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-2">
						{$_('salary.inputType')}
					</label>
					<div class="grid grid-cols-4 gap-2">
						<button
							class="py-2 rounded text-sm {inputType === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
							onclick={() => (inputType = 'monthly')}
						>
							{$_('salary.monthly')}
						</button>
						<button
							class="py-2 rounded text-sm {inputType === 'hourly' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
							onclick={() => (inputType = 'hourly')}
						>
							{$_('salary.hourly')}
						</button>
						<button
							class="py-2 rounded text-sm {inputType === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
							onclick={() => (inputType = 'daily')}
						>
							{$_('salary.daily')}
						</button>
						<button
							class="py-2 rounded text-sm {inputType === 'annual' ? 'bg-blue-500 text-white' : 'bg-gray-200'}"
							onclick={() => (inputType = 'annual')}
						>
							{$_('salary.annual')}
						</button>
					</div>
				</div>

				<!-- Amount Input -->
				<div>
					<label for="inputAmount" class="block text-sm font-medium text-gray-700 mb-1">
						{inputType === 'monthly' ? $_('salary.monthlySalary') :
						 inputType === 'hourly' ? $_('salary.hourlyRate') :
						 inputType === 'daily' ? $_('salary.dailyRate') :
						 $_('salary.annualSalary')}
					</label>
					<input
						id="inputAmount"
						type="number"
						bind:value={inputAmount}
						placeholder={inputType === 'hourly' ? '200' : inputType === 'daily' ? '1500' : '30000'}
						step={inputType === 'hourly' ? '10' : inputType === 'daily' ? '100' : '1000'}
						class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					/>
					{#if inputType === 'monthly'}
						<div class="flex gap-2 mt-2">
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (inputAmount = 15000)}>15K</button>
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (inputAmount = 25000)}>25K</button>
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (inputAmount = 50000)}>50K</button>
							<button class="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300" onclick={() => (inputAmount = 100000)}>100K</button>
						</div>
					{/if}
				</div>

				<!-- Work Schedule Settings -->
				<div class="border-t pt-4">
					<p class="text-sm font-medium text-gray-700 mb-3">{$_('salary.workSchedule')}</p>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="workHoursPerDay" class="block text-xs text-gray-500 mb-1">
								{$_('salary.hoursPerDay')}
							</label>
							<input
								id="workHoursPerDay"
								type="number"
								bind:value={workHoursPerDay}
								min="1"
								max="24"
								class="w-full px-3 py-1 text-sm border rounded-lg"
							/>
						</div>
						<div>
							<label for="workDaysPerWeek" class="block text-xs text-gray-500 mb-1">
								{$_('salary.daysPerWeek')}
							</label>
							<input
								id="workDaysPerWeek"
								type="number"
								bind:value={workDaysPerWeek}
								min="1"
								max="7"
								class="w-full px-3 py-1 text-sm border rounded-lg"
							/>
						</div>
						<div>
							<label for="paidHolidays" class="block text-xs text-gray-500 mb-1">
								{$_('salary.paidHolidays')}
							</label>
							<input
								id="paidHolidays"
								type="number"
								bind:value={paidHolidays}
								min="0"
								max="60"
								class="w-full px-3 py-1 text-sm border rounded-lg"
							/>
						</div>
						<div>
							<label for="paidSickDays" class="block text-xs text-gray-500 mb-1">
								{$_('salary.paidSickDays')}
							</label>
							<input
								id="paidSickDays"
								type="number"
								bind:value={paidSickDays}
								min="0"
								max="60"
								class="w-full px-3 py-1 text-sm border rounded-lg"
							/>
						</div>
					</div>

					<p class="text-xs text-gray-400 mt-2">
						{$_('salary.effectiveWorkDays')}: {effectiveWorkDays} {$_('salary.days')} | {effectiveWorkHours} {$_('salary.hours')}
					</p>
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

					<!-- Main Results -->
					<div class="grid grid-cols-2 gap-4 mb-6">
						<div class="p-4 bg-blue-50 rounded-lg text-center">
							<p class="text-xs text-gray-500">{$_('salary.annual')}</p>
							<p class="text-xl font-bold text-blue-600">฿{result.annual.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</p>
						</div>
						<div class="p-4 bg-green-50 rounded-lg text-center">
							<p class="text-xs text-gray-500">{$_('salary.monthly')}</p>
							<p class="text-xl font-bold text-green-600">฿{result.monthly.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</p>
						</div>
						<div class="p-4 bg-yellow-50 rounded-lg text-center">
							<p class="text-xs text-gray-500">{$_('salary.weekly')}</p>
							<p class="text-xl font-bold text-yellow-600">฿{result.weekly.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</p>
						</div>
						<div class="p-4 bg-purple-50 rounded-lg text-center">
							<p class="text-xs text-gray-500">{$_('salary.daily')}</p>
							<p class="text-xl font-bold text-purple-600">฿{result.daily.toLocaleString('th-TH', { maximumFractionDigits: 0 })}</p>
						</div>
					</div>

					<!-- Detailed Breakdown -->
					<div class="space-y-3 text-sm">
						<div class="flex justify-between items-center p-2 bg-gray-50 rounded">
							<span class="text-gray-600">{$_('salary.hourly')}:</span>
							<span class="font-semibold">฿{result.hourly.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
						</div>
						<div class="flex justify-between items-center p-2 bg-gray-50 rounded">
							<span class="text-gray-600">{$_('salary.perMinute')}:</span>
							<span class="font-semibold">฿{result.minute.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
						</div>
						<div class="flex justify-between items-center p-2 bg-gray-50 rounded">
							<span class="text-gray-600">{$_('salary.perSecond')}:</span>
							<span class="font-semibold">฿{result.second.toLocaleString('th-TH', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
