
<script lang="ts">
    import { start } from "repl";
import type { MapNote } from "../../Map";

    const {
        note = $bindable(),
    }: {
        note: MapNote,
    } = $props();

    // drag logic
    let draggingHandle: null | 'start' | 'end' | 'ctrl1' = null;
    let dragOrigin = { x: 0, y: 0 };
    let noteOrigin = { startLane: 0, startBeat: 0, endLane: 0, endBeat: 0 };

    function onHandlePointerDown(which: string, e: PointerEvent) {
        draggingHandle = which as any;
        dragOrigin = { x: e.clientX, y: e.clientY };
        noteOrigin = {
            startLane: note.start.start,
            startBeat: note.startTime,
            endLane: note.end.start,
            endBeat: note.endTime,
        };
        window.addEventListener('pointermove', onHandlePointerMove);
        window.addEventListener('pointerup', onHandlePointerUp);
        e.stopPropagation();
    }

    function onHandlePointerMove(e: PointerEvent) {
        if (!draggingHandle) return;
        // Convert delta to lane/beat changes (1 lane per 5px, 1 beat per 10px)
        const dx = e.clientX - dragOrigin.x;
        const dy = e.clientY - dragOrigin.y;
        if (draggingHandle === 'start') {
            note.start.start = Math.round(noteOrigin.startLane + dx / 5);
            note.startTime = Math.round(noteOrigin.startBeat + dy / 10);
        } else if (draggingHandle === 'end') {
            note.end.start = Math.round(noteOrigin.endLane + dx / 5);
            note.endTime = Math.round(noteOrigin.endBeat + dy / 10);
        }
    }

    function onHandlePointerUp(e: PointerEvent) {
        draggingHandle = null;
        window.removeEventListener('pointermove', onHandlePointerMove);
        window.removeEventListener('pointerup', onHandlePointerUp);
    }

    const leftColumn = $derived(Math.floor(Math.min(note.start.start, note.end.start)));
    const columnWidth = $derived(Math.ceil(Math.max(note.start.width, note.end.width)));

    const columnToCX = (col: number) => `${(col - leftColumn) / columnWidth * 100}%`;

    const startLeftHandleCX = $derived(columnToCX(Math.floor(note.start.start)));
    const startRightHandleCX = $derived(columnToCX(Math.ceil(note.start.start + note.start.width)));
    const endLeftHandleCX = $derived(columnToCX(Math.floor(note.end.start)));
    const endRightHandleCX = $derived(columnToCX(Math.ceil(note.end.start + note.end.width)));
</script>

<svg style="
    grid-column: {leftColumn + 2} / {leftColumn + columnWidth + 2};
    grid-row: {Math.floor(note.startTime) + 2} / {Math.ceil(note.endTime) + 2};
">
    <!-- Start handles -->
    <circle 
        cx="{startLeftHandleCX}"
        cy="0%"
        r="5"
        onpointerdown={e => onHandlePointerDown('start', e)}
        role="button"
        tabindex="-1"
    />
    <circle 
        cx="{startRightHandleCX}"
        cy="0%"
        r="5"
        onpointerdown={e => onHandlePointerDown('ctrl1', e)}
        role="button"
        tabindex="-1"
    />

    <!-- End handles -->
    <circle 
        cx="{endLeftHandleCX}"
        cy="100%"
        r="5"
        onpointerdown={e => onHandlePointerDown('end', e)}
        role="button"
        tabindex="-1"
    />
    <circle 
        cx="{endRightHandleCX}"
        cy="100%"
        r="5"
        onpointerdown={e => onHandlePointerDown('ctrl2', e)}
        role="button"
        tabindex="-1"
    />
</svg>

<style lang="scss">
svg {
    pointer-events: none;
    position: absolute;

    overflow: visible;

    background-color: red;
}
circle {
    cursor: pointer;
    pointer-events: all;

    fill: #fff;
    stroke: #888;
}
</style>