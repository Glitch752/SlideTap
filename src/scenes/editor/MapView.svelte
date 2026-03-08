<script lang="ts">
    import type { EditorFile, EditorMapID, EditorNoteID } from "./EditorFile";
    import { FULL_LANES } from "../../game/constants";
    import EditorNote from "./EditorNote.svelte";
    import { type MapNote, MapNoteLayer, MapNoteType } from "../../Map";
    import { onMount } from "svelte";

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

    let times = $derived.by(() => {
        const total = Math.ceil(trackLength * bpm / 60 * subdivisions);
        return Array.from({ length: total }, (_, i) => ({
            beat: i / subdivisions
        }));
    });

    function isInPlaybackRange(time: number) {
        return time >= startTime * bpm / 60 && time < endTime * bpm / 60;
    }

    // Note creation drag logic
    let isDragging = $state(false);
    let dragStart: { lane: number, beat: number } | null = $state(null);
    let dragEnd: { lane: number, beat: number } | null = $state(null);
    let dragNote: MapNote | null = $derived.by(() => {
        if(!dragStart || !dragEnd) return null;
        return {
            type: MapNoteType.Hold,
            layer: MapNoteLayer.Primary,
            start: {
                start: dragStart.lane,
                width: 1
            },
            end: {
                start: dragEnd.lane,
                width: 1
            },
            startTime: dragStart.beat,
            endTime: dragEnd.beat
        } satisfies MapNote;
    });

    function getLaneFromEvent(e: MouseEvent): number {
        // Find the lane index from the event target or coordinates
        // For now, assume each lane column has a data-lane attribute
        let el = e.target as HTMLElement;
        while(el && !el.dataset.lane) el = el.parentElement as HTMLElement;
        return el ? parseInt(el.dataset.lane!) : 1;
    }
    function getBeatFromEvent(e: MouseEvent): number {
        // Find the beat from the event target or coordinates
        // For now, assume each row has a data-beat attribute
        let el = e.target as HTMLElement;
        while (el && !el.dataset.beat) el = el.parentElement as HTMLElement;
        return el ? parseFloat(el.dataset.beat!) : 0;
    }

    function onGridPointerDown(e: MouseEvent) {
        if (e.button !== 0) return;
        const lane = getLaneFromEvent(e);
        const beat = getBeatFromEvent(e);
        dragStart = { lane, beat };
        dragEnd = { lane, beat };
        isDragging = true;
        window.addEventListener('pointermove', onGridPointerMove);
        window.addEventListener('pointerup', onGridPointerUp);
    }
    function onGridPointerMove(e: PointerEvent) {
        if(!isDragging) return;
        const lane = getLaneFromEvent(e as any);
        const beat = getBeatFromEvent(e as any);
        dragEnd = { lane, beat };
    }
    function onGridPointerUp(e: PointerEvent) {
        if(!isDragging) return;
        isDragging = false;
        window.removeEventListener('pointermove', onGridPointerMove);
        window.removeEventListener('pointerup', onGridPointerUp);
        if(dragNote && mapData) {
            // Add to map
            mapData.notes.set(file.generateNoteId(), dragNote);
            file.changed();
        }
        dragStart = null;
        dragEnd = null;
    }

    let colWidthPx = $state(0);
    let rowHeightPx = $state(0);
    let gridRef: HTMLDivElement | null = $state(null);

    onMount(() => {
        function updateGridDimensions() {
            if(gridRef) {
                colWidthPx = gridRef.scrollWidth / (FULL_LANES + 1);
                rowHeightPx = gridRef.scrollHeight / times.length;
            }
        }

        updateGridDimensions();

        const resizeObserver = new ResizeObserver(updateGridDimensions);
        if(gridRef) {
            resizeObserver.observe(gridRef);
        }

        return () => {
            resizeObserver.disconnect();
        };
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="map-grid"
    style="
        grid-template-columns: 5rem repeat({FULL_LANES}, 1fr);
        grid-template-rows: repeat({times.length}, 1fr);
    "
    onpointerdown={onGridPointerDown}
    bind:this={gridRef}
>
    <span class="time-column-label">Time</span>
    {#each lanes as lane}
        <div class="lane-label" data-lane={lane}>{lane}</div>
    {/each}

    <!-- Rows for each time -->
    <div class="rows">
        {#each times as { beat }}
            {@const wholeBeat = Math.round(beat) === beat}
            <div
                class="grid-row"
                class:greyed={!isInPlaybackRange(beat)}
                class:whole={wholeBeat}
                data-beat={beat}
            >
                <div class="time-label">
                    {#if wholeBeat}{
                        beat.toString().padStart(5, String.fromCharCode(/* nbsp */ 160))
                    }{:else}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{/if}<span class="decimal">{
                        (beat % 1).toFixed(3).substring(1)
                    }</span>
                </div>
            </div>
        {/each}
    </div>
    {#if times.length === 0}
        <p class="placeholder">No times available. Add a song to sequence.</p>
    {/if}

    {#if colWidthPx > 0 && rowHeightPx > 0}
        <EditorNote note={{
            startTime: 1.5,
            endTime: 4,
            start: { start: 1, width: 2 },
            end: { start: 2, width: 4 },
            layer: MapNoteLayer.Primary,
            type: MapNoteType.Hold
        }} {colWidthPx} {rowHeightPx} {subdivisions} />

        <!-- Notes -->
        {#if mapData}
            {#each mapData.notes as [id, note]}
                <EditorNote {note} {colWidthPx} {rowHeightPx} {subdivisions} />
            {/each}
        {/if}

        <!-- Drag preview -->
        {#if dragNote}
            <EditorNote note={dragNote} {colWidthPx} {rowHeightPx} {subdivisions} />
        {/if}
    {/if}
</div>

<style lang="scss">
.map-grid {
    display: grid;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: none;
    position: relative;
}
.rows {
    display: grid;
    grid-template-columns: subgrid;
    grid-template-rows: subgrid;
    grid-column: 1 / -1;
    grid-row: 2 / -1;
}
.grid-row {
    display: grid;
    grid-template-columns: subgrid;
    min-height: 24px;
    border-bottom: 1px solid var(--panel);
    padding-left: 0.5rem;
    grid-column: 1 / -1;
    user-select: none;
    
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