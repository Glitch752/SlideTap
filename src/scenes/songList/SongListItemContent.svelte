<script lang="ts">
import { get, type Writable } from "svelte/store";
import type { Song } from "../../Song";
import { dateFormat, difficultyColor, numberFormat } from "./SongList.svelte";
import { PersistedValue } from "../../utils/persistedValue";
import { loadScene } from "../../router.svelte";
import { GameScene } from "../../game/Game";
import type { EditorMapData } from "../editor/EditorFile";
  import PracticeModeMenu from "./PracticeModeMenu.svelte";
  import LevelLeaderboard from "./LevelLeaderboard.svelte";

const { song }: { song: Song } = $props();

function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// svelte-ignore state_referenced_locally
let selectedMapIndex: Writable<number> = PersistedValue.get(`mapidx:${song.id}`, 0)?.writable;
const selectedMap: EditorMapData | null = $derived(song.maps[$selectedMapIndex] ?? null);

async function play() {
    loadScene(await GameScene.load(song, get(selectedMapIndex)));
}
async function playPractice(speed: number) {
    loadScene(await GameScene.load(song, get(selectedMapIndex), speed));
}

let practiceMenu: PracticeModeMenu;
</script>

<span class="title">{song.name}</span>
<span class="artist">{song.artist}</span>
<img src={song.cover?.src ?? "/default-cover.jpg"} alt={song.name} />
<div class="data">
    <span>{Math.round(song.bpm)} bpm</span>
    <span>{formatDuration(Math.round(song.length))} long</span>
</div>
<div class="maps">
    {#each song.maps as map, i}
        <button class="map" class:selected={i === $selectedMapIndex} style="--color: {difficultyColor(map.difficulty)}" onmousedown={() => selectedMapIndex.update(() => i)}>
            <span class="difficulty">{map.difficulty}</span>
            <span class="name">{map.name}</span>
            <span class="notes">{map.loadedNoteCount} notes</span>
        </button>
    {/each}
</div>
<div class="buttons">
    <button class="play" style="--selected-color: {difficultyColor(selectedMap?.difficulty ?? 0)}" onclick={play} disabled={!selectedMap}>
        Play
        <span class="map-name" style="color: {difficultyColor(selectedMap?.difficulty ?? 0)}">{selectedMap?.name ?? "Select a map"}</span>
    </button>
    <!-- <button class="preview" onclick={() => alert("yeah uh that's not implemented yet")}>Preview</button> -->
    <button class="preview" onclick={() => practiceMenu.toggle()}>Practice</button>
    <PracticeModeMenu bind:this={practiceMenu} loadPractice={playPractice}/>
</div>
<LevelLeaderboard leaderboard={song.leaderboard} />

<style lang="scss">
.title {
    font-weight: bold;
    font-size: 2rem;
    grid-column: 1;
    grid-row: 1;
}
.artist {
    font-size: 1.5rem;
    grid-column: 1;
    grid-row: 2;
}
img {
    grid-column: 3;
    grid-row: 1 / 5;
    max-height: 10rem;
}
.data {
    grid-column: 2;
    grid-row: 1 / 3;

    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    span {
        background-color: var(--surface);
        padding: 0.5rem;
    }
}
.maps {
    grid-column: 1 / 3;
    grid-row: 4;

    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: flex-end;
    justify-content: flex-end;

    .map {
        --bg-color: color-mix(in srgb, var(--color) 30%, var(--panel));
        min-width: 7rem;
        border: 1px solid var(--color);
        font-size: 1rem;
        text-align: left;
        padding: 0.5rem;
        white-space: nowrap;

        transition: transform 100ms ease-in-out, opacity 100ms ease-in-out;
        opacity: 0.8;
        &.selected {
            transform: translateY(-5px);
            opacity: 1;
        }
    }
    .map .difficulty {
        font-size: 1.25rem;
        font-weight: bold;
        margin-right: 0.25rem;
    }
    .map .notes {
        display: block;
    }
}

.buttons {
    grid-row: 5;
    grid-column: 1 / -1;

    display: flex;
    flex-direction: row;
    gap: 0.5rem;

    position: relative;
}
button {
    border: none;
    --bg-color: var(--surface);

    font-size: 1.5rem;
    color: var(--text);
    padding: 0.5rem 1rem;

    position: relative;

    &.play {
        flex: 3;
        
        .map-name {
            position: absolute;
            right: 1rem;
            font-size: 1.25rem;
        }
    }
    &.preview {
        flex: 1;
    }
}
</style>