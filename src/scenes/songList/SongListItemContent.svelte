<script lang="ts">
import type { Writable } from "svelte/store";
import type { Song } from "../../Song";
import { dateFormat, difficultyColor, numberFormat } from "./SongList.svelte";
import { PersistedValue } from "../../utils/persistedValue";

const { song }: { song: Song } = $props();

function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// svelte-ignore state_referenced_locally
let selectedMapIndex: Writable<number> = PersistedValue.get(`mapidx:${song.id}`, 0)?.writable;
const selectedMap = $derived(song.maps[$selectedMapIndex]);
</script>

<span class="title">{song.name}</span>
<span class="artist">{song.artist}</span>
<img src={song.getRelativeFile(song.coverPath)} alt={song.name} />
<div class="data">
    <span>{song.bpm} bpm</span>
    <span>{formatDuration(song.length)} long</span>
</div>
<div class="maps">
    {#each song.maps as map, i}
        <button class="map" class:selected={i === $selectedMapIndex} style="--color: {difficultyColor(map.difficulty)}" onmousedown={() => selectedMapIndex.update(() => i)}>
            <span class="difficulty">{map.difficulty}</span>
            <span class="name">{map.name}</span>
            <span class="notes">{map.notes} notes</span>
        </button>
    {/each}
</div>
<div class="buttons">
    <button class="play" style="--selected-color: {difficultyColor(selectedMap.difficulty)}">
        Play
        <span class="map-name" style="color: {difficultyColor(song.maps[$selectedMapIndex].difficulty)}">{song.maps[$selectedMapIndex].name}</span>
    </button>
    <button class="preview" onclick={() => alert("yeah uh that's not implemented yet")}>Preview</button>
</div>
<div class="leaderboard">
    <h2>Leaderboard</h2>
    {#if song.leaderboard.hasEntries()}
        {#each song.leaderboard.entries as entry, idx}
            <div class="entry">
                <span>{idx + 1}</span>
                <span>{entry.name}</span>
                <span>{numberFormat.format(entry.score)}</span>
                <span>{dateFormat.format(entry.time)}</span>
            </div>
        {/each}
    {:else}
        <p>This song has no leaderboard entries yet. Be the first to add one!</p>
        <p class="note">Note: leaderboard is currently only local.</p>
    {/if}
</div>

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
        width: 7rem;
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

.leaderboard {
    grid-column: 1 / -1;
    grid-row: 6;

    h2 {
        font-size: 1.5rem;
        margin: 1rem 0 0.5rem 0;
    }
    p {
        text-align: center;
        margin: 0.5rem 0;

        &.note {
            color: var(--text-dim);
        }
    }
}
</style>