<script lang="ts">
    import Game from "../game/Game.svelte";
    import DraggableWindow from "./DraggableWindow.svelte";
    import { EditorFile, type EditorMapID, type EditorNoteID } from "./EditorFile";
    import ToolbarDropdown from "./ToolbarDropdown.svelte";

    let editedFile: EditorFile = new EditorFile();
    
    let selectedNotes: EditorNoteID[] = $state([]);
    let openMap: EditorMapID | null = $state(null);
</script>

<DraggableWindow title="Preview">
    <Game />
</DraggableWindow>

<div class="editor">
    <div class="toolbar">
        <ToolbarDropdown title="File">
            <button onclick={() => console.log("New")}>New</button>
            <button onclick={() => console.log("Open")}>Open from zip</button>
            <button onclick={() => console.log("Open existing")}>Open existing</button>
            <button onclick={() => console.log("Save")}>Save to zip</button>
        </ToolbarDropdown>
    </div>
    <div class="settings">

    </div>
    <div class="map-selector">
        
    </div>
    <div class="lanes">

    </div>
</div>

<style lang="scss">
.editor {
    display: grid;
    grid-template-areas:
        "toolbar toolbar"
        "settings map"
        "settings lanes";
    grid-template-columns: 200px 1fr;
    grid-template-rows: auto auto 1fr;
    
    position: absolute;
    inset: 0;
}
.toolbar {
    grid-area: toolbar;
    background-color: var(--panel);
}
.settings {
    grid-area: settings;
    background-color: var(--section);
}
.map-selector {
    grid-area: map;
}
.lanes {
    grid-area: lanes;
}
</style>