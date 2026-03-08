<script lang="ts">
    import type { MapNote } from "../../Map";

    const {
        note = $bindable(),
        colWidthPx,
        rowHeightPx,
        subdivisions
    }: {
        note: MapNote,
        colWidthPx: number,
        rowHeightPx: number,
        subdivisions: number
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
        if(!draggingHandle) return;
        // Convert delta to lane/beat changes (1 lane per 5px, 1 beat per 10px)
        const dx = e.clientX - dragOrigin.x;
        const dy = e.clientY - dragOrigin.y;
        if(draggingHandle === 'start') {
            note.start.start = Math.round(noteOrigin.startLane + dx / 5);
            note.startTime = Math.round(noteOrigin.startBeat + dy / 10);
        } else if(draggingHandle === 'end') {
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
    const rightColumn = $derived(Math.ceil(Math.max(note.start.start + note.start.width, note.end.start + note.end.width)));
    
    const widthColumns = $derived(rightColumn - leftColumn);
    const heightRows = $derived(Math.ceil(note.endTime * subdivisions) - Math.floor(note.startTime * subdivisions));

    const columnToCX = (col: number) => (col - leftColumn) / (rightColumn - leftColumn) * 100;

    const startLeftHandleCX = $derived(columnToCX(Math.floor(note.start.start)));
    const startRightHandleCX = $derived(columnToCX(Math.ceil(note.start.start + note.start.width)));
    const endLeftHandleCX = $derived(columnToCX(Math.floor(note.end.start)));
    const endRightHandleCX = $derived(columnToCX(Math.ceil(note.end.start + note.end.width)));

    const getArcPath = (x1: number, y1: number, x2: number, y2: number) => {
        console.log(rowHeightPx);
        const xToPixels = (x: number) => x / 100 * widthColumns * colWidthPx;
        const yToPixels = (y: number) => y / 100 * heightRows * rowHeightPx;
        
        const px1 = xToPixels(x1);
        const py1 = yToPixels(y1);
        const px2 = xToPixels(x2);
        const py2 = yToPixels(y2);

        // Control points are vertically aligned with start and end to ensure vertical tangents
        const cp1y = py1 + (py2 - py1) / 2;
        const cp2y = py2 - (py2 - py1) / 2;

        return `M ${px1} ${py1} C ${px1} ${cp1y}, ${px2} ${cp2y}, ${px2} ${py2}`;
    };
</script>

<svg style="
    grid-column: {leftColumn + 2};
    grid-row: {Math.floor(note.startTime * subdivisions) + 2};
    width: {widthColumns * colWidthPx}px;
    height: {heightRows * rowHeightPx}px;
">
    <!-- Start handles -->
    <circle 
        cx="{startLeftHandleCX}%"
        cy="0%"
        r="5"
        onpointerdown={e => onHandlePointerDown('start', e)}
        role="button"
        tabindex="-1"
    />
    <circle 
        cx="{startRightHandleCX}%"
        cy="0%"
        r="5"
        onpointerdown={e => onHandlePointerDown('ctrl1', e)}
        role="button"
        tabindex="-1"
    />

    <!-- End handles -->
    <circle 
        cx="{endLeftHandleCX}%"
        cy="100%"
        r="5"
        onpointerdown={e => onHandlePointerDown('end', e)}
        role="button"
        tabindex="-1"
    />
    <circle 
        cx="{endRightHandleCX}%"
        cy="100%"
        r="5"
        onpointerdown={e => onHandlePointerDown('ctrl2', e)}
        role="button"
        tabindex="-1"
    />

    <!-- Side arcs -->
    <path
        d={getArcPath(startLeftHandleCX, 0, endLeftHandleCX, 100)}
        fill="none"
        stroke="#fff"
        stroke-width="2"
    />
    <path
        d={getArcPath(startRightHandleCX, 0, endRightHandleCX, 100)}
        fill="none"
        stroke="#fff"
        stroke-width="2"
    />

    <!-- Top/bottom lines -->
    <line
        x1="{startLeftHandleCX}%"
        y1="0%"
        x2="{startRightHandleCX}%"
        y2="0%"
        stroke="#fff"
        stroke-width="2"
    />
    <line
        x1="{endLeftHandleCX}%"
        y1="100%"
        x2="{endRightHandleCX}%"
        y2="100%"
        stroke="#fff"
        stroke-width="2"
    />
</svg>

<style lang="scss">
svg {
    pointer-events: none;
    position: absolute;

    overflow: visible;

    position: absolute;
}
circle {
    cursor: pointer;
    pointer-events: all;

    fill: #fff;
    stroke: #888;
}
</style>