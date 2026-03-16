<script lang="ts">
    import type { Snippet } from "svelte";
    import DropdownContent from "./DropdownContent.svelte";
    
    const {
        menu,
        children
    }: {
        menu: Snippet,
        children: Snippet
    } = $props();

    let pos: { x: number, y: number } | null = $state(null);
    let menuEl: HTMLElement | null = $state(null);
    
    function handleClickOutside(event: PointerEvent) {
        if(pos && menuEl && !menuEl?.contains(event.target as Node)) {
            pos = null;
            event.preventDefault();
            event.stopPropagation();
        }
    }
</script>

<svelte:window onpointerdowncapture={handleClickOutside} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div oncontextmenu={(e) => {
    e.preventDefault();
    pos = { x: e.clientX, y: e.clientY };
}}>
    {@render children()}
</div>

{#if pos}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="dropdown" style="left: {pos.x}px; top: {pos.y}px;" bind:this={menuEl} onpointerdown={(e) => {
        e.stopPropagation()
    }} onpointerup={(e) => {
        setTimeout(() => {
            pos = null;
        }, 0);
    }}>
    <DropdownContent>
        {@render menu()}
    </DropdownContent>
</div>
{/if}

<style lang="scss">
    .dropdown {
        position: fixed;
        z-index: 1000;
    }
</style>