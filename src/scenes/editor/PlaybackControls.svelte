<script lang="ts">
    import { onMount } from "svelte";
    import { PlaybackType, type PlaybackState } from "./playback.svelte";
    import type { EditorFile } from "./EditorFile";

    const {
        playbackState = $bindable(),
        file
    }: {
        playbackState: PlaybackState,
        file: EditorFile
    } = $props();

    const updateIntervalMs = 1000 / 60;
    let updateInterval: ReturnType<typeof setInterval> | null = $state(null);

    const audioFileData = $derived(file.audioFileData);

    let player: HTMLAudioElement | null = $state(null);

    onMount(() => {
        return () => { // on unmount
            if(updateInterval) clearInterval(updateInterval);
        };
    });
</script>

<div class="controls">
    <button disabled={playbackState.time === 0} title="Skip to beginning" onclick={() => {
        playbackState.time = 0;
    }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20 5v14l-7-7M6 5v14H4V5m9 0v14l-7-7"/></svg>
    </button>

    <button disabled={playbackState.playing !== PlaybackType.Paused} title="Play" onclick={() => {
        playbackState.playing = PlaybackType.PlaybackControls;
        const playbackStartTime = performance.now();
        const timeAtStart = playbackState.time;
        updateInterval = setInterval(() => {
            playbackState.time = timeAtStart + performance.now() - playbackStartTime;
        }, updateIntervalMs);
        $audioFileData?.bufferSource?.start($audioFileData?.context.currentTime, playbackStartTime);
    }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.14v14l11-7z"/></svg>
    </button>
    <button disabled={playbackState.playing === PlaybackType.Paused} title="Pause" onclick={() => {
        playbackState.playing = PlaybackType.Paused;
        if(updateInterval) clearInterval(updateInterval);
        $audioFileData?.bufferSource?.stop();
    }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14 19h4V5h-4M6 19h4V5H6z"/></svg>
    </button>

    <button disabled={playbackState.time >= ($audioFileData?.buffer.duration ?? 0) - 0.1} title="Skip to end" onclick={() => {
        if($audioFileData) {
            playbackState.time = $audioFileData.buffer.duration;
        }
    }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M4 5v14l7-7m7-7v14h2V5m-9 0v14l7-7"/></svg>
    </button>
</div>

<style lang="scss">
.controls {
    display: flex;
    flex-direction: row;
    gap: 0.25rem;
    flex: 0;
    justify-content: flex-end;
}
button {
    padding: 0;
    border: none;
    color: var(--text);
    transition: background-color 0.3s ease, opacity 0.3s ease;
    background-color: transparent;

    &[disabled] {
        opacity: 0.5;
        pointer-events: none;
    }

    &:hover {
        background-color: var(--surface);
    }
}
</style>