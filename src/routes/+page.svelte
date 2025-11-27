<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	function switchLocale(lang: string) {
		locale.set(lang);
		localStorage.setItem('locale', lang);
	}
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

			<!-- Calculator Cards -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				<a href="/calculators/profit-loss" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
					<h2 class="text-xl font-semibold mb-2">{$_('calculators.profitLoss.title')}</h2>
					<p class="text-gray-500 text-sm">{$_('calculators.profitLoss.description')}</p>
				</a>

				<a href="/calculators/risk-reward" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
					<h2 class="text-xl font-semibold mb-2">{$_('calculators.riskReward.title')}</h2>
					<p class="text-gray-500 text-sm">{$_('calculators.riskReward.description')}</p>
				</a>

				<a href="/calculators/position-size" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
					<h2 class="text-xl font-semibold mb-2">{$_('calculators.positionSize.title')}</h2>
					<p class="text-gray-500 text-sm">{$_('calculators.positionSize.description')}</p>
				</a>

				<a href="/calculators/fee" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
					<h2 class="text-xl font-semibold mb-2">{$_('calculators.fee.title')}</h2>
					<p class="text-gray-500 text-sm">{$_('calculators.fee.description')}</p>
				</a>

				<a href="/calculators/dca" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
					<h2 class="text-xl font-semibold mb-2">{$_('calculators.dca.title')}</h2>
					<p class="text-gray-500 text-sm">{$_('calculators.dca.description')}</p>
				</a>

				<a href="/calculators/compound" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition">
					<h2 class="text-xl font-semibold mb-2">{$_('calculators.compound.title')}</h2>
					<p class="text-gray-500 text-sm">{$_('calculators.compound.description')}</p>
				</a>

				<a href="/calculators/tax-th" class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition border-2 border-blue-200">
					<h2 class="text-xl font-semibold mb-2">{$_('taxTh.title')}</h2>
					<p class="text-gray-500 text-sm">{$_('taxTh.description')}</p>
				</a>
			</div>
		</div>
	</div>
{/if}
