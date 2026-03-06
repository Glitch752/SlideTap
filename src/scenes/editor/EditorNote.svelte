
<script lang="ts">
    import type { MapNote } from "../../Map";

    const {
        note,
        ondraghandle
    }: {
        note: MapNote,
        ondraghandle?: (opts: { which: string, lane: number, beat: number, e: PointerEvent }) => void
    } = $props();

    // For demonstration, map note start/end to SVG coordinates
    // Assume a 100x100 box for now; real mapping should use grid context
    function laneToX(lane: number) {
        return 10 + lane * 5;
    }
    function beatToY(beat: number) {
        return 10 + beat * 10;
    }

    // Four corners: start, end, and two control points for curve
    const startX = $derived(laneToX(note.start.start));
    const startY = $derived(beatToY(note.startTime));
    const endX = $derived(laneToX(note.end.start));
    const endY = $derived(beatToY(note.endTime));

    // Control points for arc (simple outward arc)
    const midX = $derived((startX + endX) / 2);
    const midY = $derived(Math.min(startY, endY) - 30); // arc outward

    // Drag handle logic
    let draggingHandle: null | 'start' | 'end' | 'ctrl1' = null;
    let dragOffset = { x: 0, y: 0 };

    function onHandlePointerDown(which: string, e: PointerEvent) {
        draggingHandle = which as any;
        dragOffset = { x: e.clientX, y: e.clientY };
        window.addEventListener('pointermove', onHandlePointerMove);
        window.addEventListener('pointerup', onHandlePointerUp);
        e.stopPropagation();
    }

    function onHandlePointerMove(e: PointerEvent) {
        if (!draggingHandle) return;
        // Convert delta to lane/beat changes (for demo, 1 lane per 5px, 1 beat per 10px)
        const dx = e.clientX - dragOffset.x;
        const dy = e.clientY - dragOffset.y;
        let newLane = note.start.start;
        let newBeat = note.startTime;
        if (draggingHandle === 'start') {
            newLane = Math.round(note.start.start + dx / 5);
            newBeat = Math.round(note.startTime + dy / 10);
            ondraghandle?.({ which: 'start', e, lane: newLane, beat: newBeat });
        } else if (draggingHandle === 'end') {
            newLane = Math.round(note.end.start + dx / 5);
            newBeat = Math.round(note.endTime + dy / 10);
            ondraghandle?.({ which: 'end', e, lane: newLane, beat: newBeat });
        } else if (draggingHandle === 'ctrl1') {
            // For arc control, not implemented
        }
    }
    function onHandlePointerUp(e: PointerEvent) {
        draggingHandle = null;
        window.removeEventListener('pointermove', onHandlePointerMove);
        window.removeEventListener('pointerup', onHandlePointerUp);
    }
</script>

<svg width="120" height="120" style="overflow:visible; pointer-events:none;">
    <!-- Curve -->
    <path
        d="M {startX},{startY} Q {midX},{midY} {endX},{endY}"
        fill="none"
        stroke="#f0f"
        stroke-width="2"
        pointer-events="stroke"
    />
    <!-- Drag handles -->
    <circle
        cx={startX}
        cy={startY}
        r="5"
        fill="#fff"
        stroke="#333"
        style="cursor: pointer; pointer-events:all;"
        onpointerdown={e => onHandlePointerDown('start', e)}
        role="button"
        tabindex="-1"
    />
    <circle
        cx={endX}
        cy={endY}
        r="5"
        fill="#fff"
        stroke="#333"
        style="cursor: pointer; pointer-events:all;"
        onpointerdown={e => onHandlePointerDown('end', e)}
        role="button"
        tabindex="-2"
    />
    <!-- Control handle for arc -->
    <circle
        cx={midX}
        cy={midY}
        r="4"
        fill="#0ff"
        stroke="#333"
        style="cursor: pointer; pointer-events:all;"
        onpointerdown={e => onHandlePointerDown('ctrl1', e)}
        role="button"
        tabindex="-3"
    />
</svg>

<style lang="scss">
svg {
    grid-row: 2;
    grid-column: 2;
    width: 0;
    height: 0;
    pointer-events: none;
}
circle {
    pointer-events: all;
}
</style>