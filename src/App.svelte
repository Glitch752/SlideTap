<script lang="ts">
    import { activeScene, activeComponent, transitioning } from './router';

    // $derived wraps the store value so Component stays reactive and
    // only causes a remount when the component class itself changes.
    const Component = $derived($activeComponent);

    $effect(() => {
        $activeScene.init?.();
    });
</script>

<svelte:window
    onkeydown={(e) => $activeScene.onKeyDown?.(e)}
    onkeyup={(e) => $activeScene.onKeyUp?.(e)}
    onwheel={(e) => $activeScene.onScroll?.(e)}
/>

<div class:fade-out={$transitioning} class:fade-in={!$transitioning}>
    <Component {...($activeScene.componentProps?.() ?? {})} />
</div>

<style lang="scss">
div {
    position: absolute;
    inset: 0;
    transition: opacity 50ms ease-in-out;
    opacity: 1;
}
.fade-out {
    opacity: 0;
}
.fade-in {
    opacity: 1;
}
</style>