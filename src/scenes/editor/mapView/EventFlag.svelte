<script lang="ts">
    import type { Writable } from "svelte/store";
    import type { MapEvent } from "../../../Map";
    import type { EditorEventID, EditorFile } from "../EditorFile";

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
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    class="event"
    class:selected={id === selectedEvent}
    style="
top: {(event.time * subdivisions + 1) * rowHeightPx}px;
height: {event.duration * subdivisions * rowHeightPx}px;
left: {(eventStacking.get(id) ?? 0) * 5}px;
z-index: {eventStacking.get(id) ?? 0};
--color: {event.type === "flash" ? event.color : 'var(--accent-red)'};
"
    onmousedown={(e) => {
        e.stopPropagation();
        selectedEvent = id;

        const startY = e.clientY;
        const startTime = event.time;

        const mouseMove = (e: MouseEvent) => {
            const deltaBeats = (e.clientY - startY) / rowHeightPx / subdivisions;
            events.update(v => {
                const ev = v.get(id);
                if(ev) {
                    ev.time = Math.max(0, startTime + deltaBeats);
                    v.set(id, ev);
                }
                return v;
            });
            file.changed();
        };

        const mouseUp = () => {
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('mouseup', mouseUp);
        };

        window.addEventListener('mousemove', mouseMove);
        window.addEventListener('mouseup', mouseUp);
    }}
>
    <div class="flag"></div>
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

    &.selected {
        z-index: 100;
    }
    &.selected .flag {
        // This is annoyingly difficult to make visually clear
        // I kind of hate this, but oh well
        filter: drop-shadow(0 0 8px white) drop-shadow(0 0 4px var(--opaque-color));
        transform: translateX(6px) scaleX(1.5);
    }
}
</style>