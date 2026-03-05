<script lang="ts">
    import type { EditorFile, EditorMapID, EditorNoteID } from "./EditorFile";
    import { FULL_LANES } from "../../game/constants";

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
    let startTime = $derived($meta.start);
    let endTime = $derived($meta.start + $meta.length);
    let trackLength = $derived($audioFileData?.buffer?.duration ?? 0);

    // $: times = getSongTimes(file.song, subdivisions);
    let times = $derived.by(() => {
        const total = Math.ceil(trackLength * subdivisions);
        return Array.from({ length: total }, (_, i) => ({
            beat: i / subdivisions
        }));
    });

    function isInPlaybackRange(time: number) {
        return time >= startTime && time < endTime;
    }
</script>

<div class="map-grid" style="grid-template-columns: 5rem repeat({FULL_LANES}, 1fr);">
    <span>Time</span>
    {#each lanes as lane}
        <div class="lane-label">{lane}</div>
    {/each}

    <!-- Rows for each time -->
    {#each times as { beat }}
        <div class="grid-row {isInPlaybackRange(beat) ? '' : 'greyed'}">
            <div class="time-label">
                {#if Math.round(beat) === beat}{
                    beat.toString().padStart(5, String.fromCharCode(/* nbsp */ 160))
                }{:else}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{/if}<span class="decimal">{
                    (beat % 1).toFixed(3).substring(1)
                }</span>
            </div>
        </div>
    {/each}
    {#if times.length === 0}
        <p>No times available. Add a song to sequence.</p>
    {/if}
</div>

<style lang="scss">
.map-grid {
    display: grid;
    width: 100%;
    height: 100%;
    overflow-y: auto;
}
.grid-row {
    display: grid;
    grid-template-columns: subgrid;
    min-height: 24px;
    border-bottom: 1px solid var(--panel);
    padding-left: 0.5rem;
    grid-column: 1 / -1;
    
    &.greyed {
        background: var(--section);
        color: var(--text-dim);
        opacity: 0.5;
    }
}
.lane-label {
    text-align: center;
    padding: 4px 0;
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
</style>