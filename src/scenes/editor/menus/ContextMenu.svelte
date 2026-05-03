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

    function handleClickOutside(event: MouseEvent) {
        if(pos && menuEl && !menuEl?.contains(event.target as Node)) {
            pos = null;
            event.preventDefault();
            event.stopPropagation();
        }
    }

    function stopPropagation(e: Event) {
        e.stopPropagation();
    }
</script>

<svelte:window onmousedowncapture={handleClickOutside} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="context-trigger" oncontextmenu={(e) => {
    e.preventDefault();
    e.stopPropagation();
    pos = { x: e.clientX, y: e.clientY };
}}>
    {@render children()}
</div>

{#if pos}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
    class="dropdown" style="left: {pos.x}px; top: {pos.y}px;" bind:this={menuEl}
    onmousedown={stopPropagation} onpointerdown={stopPropagation} onpointermove={stopPropagation} onpointerup={stopPropagation}
    onclick={(e) => {
        pos = null;
    }}
>
    <DropdownContent>
        {@render menu()}
    </DropdownContent>
</div>
{/if}

<style lang="scss">
    .context-trigger {
        display: contents; // Who even knew this existed? My life has been changed
    }
    .dropdown {
        position: fixed;
        z-index: 1000;
    }
</style>