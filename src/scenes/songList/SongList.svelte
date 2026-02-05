<script module>
import { Song } from "../../Song";
  import SongListItemContent from "./SongListItemContent.svelte";

export const songs = await Promise.all([
    Song.load("kontonBoogie"),
    Song.load("badApple"),
    Song.load("kontonBoogie"),
    Song.load("badApple"),
    Song.load("kontonBoogie"),
    Song.load("badApple"),
    Song.load("kontonBoogie"),
    Song.load("badApple"),
    Song.load("kontonBoogie"),
    Song.load("badApple")
]);

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
</script>

<div class="song-list" onwheel={onScroll}>
    <div class="list" bind:this={songListElement} style="--focus-height: {songListFocusHeight}px">
        {#each songs as song, i}
            <div class="song" class:selected={i === selectedSongIndex} data-song-idx="{i}">
                <img src={song.getRelativeFile(song.coverPath)} alt={song.name} />
                <span class="title">{song.name}</span>
                <span class="artist">{song.artist}</span>
                <div class="maps">
                    {#each song.maps as map}
                        <span style="--color: {difficultyColor(map.difficulty)}">{map.difficulty}</span>
                    {/each}
                </div>
            </div>
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

.song {
    background-color: var(--panel);

    padding: 0.5rem;
    display: grid;
    column-gap: 1rem;
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;

    translate: -2rem 0;
    opacity: 0.4;
    &.selected {
        translate: 0;
        opacity: 1;
    }
    transition: translate 200ms ease, opacity 200ms ease;

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
    &.selected {
        translate: 0;
        opacity: 1;
    }
    transition: translate 200ms ease, opacity 200ms ease;

    &:not(.selected) * {
        pointer-events: none;
    }
}
</style>