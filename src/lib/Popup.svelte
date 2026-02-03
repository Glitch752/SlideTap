<script lang="ts">
import type { Snippet } from "svelte";

const { children }: {
    children?: Snippet
} = $props();
</script>

<div class="popup">
    <dialog>
        {@render children?.()}
    </dialog>
</div>

<style lang="scss">
.popup {
    display: grid;
    position: absolute;
    inset: 0;
    place-items: center;
    pointer-events: none;

    &:has(dialog[open]) {
        pointer-events: all;
    }
}

dialog {
    background-color: var(--panel);
    border: none;
    box-shadow: 0 0 5px #00000077;

    transition:
        opacity 200ms ease-in-out,
        display 200ms allow-discrete,
        overlay 200ms allow-discrete;
    
    color: var(--text);
}
</style>