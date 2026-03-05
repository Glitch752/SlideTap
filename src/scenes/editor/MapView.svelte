<script lang="ts">
    import type { EditorFile, EditorMapID, EditorNoteID } from "./EditorFile";
    import { FULL_LANES } from "../../game/constants";
    import EditorNote from "./EditorNote.svelte";

    const {
        file,
        map,
        selectedNotes = $bindable()
    }: {
        file: EditorFile,
        map: EditorMapID,
        selectedNotes: Set<EditorNoteID>
    } = $props();

    const subdivisions = 4;

    const lanes = Array.from({ length: FULL_LANES }, (_, i) => i + 1);

    // Get all times (rows) for the song
    const meta = $derived(file.meta);
    const audioFileData = $derived(file.audioFileData);
    let bpm = $derived($meta.bpm);
    let startTime = $derived($meta.start);
    let endTime = $derived($meta.start + $meta.length);
    let trackLength = $derived($audioFileData?.buffer?.duration ?? 0);

    const mapData = $derived(file.getMap(map));

    // $: times = getSongTimes(file.song, subdivisions);
    let times = $derived.by(() => {
        const total = Math.ceil(trackLength * bpm / 60 * subdivisions);
        return Array.from({ length: total }, (_, i) => ({
            beat: i / subdivisions
        }));
    });

    function isInPlaybackRange(time: number) {
        return time >= startTime * bpm / 60 && time < endTime * bpm / 60;
    }
</script>

<div class="map-grid" style="grid-template-columns: 5rem repeat({FULL_LANES}, 1fr);">
    <span class="time-column-label">Time</span>
    {#each lanes as lane}
        <div class="lane-label">{lane}</div>
    {/each}

    <!-- Rows for each time -->
    {#each times as { beat }}
        {@const wholeBeat = Math.round(beat) === beat}
        <div class="grid-row" class:greyed={!isInPlaybackRange(beat)} class:whole={wholeBeat}>
            <div class="time-label">
                {#if wholeBeat}{
                    beat.toString().padStart(5, String.fromCharCode(/* nbsp */ 160))
                }{:else}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{/if}<span class="decimal">{
                    (beat % 1).toFixed(3).substring(1)
                }</span>
            </div>
        </div>
    {/each}
    {#if times.length === 0}
        <p class="placeholder">No times available. Add a song to sequence.</p>
    {/if}

    <!-- Notes -->
    {#if mapData}
        {#each mapData.notes as [id, note]}
            <EditorNote {note} />
        {/each}
    {/if}
</div>

<style lang="scss">
.map-grid {
    display: grid;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: none;
}
.grid-row {
    display: grid;
    grid-template-columns: subgrid;
    min-height: 24px;
    border-bottom: 1px solid var(--panel);
    padding-left: 0.5rem;
    grid-column: 1 / -1;
    
    &.whole {
        border-bottom: 2px solid var(--panel);
    }
    &.greyed {
        background: var(--section);
        color: var(--text-dim);
        opacity: 0.5;
    }

    .time-label {
        width: 5rem;
        text-align: left;
        padding-right: 8px;
        font-size: 0.9em;
        color: var(--text);
        font-family: monospace;
        font-weight: bold;

        .decimal {
            color: var(--text-dim);
            font-weight: normal;
        }
    }
}

.time-column-label {
    font-size: 0.9em;
    color: var(--text-dim);
}
.lane-label {
    padding: 4px 0;
}
.time-column-label, .lane-label {
    text-align: center;
    background-color: var(--panel);
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
}

.placeholder {
    grid-column: 1 / -1;
    text-align: center;
    color: var(--text-dim);
}
</style>