<script lang="ts">
    import type { MapEvent } from "../../../Map";
    import type { EditorEventID, EditorFile, EditorMapData } from "../EditorFile";
    import ContextMenu from "../menus/ContextMenu.svelte";
    import { copyEvent } from "../clipboard.svelte";
    import EventFlag from "./EventFlag.svelte";

    let {
        getBeatFromEvent,
        generateEventId,
        selectedEvent = $bindable(),
        file,
        map,
        subdivisions,
        rowHeightPx
    }: {
        getBeatFromEvent: (e: MouseEvent, checkBounds?: boolean, round?: boolean) => number | null,
        generateEventId: () => EditorEventID,
        selectedEvent: EditorEventID | null,
        file: EditorFile,
        map: EditorMapData,
        subdivisions: number,
        rowHeightPx: number
    } = $props();

    const events = $derived(map.events);

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

{#each $events as [id, event] (id)}
    {#snippet menu()}
        <button onclick={() => {
            events.update(v => {
                v.delete(id);
                return v;
            });
            file.changed();
            if(selectedEvent === id) selectedEvent = null;
        }}>
            Delete Event
        </button>
        <button onclick={() => copyEvent(id, map) }>
            Copy
        </button>
        <button onclick={() => {
            copyEvent(id, map);
            events.update(v => {
                v.delete(id);
                return v;
            });
            file.changed();
            if(selectedEvent === id) selectedEvent = null;
        }}>
            Cut
        </button>
    {/snippet}
    <ContextMenu {menu}>
        <EventFlag
            {id}
            {event}
            {eventStacking}
            bind:selectedEvent={selectedEvent}
            {file}
            {events}
            {subdivisions}
            {rowHeightPx}
        />
    </ContextMenu>
{/each}