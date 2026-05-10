<script lang="ts">
    import { activeScene } from './router.svelte';

    $effect(() => {
        activeScene.scene.init?.();
    });

    const Component = $derived(activeScene.scene.component);
</script>

<svelte:window
    onkeydown={(e) => activeScene.scene.onKeyDown?.(e)}
    onkeyup={(e) => activeScene.scene.onKeyUp?.(e)}
    onwheel={(e) => activeScene.scene.onScroll?.(e)}
/>

<div class:fade-out={activeScene.transitioning} class:fade-in={!activeScene.transitioning}>
    <Component {...(activeScene.scene.componentProps?.() ?? {})} />
</div>

<style lang="scss">
div {
    position: absolute;
    inset: 0;
    transition: opacity 100ms ease-in-out;
    opacity: 1;
}
.fade-out {
    opacity: 0;
}
.fade-in {
    opacity: 1;
}
</style>