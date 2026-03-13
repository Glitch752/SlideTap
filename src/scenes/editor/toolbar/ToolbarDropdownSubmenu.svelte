<script lang="ts">
	import type { Snippet } from "svelte";

	const {
		title,
		children
	}: {
		title: string,
		children: Snippet
	} = $props();

	let open = $state(false);

	function handleClickOutside(event: MouseEvent) {
		if(open) {
			const submenu = document.querySelector('.submenu-dropdown');
			const menu = document.querySelector('.submenu-menu');
			if(
				submenu && !submenu.contains(event.target as Node) &&
				menu && !menu.contains(event.target as Node)
			) {
				open = false;
			}
		}
	}
</script>

<svelte:window onmousedown={handleClickOutside} />

<button class="submenu-dropdown" onclick={() => open = !open}>
	<span class="title">{title}</span>
	{#if open}
	<div class="submenu-menu">
		{@render children()}
	</div>
	{/if}
</button>

<style lang="scss">
	.submenu-dropdown {
		--bg-color: var(--panel);
		font-size: 1rem;
		padding: 0.2em 1em;
		color: var(--text);
		position: relative;
		border: none;
		border-right: 1px solid var(--surface);
		box-shadow: none;
		cursor: pointer;
	}
	.submenu-menu {
		background-color: var(--panel);
		position: absolute;
		top: 0;
		left: 100%;
		min-width: 10em;
		z-index: 201;
		box-shadow: 0 0 8px #00000066;
		border-radius: 5px;
		margin: 0 0 0 5px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		> :global(button) {
			border: none;
			text-align: left;
			padding: 0.25em 1em;
			color: var(--text);
			font-size: 1rem;
			--bg-color: var(--panel);
			&:not(:first-child) {
				border-top: 1px solid var(--surface);
			}
		}
	}
</style>
