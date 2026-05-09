<script lang="ts">
    import type { PlaybackState } from "../playback.svelte";

    const {
        bpm,
        subdivisions,
        playbackState = $bindable(),
        getBeatFromEvent
    }: {
        bpm: number,
        subdivisions: number,
        playbackState: PlaybackState,
        getBeatFromEvent: (e: MouseEvent, checkBounds?: boolean, round?: boolean) => number | null
    } = $props();

    let mouseDown = $state(false);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="time-column"
    style="grid-column: 1; grid-row: 2 / -1;"
    onmousedown={(e) => {
        const beat = getBeatFromEvent(e, false, false);
        if(beat !== null) playbackState.time = beat * 60 / bpm;
        if(e.shiftKey) playbackState.time = Math.round(playbackState.time / (60 / bpm) * subdivisions) * (60 / bpm) / subdivisions;
        mouseDown = true;
    }}
    onmousemove={(e) => {
        if(!mouseDown) return;
        const beat = getBeatFromEvent(e, false, false);
        if(beat !== null) playbackState.time = beat * 60 / bpm;
    }}
    onmouseup={(e) => {
        mouseDown = false;
    }}
    onmouseleave={(e) => {
        mouseDown = false;
    }}
></div>