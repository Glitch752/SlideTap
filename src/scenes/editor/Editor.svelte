<script lang="ts">
    import { difficultyColor } from "../songList/SongList.svelte";
    import DraggableWindow from "./DraggableWindow.svelte";
    import ToolbarDropdown from "./ToolbarDropdown.svelte";
    import Game from "../game/Game.svelte";
    import { EditorFile, type EditorMapID, type EditorNoteID } from "./EditorFile";
    import { ZipSaveHandler } from "./saveHandlers/ZipSaveHandler";
    import EditorFileSettings from "./settings/EditorFileSettings.svelte";
    import NoteSettings from "./NoteSettings.svelte";
    import MapView from "./MapView.svelte";
    
    const zipSaveHandler = new ZipSaveHandler();

    let editedFile: EditorFile = $state(new EditorFile(zipSaveHandler));
    let maps = $derived(editedFile.maps);
    
    let selectedNotes: Set<EditorNoteID> = $state(new Set());
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
            <button onclick={() => {
                if(editedFile.hasChanges) {
                    if(!confirm("You have unsaved changes. Are you sure you want to create a new file?")) return;
                }
                zipSaveHandler.close(editedFile);
                editedFile = new EditorFile(zipSaveHandler);
            }}>New</button>
            <button onclick={async () => editedFile = await zipSaveHandler.load()}>Open from zip</button>
            <!-- <button onclick={() => console.log("Open existing")}>Open existing</button> -->
            <button onclick={() => editedFile.save()}>Save to zip</button>
        </ToolbarDropdown>
    </div>
    <div class="settings" style="width: {settingsWidth}px">
        {#if selectedNotes.size == 0 || !openMap}
            <EditorFileSettings file={editedFile} />
        {:else}
            <NoteSettings file={editedFile} notes={selectedNotes} />
        {/if}
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="splitter" onmousedown={startDrag} role="separator" aria-orientation="vertical"></div>
    <div class="map-selector">
        {#if $maps.size === 0}
            <p class="placeholder">No maps available.</p>
        {/if}
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
        {#if openMap && $maps.has(openMap)}
            <!-- Render lanes for the selected map -->
            <MapView file={editedFile} map={openMap} bind:selectedNotes={selectedNotes} />
        {:else}
            <p class="placeholder">Select a map to view its lanes.</p>
        {/if}
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
    display: flex;
    flex-direction: row;
    gap: 1rem;
    padding-left: 1rem;

    .map {
        &.selected {
            --bg-color: var(--surface);
        }

        --bg-color: var(--panel);
        border: none;
        color: var(--text);
        border-bottom: 2px solid var(--color);
        box-shadow: none;
        padding: 0.5rem 1rem;
    }

    .placeholder {
        margin: 0;
        padding: 0.5rem 1rem;
        color: var(--text-dim);
    }
}
.lanes {
    grid-area: lanes;
    position: relative;
    overflow: hidden;

    .placeholder {
        text-align: center;
        color: var(--text-dim);
    }
}
</style>