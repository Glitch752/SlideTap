<script module lang="ts">
    import type { Scene } from "./scenes/Scene";
    import { SongListScene } from "./scenes/SongList";

    let activeScene: Scene = $state(new SongListScene());
    const Component = $derived(activeScene.component);

    export function loadScene(scene: Scene) {
        activeScene = scene;
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

<div>
    <Component {...(activeScene.componentProps?.() ?? {})} />
</div>

<style lang="scss">
div {
    position: absolute;
    inset: 0;
}
</style>