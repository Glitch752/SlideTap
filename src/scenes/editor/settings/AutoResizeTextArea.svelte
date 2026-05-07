<script lang="ts">
  import { onMount } from "svelte";
    import type { HTMLTextareaAttributes } from "svelte/elements";

    let props: HTMLTextareaAttributes = $props();
    let textarea: HTMLTextAreaElement;

    onMount(() => {
        // Auto-resize to fit content
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    });
</script>

<textarea
    {...props}
    bind:this={textarea}
    oninput={(e) => {
        const el = e.target as HTMLTextAreaElement;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
        props.oninput?.(e);
    }}
></textarea>