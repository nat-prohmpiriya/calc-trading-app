<script lang="ts">
	import { _, locale, isLoading } from 'svelte-i18n';

	interface DcaEntry {
		id: number;
		price: number | null;
		amount: number | null;
	}

	let entries = $state<DcaEntry[]>([
		{ id: 1, price: null, amount: null },
		{ id: 2, price: null, amount: null }
	]);

	let nextId = $state(3);

	let result = $derived.by(() => {
		const validEntries = entries.filter(
			(e) => e.price !== null && e.amount !== null && e.price > 0 && e.amount > 0
		);

		if (validEntries.length === 0) {
			return null;
		}

		let totalCost = 0;
		let totalQuantity = 0;

		for (const entry of validEntries) {
			const quantity = entry.amount! / entry.price!;
			totalCost += entry.amount!;
			totalQuantity += quantity;
		}

		const averagePrice = totalCost / totalQuantity;

		return {
			totalCost,
			totalQuantity,
			averagePrice,
			entryCount: validEntries.length
		};
	});

	function addEntry() {
		entries = [...entries, { id: nextId, price: null, amount: null }];
		nextId++;
	}

	function removeEntry(id: number) {
		if (entries.length > 1) {
			entries = entries.filter((e) => e.id !== id);
		}
	}

	function reset() {
		entries = [
			{ id: 1, price: null, amount: null },
			{ id: 2, price: null, amount: null }
		];
		nextId = 3;
	}

	function switchLocale(lang: string) {
		locale.set(lang);
		localStorage.setItem('locale', lang);
	}
</script>

{#if $isLoading}
	<p>Loading...</p>
{:else}
	<div class="min-h-screen bg-gray-100 p-8">
		<div class="max-w-xl mx-auto">
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

			<h1 class="text-3xl font-bold text-gray-800 mb-2">{$_('calculators.dca.title')}</h1>
			<p class="text-gray-600 mb-6">{$_('calculators.dca.description')}</p>

			<!-- Calculator Form -->
			<div class="bg-white rounded-lg shadow p-6">
				<div class="space-y-4">
					{#each entries as entry, index (entry.id)}
						<div class="flex gap-2 items-end">
							<div class="flex-1">
								<label class="block text-sm font-medium text-gray-700 mb-1">
									{$_('dca.buyPrice')} #{index + 1}
								</label>
								<input
									type="number"
									bind:value={entry.price}
									placeholder="0.00"
									step="any"
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
							<div class="flex-1">
								<label class="block text-sm font-medium text-gray-700 mb-1">
									{$_('dca.investAmount')}
								</label>
								<input
									type="number"
									bind:value={entry.amount}
									placeholder="0.00"
									step="any"
									class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
							<button
								onclick={() => removeEntry(entry.id)}
								class="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
								disabled={entries.length <= 1}
							>
								✕
							</button>
						</div>
					{/each}
				</div>

				<!-- Add Entry Button -->
				<button
					onclick={addEntry}
					class="w-full mt-4 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-500 hover:text-blue-500 transition"
				>
					+ {$_('dca.addEntry')}
				</button>

				<!-- Reset Button -->
				<button
					onclick={reset}
					class="w-full mt-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
				>
					{$_('common.reset')}
				</button>
			</div>

			<!-- Result -->
			{#if result}
				<div class="mt-6 bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-semibold mb-4">{$_('common.result')}</h2>

					<!-- Average Price Display -->
					<div class="text-center mb-6 p-4 bg-green-50 rounded-lg">
						<p class="text-sm text-gray-500 mb-1">{$_('dca.averagePrice')}</p>
						<p class="text-4xl font-bold text-green-600">
							{result.averagePrice.toFixed(4)}
						</p>
					</div>

					<div class="space-y-3">
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('dca.totalInvested')}:</span>
							<span class="text-lg">{result.totalCost.toFixed(2)}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('dca.totalQuantity')}:</span>
							<span class="text-lg">{result.totalQuantity.toFixed(6)}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-gray-600">{$_('dca.entries')}:</span>
							<span class="text-lg">{result.entryCount}</span>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
