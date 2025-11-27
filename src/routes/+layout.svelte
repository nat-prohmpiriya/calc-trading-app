<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import '$lib/i18n';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
