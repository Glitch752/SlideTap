<script lang="ts">
    import type { SvelteSet } from "svelte/reactivity";
    import type { EditorFile, EditorMapID, EditorNoteID } from "../EditorFile";
    import { getNoteColor, MapNoteLayer, MapNoteType, type MapNote } from "../../../Map";

    const {
        file,
        map,
        selection,
        ondelete
    }: {
        file: EditorFile,
        map: EditorMapID,
        selection: SvelteSet<EditorNoteID>,
        ondelete: () => void
    } = $props();

    const mapData = $derived(file.getMap(map) ?? null);
    const noteMap = $derived(mapData?.notes);
    const notes = $derived.by(() => {
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

    function mode<T>(arr: T[]): T | null {
        const counts = new Map<T, number>();
        for(const item of arr) {
            counts.set(item, (counts.get(item) ?? 0) + 1);
        }
        let maxCount = 0;
        let modeItem: T | null = null;
        for(const [item, count] of counts) {
            if(count > maxCount) {
                maxCount = count;
                modeItem = item;
            }
        }
        return modeItem;
    }
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
            }} style="--color: {getNoteColor(type, mode(notes.map(n => n.layer)) ?? MapNoteLayer.Primary)}">{label}</button>
        {/each}
    </div>

    <span>Other</span>
    <button onclick={ondelete}>Delete</button>
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
    background-color: var(--panel);
    border: 2px solid var(--color, var(--surface));
    color: var(--text);
    font-size: 1em;
    padding: 0.5rem 1rem;

    &:hover {
        background-color: var(--surface);
    }

    &.selected {
        background-color: var(--surface);
        color: var(--accent-text);
    }
}
</style>