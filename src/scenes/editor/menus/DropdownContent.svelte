<script lang="ts">
    import type { Snippet } from "svelte";
    
    let {
        children,
        el = $bindable()
    }: {
        children: Snippet,
        el?: HTMLElement | null
    } = $props();
</script>

<div class="menu" bind:this={el}>
    {@render children()}
</div>

<style lang="scss">
.menu {
    background-color: var(--panel);
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 10em;
    width: max-content;
    z-index: 200;
    box-shadow: 0 0 8px #00000066;
    border-radius: 5px;
    margin: 5px;
    cursor: default;

    display: flex;
    flex-direction: column;

    :global button {
        border: none;
        text-align: left;
        padding: 0.25em 1em;
        box-shadow: none;
        color: var(--text);
        font-size: 1rem;
        --bg-color: var(--panel);

        &.active {
            --bg-color: var(--surface);
        }
    }
    > :global(span) {
        color: var(--text-dim);
        font-size: 0.9em;
        padding: 0.5em 1em;
    }
    
    > :global(*):first-child {
        border-top-left-radius: 5px;
        border-top-right-radius: 5px;
    }
    > :global(*):last-child {
        border-bottom-left-radius: 5px;
        border-bottom-right-radius: 5px;
    }
    
    :global > :not(hr):not(:global(hr + *)):not(:first-child) {
        border-top: 1px solid var(--surface);
    }

    :global(hr) {
        border: none;
        border-top: 2px solid var(--surface);
        margin: 0.25em 0;
    }
}
</style>