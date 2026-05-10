<script lang="ts">
  import { difficultyColor } from "../../songList/SongList.svelte";
    import type { EditorFile } from "../EditorFile";

    const {
        file
    }: {
        file: EditorFile
    } = $props();

    const maps = $derived(file.maps);
</script>

<div class="maps">
    {#if $maps.size > 0}
        {#each Array.from($maps).sort(([_ai, a], [_bi, b]) => a.difficulty - b.difficulty) as [id, map], i}
            <div class="map-item" style="--color: {difficultyColor(map.difficulty)};">
                <div class="row">
                    <label for="map-name-{i}">Name</label>
                    <input id="map-name-{i}" type="text" value={map.name} onchange={(e) => {
                        map.name = (e.target as HTMLInputElement).value;
                        maps.update(u => u);
                        file.changed();
                    }} />
                </div>
                
                <div class="row">
                    <label for="map-difficulty-{i}">Difficulty</label>
                    <input id="map-difficulty-{i}" value={map.difficulty} onchange={(e) => {
                        map.difficulty = parseInt((e.target as HTMLInputElement).value);
                        maps.update(u => u);
                        file.changed();
                    }} type="number" title="Usually between 1 and 100, but not technically a percentage"/>
                </div>
                
                <button class="remove" onclick={() => {
                    if(!confirm(`Remove map '${map.name || 'Untitled'}'?`)) return;
                    file.deleteMap(id);
                }}>Remove</button>
            </div>
        {/each}
    {:else}
        <div class="no-maps">No maps</div>
    {/if}

    <button class="add" onclick={file.addMap.bind(file)}>Add Map</button>
</div>

<style lang="scss">
.maps {
    border: 2px solid var(--surface);
    background-color: var(--panel);
    padding: 0.5rem;
}

.map-item {
    border: 2px solid var(--color);
    background-color: var(--section);
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

label {
    display: inline;
    font-size: 1.1em;
    margin-top: 0.5rem;
}

input[type="text"], input[type="number"] {
    display: inline;
    background-color: var(--panel);
    border: 2px solid var(--surface);
    color: var(--text);
    font-size: 0.9em;
    padding: 0 4px;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield;
}

button {
    background-color: var(--panel);
    border: 2px solid var(--surface);
    color: var(--text);
    font-size: 1em;
    padding: 0 4px;
    margin-bottom: 0.25rem;
    width: 100%;

    &:hover {
        background-color: var(--surface);
    }
}

.row {
    display: flex;
    flex-direction: row;
    gap: 1rem;
    line-height: 0.7;

    input {
        flex: 1;
    }
}
</style>
