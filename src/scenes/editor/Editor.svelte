<script lang="ts">
    import { difficultyColor } from "../songList/SongList.svelte";
    import DraggableWindow from "./DraggableWindow.svelte";
    import ToolbarDropdown from "./ToolbarDropdown.svelte";
    
    import Game from "../game/Game.svelte";
    import { EditorFile, type EditorMapID, type EditorNoteID } from "./EditorFile";

    let editedFile: EditorFile = new EditorFile();
    let maps = editedFile.maps;
    
    let selectedNotes: EditorNoteID[] = $state([]);
    let openMap: EditorMapID | null = $state(null);

    const SPLIT_KEY = 'editor_settings_width';
    let settingsWidth = $state(Number(localStorage.getItem(SPLIT_KEY)) ?? 200);
    let dragging = false;

    function startDrag(_e: MouseEvent) {
        dragging = true;
        document.body.style.cursor = 'col-resize';

        window.addEventListener('mousemove', onDrag);
        window.addEventListener('mouseup', stopDrag);
    }

    function onDrag(e: MouseEvent) {
        if(!dragging) return;
        const min = 100, max = 800;
        let newWidth = e.clientX;
        if(newWidth < min) newWidth = min;
        if(newWidth > max) newWidth = max;
        settingsWidth = newWidth;
        localStorage.setItem(SPLIT_KEY, String(settingsWidth));
    }

    function stopDrag() {
        dragging = false;
        document.body.style.cursor = '';

        window.removeEventListener('mousemove', onDrag);
        window.removeEventListener('mouseup', stopDrag);
    }
</script>

<DraggableWindow title="Preview" id="preview">
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
    <div class="settings" style="width: {settingsWidth}px">
        
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="splitter" onmousedown={startDrag} role="separator" aria-orientation="vertical"></div>
    <div class="map-selector">
        {#each $maps as [mapID, map] (mapID)}
            <button
                class="map"
                class:selected={openMap === mapID}
                style="--color: {difficultyColor(map.difficulty)}"
                onmousedown={() => openMap = mapID}
            >{map.name}</button>
        {/each}
    </div>
    <div class="lanes">
        
    </div>
</div>

<style lang="scss">
.editor {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-areas:
        "toolbar toolbar"
        "settings map"
        "settings lanes";
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto 1fr;
}
.toolbar {
    grid-area: toolbar;
    background-color: var(--panel);
}
.settings {
    grid-area: settings;
    background-color: var(--section);
    min-width: 100px;
    max-width: 500px;
    overflow: auto;
}
.splitter {
    grid-row: 2 / span 2;
    grid-column: 2;
    cursor: col-resize;
    background: var(--panel);
    width: 3px;
    z-index: 2;
    user-select: none;
}
.map-selector {
    grid-area: map;
    background-color: var(--section);
    height: 2rem;

    .map {
        --bg-color: var(--color);
        box-shadow: none;
    }
}
.lanes {
    grid-area: lanes;
    position: relative;
}
</style>