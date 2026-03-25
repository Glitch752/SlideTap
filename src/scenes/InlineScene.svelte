<script lang="ts">
  import { onMount } from "svelte";
	import type { Scene } from "./Scene";

    const {
        scene
    }: {
        scene: Scene | null
    } = $props();

    let sceneProps = $state({});
	onMount(() => {
        if(!scene) return;

		sceneProps = scene.componentProps ? scene.componentProps() : {};
        if(!(scene as any)["__initialized__"]) {
            (scene as any)["__initialized__"] = true;
            scene.init?.();
        }
	});

    const Component = $derived(scene?.component);

    let sceneElement = $state<HTMLDivElement | null>(null);
    function ifFocused(handler: ((event: any) => void) | undefined) {
        if(!handler) return () => {};
        return (event: any) => {
            if(sceneElement && (sceneElement.matches(":hover") || sceneElement.matches(":focus-within"))) {
                event.stopPropagation();
                handler(event);
            }
        };
    }
</script>

<svelte:document
    onkeydown={ifFocused(scene?.onKeyDown?.bind(scene))}
    onkeyup={ifFocused(scene?.onKeyUp?.bind(scene))}
    onwheel={ifFocused(scene?.onScroll?.bind(scene))}
></svelte:document>

{#if scene}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="scene"
    bind:this={sceneElement}
>
	<Component {...sceneProps} />
</div>
{/if}
