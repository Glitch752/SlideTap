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

    let dropdownEl: HTMLElement | null = null;
    let menuEl: HTMLElement | null = $state(null);

    function handleClickOutside(event: MouseEvent) {
        if(open) {
            if(
                !dropdownEl?.contains(event.target as Node) &&
                menuEl && !menuEl?.contains(event.target as Node)
            ) {
                open = false;
            }
        }
    }
</script>

<svelte:window onmousedown={handleClickOutside} />

<button class="dropdown" onclick={() => open = !open} bind:this={dropdownEl}>
    <span class="title">{title}</span>
    {#if open}
        <div class="menu" bind:this={menuEl}>
            {@render children()}
        </div>
    {/if}
</button>

<style lang="scss">
    .dropdown {
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
    
    .menu {
        background-color: var(--panel);
        position: absolute;
        top: 100%;
        left: 0;
        min-width: 10em;
        z-index: 200;
        box-shadow: 0 0 8px #00000066;
        border-radius: 5px;
        margin: 5px;
        cursor: default;

        display: flex;
        flex-direction: column;

        :global(button) {
            border: none;
            text-align: left;
            padding: 0.25em 1em;
            box-shadow: none;
            color: var(--text);
            font-size: 1rem;
            --bg-color: var(--panel);
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