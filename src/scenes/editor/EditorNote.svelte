<script lang="ts">
    import { MapNoteType, type MapNote } from "../../Map";

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

    const noteColor = $derived(({
        [MapNoteType.Hold]: "#8888ff",
        [MapNoteType.Damage]: "#ff8888",
        [MapNoteType.Tap]: "#88ffff"
    })[note.type]);

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

<svg style="
    grid-column: {leftColumn + 2};
    grid-row: {Math.floor(note.startTime * subdivisions) + 2};
    width: {widthColumns * colWidthPx}px;
    height: {heightRows * rowHeightPx}px;
">
    <defs>
        <linearGradient id="noteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="{noteColor}" stop-opacity="0.3" />
            <stop offset="100%" stop-color="{noteColor}" stop-opacity="0.2" />
        </linearGradient>
    </defs>

    <path
        class="note-fill"
        d={getFillPath()}
        fill="url(#noteGradient)"
        stroke={noteColor}
        stroke-width="2"
    />

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