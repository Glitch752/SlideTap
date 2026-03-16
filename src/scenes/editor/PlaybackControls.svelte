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
    const trackDuration = $derived($audioFileData?.buffer?.duration ?? 0);

    onMount(() => {
        return () => { // on unmount
            if(updateInterval) clearInterval(updateInterval);
        };
    });

    function formatTime(t: number) {
        if(!isFinite(t)) return '0:00';
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function pause() {
        playbackState.playing = PlaybackType.Paused;
        if(updateInterval) clearInterval(updateInterval);
        file.stopPlayback();
    }

    function onKeyDown(e: KeyboardEvent) {
        if(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return; // don't trigger when typing in inputs
        if(e.code === 'Space') {
            e.preventDefault();
            if(playbackState.playing === PlaybackType.Paused) {
                play();
            } else {
                pause();
            }
        }
    }

    function play() {
        playbackState.playing = PlaybackType.PlaybackControls;
        const playbackStartTime = performance.now();
        const timeAtStart = playbackState.time;
        updateInterval = setInterval(() => {
            playbackState.time = timeAtStart + (performance.now() - playbackStartTime) / 1000;
            if(playbackState.time >= (trackDuration - 0.1)) {
                playbackState.time = trackDuration;
                pause();
            }
        }, updateIntervalMs);

        file.beginPlayback(playbackState.time);
    }
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="controls">
    <span>{formatTime(playbackState.time)} / {formatTime(trackDuration)}</span>

    <button disabled={playbackState.time === 0} title="Skip to beginning" onclick={() => {
        if(playbackState.playing !== PlaybackType.Paused) pause();
        playbackState.time = 0;
    }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M20 5v14l-7-7M6 5v14H4V5m9 0v14l-7-7"/></svg>
    </button>

    <button disabled={playbackState.playing !== PlaybackType.Paused} title="Play" onclick={() => play()}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5.14v14l11-7z"/></svg>
    </button>
    <button disabled={playbackState.playing === PlaybackType.Paused} title="Pause" onclick={() => pause()}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M14 19h4V5h-4M6 19h4V5H6z"/></svg>
    </button>

    <button disabled={playbackState.time >= (trackDuration - 0.1)} title="Skip to end" onclick={() => {
        if($audioFileData) {
            playbackState.time = trackDuration;
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
    align-items: center;
    margin-right: 0.5rem;
}
span {
    font-family: monospace;
    color: var(--text);
    flex-shrink: 0;
    margin-right: 0.5rem;
}
button {
    padding: 0;
    border: none;
    color: var(--text);
    transition: background-color 0.3s ease, opacity 0.3s ease;
    background-color: transparent;
    padding-top: 2px; // visually centers the icons more
    height: 100%;

    &[disabled] {
        opacity: 0.5;
        pointer-events: none;
    }

    &:hover {
        background-color: var(--surface);
    }
}
</style>