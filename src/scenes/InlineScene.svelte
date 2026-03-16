<script lang="ts">
	import type { Scene } from "./Scene";

    const {
        scene
    }: {
        scene: Scene | null
    } = $props();

    let sceneProps = $state({});
	$effect(() => {
        if(!scene) return;

		sceneProps = scene.componentProps ? scene.componentProps() : {};
        if(!(scene as any)["__initialized__"]) {
            (scene as any)["__initialized__"] = true;
            scene.init?.();
        }
	});

    const Component = $derived(scene?.component);
</script>

{#if scene}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="scene"
    onkeydown={scene?.onKeyDown}
    onkeyup={scene?.onKeyUp}
    onwheel={scene?.onScroll}
>
	<Component {...sceneProps} />
</div>
{/if}
