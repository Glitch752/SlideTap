<script lang="ts">
    import type { EditorFile, EditorMapID, EditorNoteID } from "./EditorFile";
    import { FULL_LANES } from "../../game/constants";
    import EditorNote, { normalizeNote, SelectionType } from "./EditorNote.svelte";
    import { type MapNote, MapNoteLayer, MapNoteType } from "../../Map";
    import { onMount } from "svelte";
    import type { PlaybackState } from "./playback.svelte";
    
    const {
        file,
        map,
        playbackState = $bindable(),
        subdivisions,
        selectedNotes = $bindable(),
        onmousemove,
        oncopy
    }: {
        file: EditorFile,
        map: EditorMapID,
        playbackState: PlaybackState,
        subdivisions: number,
        selectedNotes: Set<EditorNoteID>,
        onmousemove?: (beat: number, lane: number) => void,
        oncopy?: () => void
    } = $props();

    let colWidthPx = $state(0);
    let rowHeightPx = $state(0);
    let leftOffset = $state(0);
    let topOffset = $state(0);

    const lanes = Array.from({ length: FULL_LANES }, (_, i) => i + 1);

    // Get all times (rows) for the song
    const meta = $derived(file.meta);
    const audioFileData = $derived(file.audioFileData);
    let bpm = $derived($meta.bpm);
    let startTime = $derived($meta.start);
    let endTime = $derived($meta.start + $meta.length);
    let trackLength = $derived($audioFileData?.buffer?.duration ?? 0);

    const mapData = $derived(file.getMap(map) ?? null);
    const notes = $derived(mapData?.notes ?? null);

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

        const note: MapNote = {
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
        };

        return normalizeNote(note, subdivisions);
    });

    function getBeatFromEvent(e: MouseEvent): number {
        if(!gridRef) return 0;
        const rect = gridRef?.getBoundingClientRect();
        const y = e.clientY - rect.top - topOffset + gridRef.scrollTop;
        const beat = Math.round(y / rowHeightPx - 1 / subdivisions) / subdivisions;
        return beat;
    }
    
    function getLaneFromEvent(e: MouseEvent): number {
        if(!gridRef) return 0;
        const rect = gridRef.getBoundingClientRect();
        const x = e.clientX - rect.left - leftOffset;
        const lane = Math.floor(x / colWidthPx);
        return Math.max(0, Math.min(FULL_LANES, lane));
    }

    function onGridPointerDown(e: MouseEvent) {
        if(selectedNotes.size > 0) {
            selectedNotes.clear();
            return;
        }
        
        if(e.button !== 0) return;

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

        if(lane >= 0 && lane <= FULL_LANES && beat >= 0) {
            onmousemove?.(beat, lane);
        }

        dragEnd = { lane, beat };
    }
    function onGridPointerUp(e: PointerEvent) {
        if(!isDragging) return;
        isDragging = false;

        window.removeEventListener('pointermove', onGridPointerMove);
        window.removeEventListener('pointerup', onGridPointerUp);

        if(dragNote && mapData) {
            // Add to map_notes
            mapData.notes.update(n => n.set(file.generateNoteId(), dragNote));
            file.changed();
        }

        dragStart = null;
        dragEnd = null;
    }

    let gridRef: HTMLDivElement | null = $state(null);

    onMount(() => {
        function updateGridDimensions() {
            if(gridRef) {
                const reference = gridRef.querySelector('.note-grid-reference') as HTMLElement;
                const style = getComputedStyle(reference);
                colWidthPx = parseFloat(style.width) / FULL_LANES;
                rowHeightPx = parseFloat(style.height) / times.length;
                leftOffset = reference.offsetLeft;
                topOffset = reference.offsetTop;
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

<svelte:window onpointermove={onGridPointerMove}></svelte:window>

<!-- TODO: wrapping notes around 0 :c -->

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="map-grid"
    style="
        grid-template-columns: 5rem repeat({FULL_LANES}, 1fr);
        grid-template-rows: repeat({times.length}, 1fr);
    "
    onmousedown={onGridPointerDown}
    bind:this={gridRef}
>
    <span class="time-column-label">Time</span>
    {#each lanes as lane}
        <div class="lane-label">{lane}</div>
    {/each}

    <div class="note-grid-reference" style="grid-column: 2 / -1; grid-row: 2 / -1;"></div>

    <!-- Rows for each time -->
    <div class="rows">
        {#each times as { beat }}
            {@const wholeBeat = Math.floor(beat) === beat}
            <div
                class="grid-row"
                class:greyed={!isInPlaybackRange(beat)}
                class:whole={wholeBeat}
            >
                <div class="time-label" onmousedown={(e) => {
                    e.stopPropagation();
                    // Set playback position to this time
                    playbackState.time = beat * 60 / bpm;
                }}>
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
        <!-- Notes -->
        {#if mapData && notes}
            {#each $notes as [id, note] (id)}
                <EditorNote
                    {note}
                    onchange={(updatedNote) => {
                        mapData.notes.update(n => n.set(id, updatedNote));
                        file.changed();
                    }}
                    ondelete={() => {
                        mapData.notes.update(n => {
                            n.delete(id);
                            return n;
                        });
                        if(selectedNotes.has(id)) {
                            selectedNotes.delete(id);
                        }
                        file.changed();
                    }}
                    {oncopy}
                    onselect={(type) => {
                        switch(type) {
                            case SelectionType.Add:
                                selectedNotes.add(id);
                                break;
                            case SelectionType.Set:
                                selectedNotes.clear();
                                selectedNotes.add(id);
                                break;
                            case SelectionType.Remove:
                                selectedNotes.delete(id);
                                break;
                        }
                    }}
                    ondrag={(beat, lane) => {
                        if(!$notes) return;

                        // Drag all selected notes by the same amount
                        mapData.notes.update(n => {
                            for(const selectedId of selectedNotes) {
                                const selectedNote = $notes.get(selectedId);
                                if(!selectedNote) continue;

                                const newNote: MapNote = {
                                    ...selectedNote,
                                    start: {
                                        ...selectedNote.start,
                                        start: selectedNote.start.start + lane
                                    },
                                    end: {
                                        ...selectedNote.end,
                                        start: selectedNote.end.start + lane
                                    },
                                    startTime: selectedNote.startTime + beat,
                                    endTime: selectedNote.endTime + beat
                                };

                                n.set(selectedId, normalizeNote(newNote, subdivisions));
                            }

                            return n;
                        });
                        file.changed();
                    }}
                    {rowHeightPx} {colWidthPx} {subdivisions} {leftOffset} {topOffset}
                    selected={selectedNotes.has(id)}
                />
            {/each}
        {/if}

        <!-- Drag preview -->
        {#if dragNote}
            <EditorNote note={dragNote} onchange={() => {}} {colWidthPx} {rowHeightPx} {subdivisions} {leftOffset} {topOffset} />
        {/if}
    {/if}
    
    <div class="playback-head" style="--position: {playbackState.time / trackLength * rowHeightPx * times.length}px;"></div>
</div>

<style lang="scss">
.map-grid {
    display: grid;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
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
    border-top: 1px solid var(--panel);
    padding-left: 0.5rem;
    grid-column: 1 / -1;
    user-select: none;
    
    &.whole {
        border-top: 2px solid var(--panel);
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


.playback-head {
    position: absolute;
    left: 0;
    grid-row: 2;
    width: 100%;
    height: 2px;
    background-color: var(--surface-red);
    transform: translateY(var(--position));
    pointer-events: none;
}
</style>