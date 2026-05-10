<script lang="ts">
    import type { Song } from "../../Song";
    import { difficultyColor } from "./SongList.svelte";

    let {
        song,
        i,
        selectedSongIndex = $bindable(),
        showMapIndex
    }: {
        song: Song;
        i: number;
        selectedSongIndex: number;
        showMapIndex?: number;
    } = $props();

    const map = $derived(showMapIndex ? song.maps[showMapIndex] ?? null : null);
</script>

<button
    class="song"
    class:selected={i === selectedSongIndex}
    data-song-idx="{i}"
    onclick={() => selectedSongIndex = i}
>
    <img src={song.cover?.src ?? "/default-cover.jpg"} alt={song.name} />
    <span class="title">{song.name}</span>
    <span class="artist">{song.artist}</span>
    {#if showMapIndex !== undefined && map}
        <div class="shownMap" style="--color: {difficultyColor(map.difficulty)}">
            <span class="name">{map.name}</span>
            <span class="difficulty">{map.difficulty}</span>
            <span class="notes">{map.loadedNoteCount} notes</span>
        </div>
    {:else}
        <div class="maps">
            {#each song.maps as map}
                <span style="--color: {difficultyColor(map.difficulty)}">{map.difficulty}</span>
            {/each}
        </div>
    {/if}
</button>

<style lang="scss">
.song {
    background-color: var(--panel);

    width: 100%;

    padding: 0.5rem;
    display: grid;
    column-gap: 1rem;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;

    translate: -2rem 0;
    opacity: 0.4;

    text-align: left;
    border: none;
    box-shadow: none;
    color: var(--text);

    &.selected {
        translate: 0;
        opacity: 1;
    }
    transition: translate 200ms ease, opacity 200ms ease;
}

img {
    grid-row: 1 / 3;
    grid-column: 1;
    height: 5rem;
}

.title {
    margin-top: auto;
    font-weight: bold;
    font-size: 1.5rem;
    grid-row: 1;
    grid-column: 2;
}
.artist {
    font-size: 1.25rem;
    grid-row: 2;
    grid-column: 2;
}

.maps {
    grid-column: 3;
    grid-row: 1 / 3;

    display: grid;
    grid-template-rows: repeat(2, 1fr);
    gap: 0.25rem;
    grid-auto-flow: column;

    padding: 0.5rem;

    span {
        background-color: color-mix(in srgb, var(--color) 30%, var(--panel));
        border: 1px solid var(--color);
        border-radius: 50%;

        // This is a bunch of messy constants, but whatever
        height: 1.75rem;
        width: 1.75rem;
        padding: 0.25rem;
        
        display: grid;
        place-items: center;
        line-height: 1.375rem;
    }
}

.shownMap {
    grid-column: 3;
    grid-row: 1 / 3;
    place-self: center;
    margin-right: 0.5rem;

    background-color: color-mix(in srgb, var(--color) 30%, var(--panel));
    border: 1px solid var(--color);
    padding: 0.25rem 1rem;

    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: 1fr auto auto 1fr;

    .name {
        font-size: 1.1rem;
        grid-column: 1 / 3;
        grid-row: 2;
        text-align: left;
    }
    .difficulty {
        font-size: 1.25rem;
        font-weight: bold;
        margin-right: 0.5rem;
        grid-row: 3;
    }
    .notes {
        font-size: 0.875rem;
        color: var(--text-dim);
        grid-row: 3;
        place-self: center;
    }
}
</style>