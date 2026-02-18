<script module lang="ts">
    import type { Scene } from "./scenes/Scene";
    import { SongListScene } from "./scenes/SongList";

    let activeScene: Scene = $state(new SongListScene());
    const Component = $derived(activeScene.component);

    // Add transition state
    let transitioning = $state(false);

    export function loadScene(scene: Scene) {
        if(transitioning) return;
        transitioning = true;
        
        setTimeout(() => {
            activeScene = scene;
            setTimeout(() => {
                transitioning = false;
            }, 50);
        }, 50);
    }
</script>

<script lang="ts">
    $effect(() => {
        activeScene.init?.();
    });
</script>

<svelte:window
    onkeydown={(e) => activeScene.onKeyDown?.(e)}
    onkeyup={(e) => activeScene.onKeyUp?.(e)}
    onwheel={(e) => activeScene.onScroll?.(e)}
/>

<div class:fade-out={transitioning} class:fade-in={!transitioning}>
    <Component {...(activeScene.componentProps?.() ?? {})} />
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