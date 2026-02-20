<script lang="ts">
  import type { Snippet } from "svelte";

    const {
        title,
        children
    }: {
        title: string,
        children: Snippet
    } = $props();

    let position: {
        x: number,
        y: number,
        width: number,
        height: number
    } = $state({
        x: 100,
        y: 100,
        width: 400,
        height: 300
    });
</script>

<div class="window" style="left: {position.x}px; top: {position.y}px; width: {position.width}px; height: {position.height}px;">
    <div class="titlebar">
        <span class="title">{title}</span>
    </div>
    <div class="content">
        {@render children()}
    </div>
</div>

<style lang="scss">
.window {
    position: absolute;
    background-color: var(--panel);
}
</style>