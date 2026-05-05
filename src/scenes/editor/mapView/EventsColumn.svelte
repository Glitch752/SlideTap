<script lang="ts">
    import { get, type Writable } from "svelte/store";
    import type { MapEvent } from "../../../Map";
    import type { EditorEventID } from "../EditorFile";

    let {
        getBeatFromEvent,
        generateEventId,
        selectedEvent = $bindable(),
        events,
        subdivisions,
        rowHeightPx
    }: {
        getBeatFromEvent: (e: MouseEvent, checkBounds?: boolean, round?: boolean) => number | null,
        generateEventId: () => EditorEventID,
        selectedEvent: EditorEventID | null,
        events: Writable<Map<EditorEventID, MapEvent>>,
        subdivisions: number,
        rowHeightPx: number
    } = $props();

    // Stack overlapping events
    let eventStacking: Map<EditorEventID, number> = $derived.by(() => {
        if(!$events) return new Map();
        
        const stacking = new Map<EditorEventID, number>();
        const sortedEvents = Array.from($events.entries()).sort(([_aid, a], [_bid, b]) => a.time - b.time);
        
        // Pack as many events as possible in the same column, then move to the next column
        const columns: Map<number, MapEvent[]> = new Map();
        for(let i = 0; i < sortedEvents.length; i++) {
            const [id, event] = sortedEvents[i];
            let column = 0;
            while(true) {
                const columnEvents = columns.get(column) ?? [];
                if(columnEvents.every(e => e.time + e.duration <= event.time || e.time >= event.time + event.duration)) {
                    // No overlap, place event here
                    columnEvents.push(event);
                    columns.set(column, columnEvents);
                    stacking.set(id, column);
                    break;
                }
                column++;
            }
        }
        
        return stacking;
    });
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    style="grid-column: 2; grid-row: 2 / -1;"
    onmousedown={(e) => {
        // Add an event at the clicked position
        const beat = getBeatFromEvent(e, false, false);
        if(beat !== null) {
            const newEvent: MapEvent = {
                time: beat,
                duration: 1,

                type: "flash",
                color: "#ffffff30"
            };
            events.update(v => {
                v.set(generateEventId(), newEvent);
                return v;
            });
        }
    }}
></div>

<svelte:window onpointerdown={(e) => {
    selectedEvent = null;
}}></svelte:window>

{#each $events as [id, event] (id)}
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
        }}
    >
        <div class="flag"></div>
    </div>
{/each}

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
        border-color: var(--accent-blue);
        .flag {
            border-left-color: var(--accent-blue);
        }
    }
}
</style>