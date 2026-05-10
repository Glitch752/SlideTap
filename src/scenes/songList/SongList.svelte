<script module lang="ts">
  import { loadScene } from "../../router.svelte";
import { Song } from "../../Song";
import { songArchives } from "../../songs";
  import { MenuScene } from "../Menu";
import SongListItemContent from "./SongListItemContent.svelte";

const songs = (await Promise.all(songArchives.map(
    (ar) => Song.load(ar).catch((e) => {
        console.error(`Failed to load song ${ar.songName}:\n`, e);
        return null;
    })
))).filter((s): s is Song => s !== null);

export function difficultyColor(difficulty: number): string {
    return `hsl(${240 - difficulty / 100 * 240}, 100.00%, 80.00%)`;
}
export const numberFormat = Intl.NumberFormat(undefined, {
    style: "decimal"
});
export const dateFormat = Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
});
</script>

<script lang="ts">
import SettingsContainer from "../menu/SettingsContainer.svelte";
import SmallSongPreview from "./SmallSongPreview.svelte";

let deltaAccumulator = $state(0);
let lastScrollTime = $state(0);
let selectedSongIndex = $state(0);

function onScroll(event: WheelEvent): void {
    if(Date.now() - lastScrollTime < 50) return;

    deltaAccumulator += event.deltaY;
    if(Math.abs(deltaAccumulator) < 300) return;
    
    selectedSongIndex = (
        selectedSongIndex + songs.length + Math.sign(event.deltaY)
    ) % songs.length;

    deltaAccumulator = 0;
    lastScrollTime = Date.now();
}

let songListElement: HTMLDivElement;
let songInfosElement: HTMLDivElement;

let songListFocusHeight: number = $state(0);
let songInfosFocusHeight: number = $state(0);

$effect(() => {
    const selector = `[data-song-idx="${selectedSongIndex}"]`
    songListFocusHeight = songListElement.querySelector<HTMLElement>(selector)?.offsetTop ?? 0;
    songInfosFocusHeight = songInfosElement.querySelector<HTMLElement>(selector)?.offsetTop ?? 0;
});

function onKeydown(event: KeyboardEvent) {
    if(event.key === "ArrowUp") {
        selectedSongIndex = (selectedSongIndex + songs.length - 1) % songs.length;
    } else if(event.key === "ArrowDown") {
        selectedSongIndex = (selectedSongIndex + 1) % songs.length;
    }
}

let settings: SettingsContainer;
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Autoplay the selected song -->
<audio
    src={songs[selectedSongIndex].audioFileData?.url}
    autoplay
    volume="0.3"
    onplay={(e) => {
        // Offset start time
        const audio = e.currentTarget as HTMLAudioElement;
        audio.currentTime = audio.duration * 0.3;
    }}
></audio>

<header>
    <button onclick={() => loadScene(new MenuScene())}>Back</button>
    <button onclick={() => settings.open()}>Settings</button>
</header>

<SettingsContainer bind:this={settings}></SettingsContainer>

<div class="song-list" onwheel={onScroll} role="listbox" tabindex="0">
    <div class="list" bind:this={songListElement} style="--focus-height: {songListFocusHeight}px">
        {#each songs as song, i}
            <SmallSongPreview {song} {i} bind:selectedSongIndex={selectedSongIndex} />
        {/each}
    </div>
    <div class="info" bind:this={songInfosElement} style="--focus-height: {songInfosFocusHeight}px">
        {#each songs as song, i}
            <div class="item" class:selected={i === selectedSongIndex} data-song-idx="{i}">
                <SongListItemContent {song} />
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    gap: 1rem;
    padding: 0.5rem;

    button {
        --bg-color: var(--panel);
        color: var(--text);
        border: none;
        padding: 0.5rem 1rem;
        font-size: 1rem;
        cursor: pointer;
    }
}

.song-list {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    padding: 2rem;
    height: 100%;
}

.list {
    flex: 1;
    height: 100%;

    display: flex;
    flex-direction: column;
    gap: 1rem;

    transform: translateY(calc(var(--focus-height) * -1));
    transition: transform 200ms ease;
}

.info {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    flex: 1.75;
    height: 100%;

    transform: translateY(calc(var(--focus-height) * -1));
    transition: transform 200ms ease;
}

.info .item {
    background-color: var(--panel);

    display: grid;
    grid-template-columns: 1fr auto auto;
    grid-template-rows: auto 1fr auto auto auto auto;
    gap: 0.5rem;
    
    padding: 1rem;

    translate: 2rem 0;
    opacity: 0.4;
    &:global(.selected) {
        translate: 0;
        opacity: 1;
    }
    transition: translate 200ms ease, opacity 200ms ease;

    &:not(:global(.selected)) :global(*) {
        pointer-events: none;
    }
}
</style>