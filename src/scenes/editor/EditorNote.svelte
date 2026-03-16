<script lang="ts">
    import { MapNoteType, type MapNote } from "../../Map";
    import { _$lazyEffect } from "../../utils/effect.svelte";

    const {
        note,
        onchange,
        colWidthPx,
        rowHeightPx,
        subdivisions
    }: {
        note: MapNote,
        onchange: (note: MapNote) => void,
        colWidthPx: number,
        rowHeightPx: number,
        subdivisions: number
    } = $props();

    const noteColor = $derived(({
        [MapNoteType.Hold]: "#8888ff",
        [MapNoteType.Damage]: "#ff8888",
        [MapNoteType.Tap]: "#88ffff"
    })[note.type]);

    enum DragHandle {
        TopLeft,
        TopRight,
        BottomLeft,
        BottomRight
    }

    // drag logic
    let draggingHandle: DragHandle | null = null;
    let dragOrigin = { x: 0, y: 0 };
    let noteOrigin = { startLane: 0, startBeat: 0, endLane: 0, endBeat: 0 };

    function onHandlePointerDown(which: DragHandle, e: PointerEvent) {
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
        if(draggingHandle === null) return;
        
        const deltaX = e.clientX - dragOrigin.x;
        const deltaY = e.clientY - dragOrigin.y;

        const laneDelta = Math.round(deltaX / colWidthPx);
        const beatDelta = deltaY / rowHeightPx / subdivisions;

        switch(draggingHandle) {
            case DragHandle.TopLeft:
                note.start.start = noteOrigin.startLane + laneDelta;
                note.startTime = noteOrigin.startBeat + beatDelta;
                break;
            case DragHandle.TopRight:
                note.start.width = noteOrigin.endLane - noteOrigin.startLane + laneDelta;
                note.startTime = noteOrigin.startBeat + beatDelta;
                break;
            case DragHandle.BottomLeft:
                note.end.start = noteOrigin.endLane + laneDelta;
                note.endTime = noteOrigin.endBeat + beatDelta;
                break;
            case DragHandle.BottomRight:
                note.end.width = noteOrigin.endLane - noteOrigin.startLane + laneDelta;
                note.endTime = noteOrigin.endBeat + beatDelta;
                break;
        }

        onchange(note);
    }

    function onHandlePointerUp(e: PointerEvent) {
        draggingHandle = null;

        window.removeEventListener('pointermove', onHandlePointerMove);
        window.removeEventListener('pointerup', onHandlePointerUp);
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

<svg style="left: {leftColumn * colWidthPx}px; top: {note.startTime * subdivisions * rowHeightPx}px; width: {(rightColumn - leftColumn) * colWidthPx}px; height: {(note.endTime * subdivisions - note.startTime * subdivisions) * rowHeightPx}px;">
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

<style lang="scss">
svg {
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