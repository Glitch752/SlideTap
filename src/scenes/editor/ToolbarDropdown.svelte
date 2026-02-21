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
            const dropdown = document.querySelector('.dropdown');
            const menu = document.querySelector('.menu');
            if(
                dropdown && !dropdown.contains(event.target as Node) &&
                menu && !menu.contains(event.target as Node)
            ) {
                open = false;
            }
        }
    }
</script>

<svelte:window onmousedown={handleClickOutside} />

<button class="dropdown" onclick={() => open = !open}>
    <span class="title">{title}</span>
    {#if open}
    <div class="menu">
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