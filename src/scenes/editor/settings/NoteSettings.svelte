<script lang="ts">
    import type { SvelteSet } from "svelte/reactivity";
    import type { EditorFile, EditorMapID, EditorNoteID } from "../EditorFile";
    import { MapNoteLayer, MapNoteType, type MapNote } from "../../../Map";

    const {
        file,
        map,
        selection
    }: {
        file: EditorFile,
        map: EditorMapID,
        selection: SvelteSet<EditorNoteID>
    } = $props();

    const mapData = $derived(file.getMap(map) ?? null);
    const noteMap = $derived(mapData?.notes);
    const notes = $derived.by(() => {
        $inspect.trace();
        if(!$noteMap) return [];
        return Array.from(selection).map(noteId => $noteMap.get(noteId)).filter(note => note !== undefined);
    });

    // let allHaveSameSettings = $derived.by(() => {
    //     if(!mapData) return false;

    //     if(selection.size === 0) return false;
    //     if(selection.size === 1) return true;

    //     let firstMeta: MapNote | null = null;
    //     for(const note of notes) {
    //         if(!firstMeta) {
    //             firstMeta = note;
    //         } else {
    //             if(firstMeta?.layer !== note?.layer || firstMeta?.type !== note?.type) {
    //                 return false;
    //             }
    //         }
    //     }
    //     return true;
    // });
</script>

<div class="settings">
    <h2>Note Settings</h2>

    <span>Layer</span>
    <div class="option-list">
        {#each ([
            [MapNoteLayer.Background, "background"],
            [MapNoteLayer.Primary, "primary"]
        ] as const) as [layer, label]}
            <button class:selected={notes.every(note => note?.layer === layer)} onclick={() => {
                mapData?.notes.update(n => {
                    for(const id of selection) {
                        const note = n.get(id);
                        if(note) n.set(id, { ...note, layer });
                    }
                    return n;
                });
                file.changed();
            }}>{label}</button>
        {/each}
    </div>
    
    <span>Type</span>
    <div class="option-list">
        {#each ([
            [MapNoteType.Damage, "damage"],
            [MapNoteType.Hold, "hold"],
            [MapNoteType.Tap, "tap"]
        ] as const) as [type, label]}
            <button class:selected={notes.every(note => note?.type === type)} onclick={() => {
                mapData?.notes.update(n => {
                    for(const id of selection) {
                        const note = n.get(id);
                        if(note) n.set(id, { ...note, type });
                    }
                    return n;
                });
                file.changed();
            }}>{label}</button>
        {/each}
    </div>
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

    button {
        background-color: var(--panel);
        border: 2px solid var(--surface);
        color: var(--text);
        font-size: 1em;
        padding: 2px 4px;

        &:hover {
            background-color: var(--surface);
        }

        &.selected {
            background-color: var(--accent);
            color: var(--accent-text);
            border-color: var(--accent);
        }
    }
}
</style>