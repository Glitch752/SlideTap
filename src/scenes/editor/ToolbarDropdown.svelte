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
</script>

<button class="dropdown" onclick={() => open = !open}>
    <span class="title">{title}</span>
    {#if open}
         <div class="menu">
            {@render children()}
        </div>
    {/if}
</button>

<style lang="scss">

</style>