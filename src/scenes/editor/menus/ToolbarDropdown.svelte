<script lang="ts">
    import type { Snippet } from "svelte";
  import DropdownContent from "./DropdownContent.svelte";
    
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
        <DropdownContent bind:el={menuEl}>
            {@render children()}
        </DropdownContent>
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
</style>