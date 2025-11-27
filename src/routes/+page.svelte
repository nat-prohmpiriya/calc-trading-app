<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';
	import CalculatorCard from '$lib/components/CalculatorCard.svelte';

	function switchLocale(lang: string) {
		locale.set(lang);
		localStorage.setItem('locale', lang);
	}

	const tradingCalculators = [
		{ href: '/calculators/profit-loss', titleKey: 'calculators.profitLoss.title', descriptionKey: 'calculators.profitLoss.description' },
		{ href: '/calculators/risk-reward', titleKey: 'calculators.riskReward.title', descriptionKey: 'calculators.riskReward.description' },
		{ href: '/calculators/position-size', titleKey: 'calculators.positionSize.title', descriptionKey: 'calculators.positionSize.description' },
		{ href: '/calculators/fee', titleKey: 'calculators.fee.title', descriptionKey: 'calculators.fee.description' },
		{ href: '/calculators/dca', titleKey: 'calculators.dca.title', descriptionKey: 'calculators.dca.description' },
		{ href: '/calculators/compound', titleKey: 'calculators.compound.title', descriptionKey: 'calculators.compound.description' }
	];

	const personalFinanceCalculators = [
		{ href: '/calculators/loan', titleKey: 'loan.title', descriptionKey: 'loan.description' },
		{ href: '/calculators/retirement', titleKey: 'retirement.title', descriptionKey: 'retirement.description' },
		{ href: '/calculators/emergency-fund', titleKey: 'emergency.title', descriptionKey: 'emergency.description' },
		{ href: '/calculators/savings-goal', titleKey: 'savingsGoal.title', descriptionKey: 'savingsGoal.description' },
		{ href: '/calculators/salary-convert', titleKey: 'salary.title', descriptionKey: 'salary.description' },
		{ href: '/calculators/net-worth', titleKey: 'networth.title', descriptionKey: 'networth.description' },
		{ href: '/calculators/tax-th', titleKey: 'taxTh.title', descriptionKey: 'taxTh.description', highlight: true }
	];
</script>

{#if $isLoading}
	<p>Loading...</p>
{:else}
	<div class="min-h-screen bg-gray-100 p-8">
		<div class="max-w-4xl mx-auto">
			<!-- Language Switcher -->
			<div class="flex justify-end gap-2 mb-8">
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

			<!-- Header -->
			<h1 class="text-4xl font-bold text-gray-800 mb-2">{$_('app.name')}</h1>
			<p class="text-gray-600 mb-8">{$_('app.description')}</p>

			<!-- Trading Calculators -->
			<h2 class="text-2xl font-bold text-gray-700 mb-4">Trading</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
				{#each tradingCalculators as calc}
					<CalculatorCard {...calc} />
				{/each}
			</div>

			<!-- Personal Finance Calculators -->
			<h2 class="text-2xl font-bold text-gray-700 mb-4">Personal Finance</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
				{#each personalFinanceCalculators as calc}
					<CalculatorCard {...calc} />
				{/each}
			</div>
		</div>
	</div>
{/if}
