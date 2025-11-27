<script lang="ts">
	import { _ } from 'svelte-i18n';

	interface Props {
		href: string;
		titleKey: string;
		descriptionKey: string;
		highlight?: boolean;
	}

	let { href, titleKey, descriptionKey, highlight = false }: Props = $props();
</script>

<a
	{href}
	class="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition {highlight ? 'border-2 border-green-200' : ''}"
>
	<h3 class="text-xl font-semibold mb-2">{$_(titleKey)}</h3>
	<p class="text-gray-500 text-sm">{$_(descriptionKey)}</p>
</a>
