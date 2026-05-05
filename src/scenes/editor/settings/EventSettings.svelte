<script lang="ts">
    import { get } from "svelte/store";
    import type { EditorEventID, EditorFile, EditorMapID } from "../EditorFile";
  import type { MapEvent } from "../../../Map";

    const {
        file,
        map,
        event: id,
        ondelete
    }: {
        file: EditorFile,
        map: EditorMapID,
        event: EditorEventID,
        ondelete: () => void
    } = $props();

    const mapData = $derived(file.getMap(map) ?? null);
    const event = $derived.by(() => {
        if(!mapData) return null;
        return get(mapData.events).get(id) ?? null;
    });

    function setEvent(data: MapEvent) {
        if(!mapData || !event) return;
        mapData.events.update(events => {
            events.set(id, data);
            return events;
        });
        file.changed();
    }
</script>


<div class="settings">
    <h2>Event Settings</h2>

    <span>Type</span>
    <div class="option-list">
        {#each (["flash", "text"] as const) as type}
            <button
                class:selected={event?.type === type}
                onclick={() => event && setEvent({
                    time: event.time,
                    duration: event.duration,

                    ...(type === "flash" ? {
                        type,
                        color: (event.type === "flash" ? event.color : "#ffffff")
                    } : {
                        type,
                        text: (event.type === "text" ? event.text : "Hello!")
                    })
                }) }
            >
                {type}
            </button>
        {/each}
    </div>

    <span>Event</span>
    {#if event?.type === "flash"}
        <label>
            Color
            <input type="color" value={event.color} oninput={(e) => setEvent({
                ...event,
                color: (e.target as HTMLInputElement).value
            }) }>
        </label>
    {:else if event?.type === "text"}
        <label>
            Text
            <input type="text" value={event.text} oninput={(e) => setEvent({
                ...event,
                text: (e.target as HTMLInputElement).value
            }) }>
        </label>
    {/if}
</div>

<style lang="scss">
.settings {
    padding: 1rem 0.5rem;
}

h2 {
    margin: 0;
    font-size: 1.25em;
}

label, span {
    display: block;
    font-size: 1.1em;
    margin-top: 1.5rem;
}

.option-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
}

button {
    --bg-color: var(--panel);
    font-size: 1em;
    padding: 0.5rem 1rem;
    
    &.selected {
        background-color: var(--surface);
        color: var(--accent-text);
    }
}
</style>