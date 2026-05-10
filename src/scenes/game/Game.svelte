<script lang="ts">
    import { TimerState, type Timer } from "../../game/Timer";
    import PauseMenu from "./PauseMenu.svelte";

    const {
        timer,
        editor
    }: {
        timer: Timer,
        editor: boolean
    } = $props();

    function onkeydown(e: KeyboardEvent) {
        if(!editor && e.code === "Escape") {
            if(timer.state === TimerState.Running) {
                timer.pause();
            } else {
                timer.unpause();
            }
        }
    }
</script>

<svelte:window onkeydown={onkeydown}></svelte:window>

<canvas id="gameCanvas"></canvas>
<canvas id="uiCanvas"></canvas>

{#if !editor}
    <PauseMenu {timer} />
{/if}

<style lang="scss">
canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

#uiCanvas {
    z-index: 50;
}
</style>