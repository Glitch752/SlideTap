<script lang="ts" module>
    export enum SelectionType {
        Add,
        Set,
        Remove
    }

    export function normalizeNote(note: MapNote, subdivisions: number): MapNote {
        if(note.start.width === 0) note.start.width = 1;
        if(note.end.width === 0) note.end.width = 1;
        if(note.endTime === note.startTime) {
            note.endTime += 1 / subdivisions;
        }

        if(note.endTime < note.startTime) {
            [note.startTime, note.endTime] = [note.endTime, note.startTime];
            [note.start, note.end] = [note.end, note.start];
        }

        if(note.startTime < 0) note.startTime = 0;
        if(note.endTime < 1 / subdivisions) note.endTime = 1 / subdivisions;

        if(note.start.width < 0) {
            note.start.width = -note.start.width;
            note.start.start -= note.start.width;
        }
        if(note.end.width < 0) {
            note.end.width = -note.end.width;
            note.end.start -= note.end.width;
        }

        return note;
    }
</script>

<script lang="ts">
    import { getNoteColor, MapNoteType, type MapNote } from "../../Map";
    import { _$lazyEffect } from "../../utils/effect.svelte";
    import ContextMenu from "./menus/ContextMenu.svelte";

    const id = $props.id();

    let {
        note,
        onchange,
        ondelete,
        onselect,
        ondrag,
        colWidthPx,
        rowHeightPx,
        leftOffset,
        topOffset,
        subdivisions,
        selected,
    }: {
        note: MapNote,
        onchange: (note: MapNote) => void,
        ondelete?: () => void,
        onselect?: (type: SelectionType) => void,
        ondrag?: (deltaBeats: number, deltaLanes: number) => void,
        colWidthPx: number,
        rowHeightPx: number,
        leftOffset: number,
        topOffset: number,
        subdivisions: number,
        selected?: boolean
    } = $props();

    let wasSelectedOnPress = false;
    let dragged = false;

    const noteColor = $derived(getNoteColor(note.type, note.layer));

    enum DragHandle {
        TopLeft,
        TopRight,
        BottomLeft,
        BottomRight
    }

    // drag logic
    let draggingHandle: DragHandle | null = null;
    let dragOrigin = { x: 0, y: 0 };
    let dragAccumulated = { x: 0, y: 0 };
    let noteOrigin = { startSpan: { start: 0, width: 0 }, endSpan: { start: 0, width: 0 }, startBeat: 0, endBeat: 0 };

    function onHandlePointerDown(which: DragHandle, e: PointerEvent) {
        draggingHandle = which as any;
        dragOrigin = { x: e.clientX, y: e.clientY };
        noteOrigin = {
            startSpan: { ...note.start },
            endSpan: { ...note.end },
            startBeat: note.startTime,
            endBeat: note.endTime
        };

        window.addEventListener('pointermove', onHandlePointerMove);
        window.addEventListener('pointerup', onHandlePointerUp);

        onHandlePointerMove(e);

        e.stopPropagation();
    }

    function onHandlePointerMove(e: PointerEvent) {
        if(draggingHandle === null) return;
        
        const deltaX = e.clientX - dragOrigin.x;
        const deltaY = e.clientY - dragOrigin.y;

        const laneDelta = deltaX / colWidthPx;
        const beatDelta = deltaY / rowHeightPx / subdivisions;

        const clampLane = (lane: number) => e.shiftKey ? lane : Math.round(lane);
        const clampBeat = (beat: number) => e.shiftKey ? beat : Math.round(beat * subdivisions) / subdivisions;

        switch(draggingHandle) {
            case DragHandle.TopLeft:
                note.start.start = clampLane(noteOrigin.startSpan.start + laneDelta);
                if(!e.ctrlKey) note.start.width = noteOrigin.startSpan.start + noteOrigin.startSpan.width - note.start.start;
                note.startTime = clampBeat(noteOrigin.startBeat + beatDelta);
                break;
            case DragHandle.TopRight:
                if(e.ctrlKey) note.start.start = clampLane(noteOrigin.startSpan.start + laneDelta);
                else note.start.width = clampLane(noteOrigin.startSpan.width + laneDelta);
                note.startTime = clampBeat(noteOrigin.startBeat + beatDelta);
                break;
            case DragHandle.BottomLeft:
                note.end.start = clampLane(noteOrigin.endSpan.start + laneDelta);
                if(!e.ctrlKey) note.end.width = noteOrigin.endSpan.start + noteOrigin.endSpan.width - note.end.start;
                note.endTime = clampBeat(noteOrigin.endBeat + beatDelta);
                break;
            case DragHandle.BottomRight:
                note.end.width = clampLane(noteOrigin.endSpan.width + laneDelta);
                note.endTime = clampBeat(noteOrigin.endBeat + beatDelta);
                break;
        }

        note = normalizeNote(note, subdivisions);

        onchange({ ...note });
    }

    function onHandlePointerUp(e: PointerEvent) {
        draggingHandle = null;

        window.removeEventListener('pointermove', onHandlePointerMove);
        window.removeEventListener('pointerup', onHandlePointerUp);
    }

    function onDragPointerMove(e: PointerEvent) {
        dragged = true;

        // Calculate delta from last event
        const deltaX = e.clientX - dragOrigin.x - dragAccumulated.x;
        const deltaY = e.clientY - dragOrigin.y - dragAccumulated.y;
    
        // Snap to grid
        const snappedDeltaX = e.shiftKey ? deltaX : Math.round(deltaX / colWidthPx) * colWidthPx;
        const snappedDeltaY = e.shiftKey ? deltaY : Math.round(deltaY / rowHeightPx) * rowHeightPx;
    
        // Update accumulated drag
        dragAccumulated.x += snappedDeltaX;
        dragAccumulated.y += snappedDeltaY;
    
        // Convert snapped pixel deltas to logical deltas
        const dx = snappedDeltaX / colWidthPx;
        const dy = snappedDeltaY / rowHeightPx / subdivisions;
    
        if(dx !== 0 || dy !== 0) {
            ondrag?.(dy, dx);
        }
    }
    function onDragPointerUp(e: PointerEvent) {
        window.removeEventListener('pointermove', onDragPointerMove);
        window.removeEventListener('pointerup', onDragPointerUp);

        if(dragged) {
            onchange({ ...note });
        }
    }

    const leftColumn = $derived(Math.min(note.start.start, note.end.start));
    const rightColumn = $derived(Math.max(note.start.start + note.start.width, note.end.start + note.end.width));
    
    const widthColumns = $derived(rightColumn - leftColumn);
    const heightRows = $derived(note.endTime * subdivisions - note.startTime * subdivisions);

    const columnToCX = (col: number) => (col - leftColumn) / (rightColumn - leftColumn) * 100;

    const startLeftHandleCX = $derived(columnToCX(note.start.start));
    const startRightHandleCX = $derived(columnToCX(note.start.start + note.start.width));
    const endLeftHandleCX = $derived(columnToCX(note.end.start));
    const endRightHandleCX = $derived(columnToCX(note.end.start + note.end.width));

    const xToPixels = (x: number) => x / 100 * widthColumns * colWidthPx;
    const yToPixels = (y: number) => y / 100 * heightRows * rowHeightPx;
    const getArcCommand = (x1: number, y1: number, x2: number, y2: number) => {
        const px1 = xToPixels(x1), py1 = yToPixels(y1), px2 = xToPixels(x2), py2 = yToPixels(y2);

        // vertically align control points with start/end so we get vertical tangents
        const cp1y = py1 + (py2 - py1) / 2;
        const cp2y = py2 - (py2 - py1) / 2;

        return `C ${px1} ${cp1y}, ${px2} ${cp2y}, ${px2} ${py2}`;
    };
    const getFillPath = () => {
        const topLine = `M ${xToPixels(startLeftHandleCX)} ${yToPixels(0)} L ${xToPixels(startRightHandleCX)} ${yToPixels(0)}`;
        const rightArc = getArcCommand(startRightHandleCX, 0, endRightHandleCX, 100);
        const bottomLine = `L ${xToPixels(endLeftHandleCX)} ${yToPixels(100)}`;
        const leftArc = getArcCommand(endLeftHandleCX, 100, startLeftHandleCX, 0);

        // Draw top line, right arc down, bottom line, left arc up
        return `${topLine} ${rightArc} ${bottomLine} ${leftArc} Z`;
    }
</script>

{#snippet noteMenu()}
    <button onclick={() => {
        ondelete?.();
    }}>Delete</button>
    <button onclick={() => {
        note = normalizeNote({
            ...note,
            startTime: Math.round(note.startTime * subdivisions) / subdivisions,
            endTime: Math.round(note.endTime * subdivisions) / subdivisions,
            start: {
                start: Math.round(note.start.start),
                width: Math.round(note.start.width)
            },
            end: {
                start: Math.round(note.end.start),
                width: Math.round(note.end.width)
            }
        }, subdivisions);
        onchange({ ...note });
    }}>Snap to grid</button>
{/snippet}

<ContextMenu menu={noteMenu}>
    <svg
        style="left: {leftColumn * colWidthPx + leftOffset}px; top: {note.startTime * subdivisions * rowHeightPx + topOffset}px; width: {(rightColumn - leftColumn) * colWidthPx}px; height: {(note.endTime * subdivisions - note.startTime * subdivisions) * rowHeightPx}px;"
        class:selected={selected}
    >
        <defs>
            <linearGradient id="noteGradient-{id}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="{noteColor}" stop-opacity="{selected ? 0.5 : 0.3}" />
                <stop offset="100%" stop-color="{noteColor}" stop-opacity="{selected ? 0.35 : 0.2}" />
            </linearGradient>
        </defs>

        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <path
            class="note-fill"
            d={getFillPath()}
            fill="url(#noteGradient-{id})"
            stroke={noteColor}
            stroke-width="2"
            
            onpointerdowncapture={(e) => {
                if(e.button !== 0) return; // Only left click
                
                e.stopPropagation();

                if(selected) {
                    // Allow dragging
                    dragged = false;
                    dragOrigin = { x: e.clientX, y: e.clientY };
                    dragAccumulated = { x: 0, y: 0 };
                    window.addEventListener('pointermove', onDragPointerMove);
                    window.addEventListener('pointerup', onDragPointerUp, { once: true });
                    
                    return;
                }
                wasSelectedOnPress = selected ?? false;

                onselect?.(e?.shiftKey ? SelectionType.Add : SelectionType.Set);
            }}
            onpointerup={(e) => {
                if(e.button !== 0) return; // Only left click

                if(wasSelectedOnPress && !dragged) {
                    onselect?.(SelectionType.Remove);
                }
            }}
        />

        <!-- Start handles -->
        <circle 
            cx="{startLeftHandleCX}%"
            cy="0%"
            r="5"
            onpointerdown={e => onHandlePointerDown(DragHandle.TopLeft, e)}
            role="button"
            tabindex="-1"
        />
        <circle 
            cx="{startRightHandleCX}%"
            cy="0%"
            r="5"
            onpointerdown={e => onHandlePointerDown(DragHandle.TopRight, e)}
            role="button"
            tabindex="-1"
        />

        <!-- End handles -->
        <circle 
            cx="{endLeftHandleCX}%"
            cy="100%"
            r="5"
            onpointerdown={e => onHandlePointerDown(DragHandle.BottomLeft, e)}
            role="button"
            tabindex="-1"
        />
        <circle 
            cx="{endRightHandleCX}%"
            cy="100%"
            r="5"
            onpointerdown={e => onHandlePointerDown(DragHandle.BottomRight, e)}
            role="button"
            tabindex="-1"
        />
    </svg>
</ContextMenu>

<style lang="scss">
svg {
    position: absolute;

    overflow: visible;

    position: absolute;

    pointer-events: none;
}
svg path {
    pointer-events: all;
}
svg.selected circle {
    stroke-width: 3;
}
circle {
    cursor: pointer;
    pointer-events: all;

    fill: #fff;
    stroke: #888;
}
</style>