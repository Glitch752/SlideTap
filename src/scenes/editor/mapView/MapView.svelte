<script lang="ts">
    import type { EditorFile, EditorMapID, EditorNoteID } from "../EditorFile";
    import { FULL_LANES } from "../../../game/constants";
    import EditorNote, { normalizeNote, SelectionType } from "../EditorNote.svelte";
    import { type MapNote, MapNoteLayer, MapNoteType } from "../../../Map";
    import { onMount } from "svelte";
    import type { PlaybackState } from "../playback.svelte";
    import ContextMenu from "../menus/ContextMenu.svelte";
    import { get } from "svelte/store";
    
    const {
        file,
        map,
        playbackState = $bindable(),
        subdivisions,
        selectedNotes = $bindable(),
        onmousemove,
        oncopy, onpaste
    }: {
        file: EditorFile,
        map: EditorMapID,
        playbackState: PlaybackState,
        subdivisions: number,
        selectedNotes: Set<EditorNoteID>,
        onmousemove?: (beat: number, lane: number) => void,
        oncopy?: (notes: EditorNoteID[]) => void, onpaste?: () => void
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
    $inspect(mapData);
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

    let gridRef: HTMLDivElement | null = $state(null);
    let noteGridRef: HTMLDivElement | null = $state(null);

    function getBeatFromEvent(e: MouseEvent): number | null {
        if(!gridRef || !noteGridRef) return null;
        const rect = noteGridRef.getBoundingClientRect();
        if(e.clientX < rect.left || e.clientX > rect.right) return null;
        if(e.clientY < rect.top || e.clientY > rect.bottom) return null;
        const y = e.clientY - rect.top;
        const beat = Math.round(y / rowHeightPx - 1 / subdivisions) / subdivisions;
        return beat;
    }
    
    function getLaneFromEvent(e: MouseEvent): number | null {
        if(!gridRef || !noteGridRef) return null;
        const rect = noteGridRef.getBoundingClientRect();
        if(e.clientX < rect.left || e.clientX > rect.right) return null;
        if(e.clientY < rect.top || e.clientY > rect.bottom) return null;
        const x = e.clientX - rect.left;
        const lane = Math.floor(x / colWidthPx);
        return Math.max(0, Math.min(FULL_LANES, lane));
    }

    function onGridPointerDown(e: MouseEvent) {
        if(e.button !== 0) return;

        if(selectedNotes.size > 0) {
            selectedNotes.clear();
            return;
        }

        const lane = getLaneFromEvent(e);
        const beat = getBeatFromEvent(e);
        if(lane === null || beat === null) return;
        if(!(e.target instanceof HTMLElement)) return;
        if(e.target.dataset.gridRow === undefined) return;
        console.log(e.target);

        dragStart = { lane, beat };
        dragEnd = { lane, beat };
        isDragging = true;

        window.addEventListener('pointermove', onGridPointerMove);
        window.addEventListener('pointerup', onGridPointerUp);
    }
    function onGridPointerMove(e: PointerEvent) {
        if(!isDragging) return;

        const lane = getLaneFromEvent(e);
        const beat = getBeatFromEvent(e);
        if(lane === null || beat === null) return;

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

    function deleteNotes(ids: EditorNoteID[]) {
        if(!mapData?.notes) return;
        mapData.notes.update(n => {
            for(const id of ids) {
                n.delete(id);
            }
            return n;
        });
        for(const id of ids) {
            if(selectedNotes.has(id)) {
                selectedNotes.delete(id);
            }
        }
        file.changed();
    }

    onMount(() => {
        function updateGridDimensions() {
            if(noteGridRef) {
                colWidthPx = noteGridRef.offsetWidth / FULL_LANES;
                rowHeightPx = noteGridRef.offsetHeight / times.length;
                leftOffset = noteGridRef.offsetLeft;
                topOffset = noteGridRef.offsetTop;
            }
        }

        updateGridDimensions();

        const resizeObserver = new ResizeObserver(updateGridDimensions);
        if(noteGridRef) {
            resizeObserver.observe(noteGridRef);
        }

        return () => {
            resizeObserver.disconnect();
        };
    });
</script>

<svelte:window onpointermove={onGridPointerMove}></svelte:window>

<!-- TODO: wrapping notes around 0 :c -->
{#snippet menu()}
    {#if selectedNotes.size > 0}
        <button onclick={() => {
            oncopy?.(Array.from(selectedNotes));
        }}>Copy selected</button>
        <button onclick={() => {
            if(!mapData) return;
            oncopy?.(Array.from(get(mapData.notes).keys()));
        }}>Copy all</button>
        <button onclick={() => {
            oncopy?.(Array.from(selectedNotes));
            deleteNotes(Array.from(selectedNotes));
        }}>Cut selected</button>
        <button onclick={() => {
            if(!$notes) return;
            mapData?.notes.update(n => {
                let newIds = new Set<EditorNoteID>();
                for(const id of selectedNotes) {
                    const note = $notes?.get(id);
                    if(!note) continue;
                    const newId = file.generateNoteId();
                    newIds.add(newId);
                    n.set(newId, { ...note, startTime: note.startTime + 1.0 });
                }
                selectedNotes.clear();
                for(const newId of newIds) {
                    selectedNotes.add(newId);
                }
                return n;
            });
            file.changed();
        }}>Duplicate selected</button>
        <button onclick={() => {
            deleteNotes(Array.from(selectedNotes));
        }}>Delete selected</button>
        <button onclick={() => {
            if(!$notes) return;
            mapData?.notes.update(n => {
                for(const id of selectedNotes) {
                    const note = $notes?.get(id);
                    if(!note) continue;
                    n.set(id, normalizeNote({
                        ...note,
                        startTime: Math.round(note.startTime * subdivisions) / subdivisions
                    }, subdivisions));
                }
                return n;
            });
            file.changed();
        }}>Snap selected to grid</button>
    {/if}
    <button onclick={() => {
        onpaste?.();
    }}>Paste</button>
    <hr />
    <button onclick={() => {
        if(!$notes) return;
        selectedNotes.clear();
        for(const [id] of $notes) {
            selectedNotes.add(id);
        }
    }}>Select all</button>
    {#if selectedNotes.size > 0}
        <button onclick={() => {
            selectedNotes.clear();
        }}>Deselect all</button>
    {/if}
{/snippet}

<ContextMenu menu={menu}>
    <svelte:boundary>
        {#snippet failed(error, reset)}
            <p>Map view failed to display: {error}</p>
        {/snippet}

        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="map-grid"
            style="
                grid-template-columns: 5rem 2rem repeat({FULL_LANES}, 1fr);
                grid-template-rows: repeat({times.length}, 1fr);
            "
            onmousedown={onGridPointerDown}
            bind:this={gridRef}
        >
            <span class="column-label">Time</span>
            <span class="column-label">
                <!-- Events column -->
            </span>
            {#each lanes as lane}
                <div class="lane-label">{lane}</div>
            {/each}

            
            <div bind:this={noteGridRef} style="grid-column: 3 / -1; grid-row: 2 / -1;"></div>

            <!-- Rows for each time -->
            <div class="rows">
                {#each times as { beat }}
                    {@const wholeBeat = Math.floor(beat) === beat}
                    <div
                        class="grid-row"
                        data-grid-row={beat}
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

            <div class="time-column" style="grid-column: 1; grid-row: 2 / -1;"></div>

            {#if colWidthPx > 0 && rowHeightPx > 0 && mapData && notes}
                <!-- Notes -->
                {#each $notes as [id, note] (id)}
                    <EditorNote
                        {note}
                        onchange={(updatedNote) => {
                            mapData.notes.update(n => n.set(id, updatedNote));
                            file.changed();
                        }}
                        ondelete={() => deleteNotes([id])}
                        oncopy={() => oncopy?.([id])}
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

                <!-- Drag preview -->
                {#if dragNote}
                    <EditorNote note={dragNote} onchange={() => {}} {colWidthPx} {rowHeightPx} {subdivisions} {leftOffset} {topOffset} />
                {/if}
            {/if}
            
            <div class="playback-head" style="--position: {playbackState.time / trackLength * rowHeightPx * times.length}px;"></div>
        </div>
    </svelte:boundary>
</ContextMenu>

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

.column-label {
    font-size: 0.9em;
    color: var(--text-dim);
}
.lane-label {
    padding: 4px 0;
}
.column-label, .lane-label {
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