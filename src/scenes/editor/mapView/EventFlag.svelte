<script lang="ts">
    import type { Writable } from "svelte/store";
    import type { MapEvent } from "../../../Map";
    import type { EditorEventID, EditorFile } from "../EditorFile";
  import { RichText } from "../../../lib/RichText";

    let {
        id,
        event,
        eventStacking,
        selectedEvent = $bindable(),
        file,
        events,
        subdivisions,
        rowHeightPx
    }: {
        id: EditorEventID,
        event: MapEvent,
        eventStacking: Map<EditorEventID, number>,
        selectedEvent: EditorEventID | null,
        file: EditorFile,
        events: Writable<Map<EditorEventID, MapEvent>>,
        subdivisions: number,
        rowHeightPx: number
     } = $props();

    function startDrag(e: MouseEvent, update: (delta: number) => void) {
        e.stopPropagation();
        selectedEvent = id;

        const startY = e.clientY;

        const mouseMove = (ev: MouseEvent) => {
            const deltaBeats = (ev.clientY - startY) / rowHeightPx / subdivisions;
            update(deltaBeats);
            file.changed();
        };

        const mouseUp = () => {
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
        };

        window.addEventListener('mousemove', mouseMove);
        window.addEventListener('mouseup', mouseUp);
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="event"
    class:selected={id === selectedEvent}
    style="
top: {(event.time * subdivisions + 1) * rowHeightPx}px;
height: {event.duration * subdivisions * rowHeightPx}px;
left: {(eventStacking.get(id) ?? 0) * 10}px;
z-index: {eventStacking.get(id) ?? 0};
--color: {event.type === "flash" ? event.color : 'var(--text)'};
"
    onmousedown={(e) => {
        const startTime = event.time;
        startDrag(e, (deltaBeats) => {
            events.update(v => {
                const ev = v.get(id);
                if(ev) {
                    ev.time = Math.max(0, startTime + deltaBeats);
                    v.set(id, ev);
                }
                return v;
            });
        });
    }}
>
    <!-- TODO: Icon for type? -->
    <div class="flag"></div>

    <div class="previewBox">
        {#if event.type === "text"}
            <span class="label">Text</span>
            <span>{@html new RichText(event.text).toHTMLString()}</span>
        {:else if event.type === "flash"}
            <span class="label">Flash</span>
            <span class="color" style="background-color: {event.color}"></span>
        {/if}
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div 
        class="durationHandle" 
        onmousedown={(e) => {
            const startDuration = event.duration;
            startDrag(e, (deltaBeats) => {
                events.update(v => {
                    const ev = v.get(id);
                    if(ev) {
                        ev.duration = Math.max(0, startDuration + deltaBeats);
                        v.set(id, ev);
                    }
                    return v;
                });
            });
        }}
    ></div>
</div>

<style lang="scss">
.event {
    --opaque-color: rgb(from var(--color) r g b / 1.0);
    position: absolute;
    grid-column: 2;

    border-left: 1.5px solid var(--opaque-color);
    width: 10px;
    
    .flag {
        // Triangle flag
        width: 0;
        height: 0;
        border-right: 12px solid transparent;
        border-bottom: 12px solid transparent;
        border-left: 12px solid var(--opaque-color);

        position: absolute;
        top: 0;
    }

    .durationHandle {
        position: absolute;
        bottom: -3px;
        left: -4.25px; // ew
        width: 8px;
        height: 6px;
        background-color: var(--opaque-color);
        border-radius: 3px;
        cursor: ns-resize;
        z-index: 2;

        &:hover {
            transform: scale((1.2));
        }
    }

    &.selected {
        z-index: 100;
    }
    &.selected .flag {
        // This is annoyingly difficult to make visually clear
        // I kind of hate this, but oh well
        filter: drop-shadow(0 0 8px white) drop-shadow(0 0 4px var(--opaque-color));
        transform: translateX(6px) scaleX(1.5);
    }

    &:hover .previewBox {
        opacity: 1;
        transform: translateY(0);
    }
}

.previewBox {
    display: flex;
    background-color: var(--surface);

    position: absolute;
    top: 0;
    left: 18px;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    width: max-content;

    z-index: 10;

    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.2s, transform 0.2s;

    line-height: 1;

    pointer-events: none;
    user-select: none;
    
    .label {
        font-size: 0.9em;
        color: var(--text-dim);
    }
    .color {
        width: 16px;
        height: 16px;
        border-radius: 4px;
        border: 1px solid var(--text);
    }
}
</style>