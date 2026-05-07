<script lang="ts">
    import { get } from "svelte/store";
    import type { EditorEventID, EditorFile, EditorMapID } from "../EditorFile";
  import type { MapEvent } from "../../../Map";
  import AutoResizeTextArea from "./AutoResizeTextArea.svelte";

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
    const events = $derived(mapData?.events);
    const event = $derived($events?.get(id) ?? null);

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
                {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
        {/each}
    </div>

    {#if event?.type === "flash"}
        <span>Color</span>
        <input type="color" value={event.color} oninput={(e) => setEvent({
            ...event,
            color: (e.target as HTMLInputElement).value
        }) }>
    {:else if event?.type === "text"}
        <span>Text</span>
        <AutoResizeTextArea
            value={event.text}
            oninput={(e) => setEvent({
                ...event,
                text: (e.target as HTMLInputElement).value
            })}
            style="resize: vertical;"
        ></AutoResizeTextArea>
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
    border: none;
    color: var(--text);
    font-size: 1em;
    padding: 0.5rem 1rem;
    
    &.selected {
        background-color: var(--surface);
        color: var(--accent-text);
    }
}

input[type="color"], :global(textarea) {
    display: block;
    border: none;
    background-color: var(--surface);
    color: var(--text);
    margin-top: 0.5rem;
    padding: 0.25rem;
    width: 100%;
    font-size: 0.8rem;
}
</style>