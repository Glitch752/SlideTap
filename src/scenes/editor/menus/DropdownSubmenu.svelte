<script lang="ts">
	import type { Snippet } from "svelte";

	const {
		title,
		children
	}: {
		title: string,
		children: Snippet
	} = $props();
</script>

<div class="submenu-item --button-like">
	<span class="title">{title}</span>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
		<path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
	</svg>

	<div class="submenu">
		{@render children()}
	</div>
</div>

<style lang="scss">
	.submenu-item {
		--bg-color: var(--panel);
		text-align: left;
		font-size: 1rem;
		padding: 0.2em 1em;
		color: var(--text);
		position: relative;
		border: none;
		box-shadow: none;
		cursor: pointer;

		svg {
			position: absolute;
			right: 0.5em;
			top: 50%;
			transform: translateY(-50%);
			color: white;
		}

		&:hover .submenu {
			opacity: 1;
			pointer-events: auto;
		}
	}

	.submenu {
		background-color: var(--panel);
		position: absolute;
		top: 0;
		left: 100%;
		min-width: 10em;
		z-index: 201;
		box-shadow: 0 0 8px #00000066;
		border-radius: 5px;
		display: flex;
		flex-direction: column;

		opacity: 0;
		pointer-events: none;
		
        > :global(*):first-child {
            border-top-left-radius: 5px;
			border-top-right-radius: 5px;
        }
        > :global(*):last-child {
			border-bottom-left-radius: 5px;
			border-bottom-right-radius: 5px;
        }
	}
</style>
