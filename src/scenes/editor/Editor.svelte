<script lang="ts">
    import { difficultyColor } from "../songList/SongList.svelte";
    import DraggableWindow, { resetAllWindows } from "./DraggableWindow.svelte";
    import ToolbarDropdown from "./menus/ToolbarDropdown.svelte";
    import { EditorFile, type EditorMapID, type EditorNoteID } from "./EditorFile";
    import { ZipSaveArchive } from "./saveHandlers/ZipSaveHandler";
    import EditorFileSettings from "./settings/EditorFileSettings.svelte";
    import NoteSettings from "./settings/NoteSettings.svelte";
    import MapView from "./MapView.svelte";
    import { FolderSaveArchive } from "./saveHandlers/FolderSaveHandler";
    import type { OpenableSaveArchive } from "./saveHandlers/SaveArchive";
    import { PlaybackType, type PlaybackState } from "./playback.svelte";
    import PlaybackControls from "./PlaybackControls.svelte";
    import { songArchives } from "../../songs";
    import ToolbarDropdownSubmenu from "./menus/DropdownSubmenu.svelte";
    import { WakatimeHandler } from "./WakatimeHandler";
    import { SvelteSet } from "svelte/reactivity";
    import InlineScene from "../InlineScene.svelte";
    import { GameScene } from "../../game/Game";
    import { Song } from "../../Song";
    import { _$debouncedEffect, _$explicitEffect } from "../../utils/effect.svelte";
    import { debounce } from "../../lib/timing";
    
    const handlers: OpenableSaveArchive[] = (
        [ZipSaveArchive, FolderSaveArchive] satisfies OpenableSaveArchive[]
    ).filter(h => h.isSupported());

    let editedFile: EditorFile = $state(new EditorFile(new ZipSaveArchive()));
    let playbackState: PlaybackState = $state({ playing: PlaybackType.Paused, time: 0 });

    let maps = $derived(editedFile.maps);
    let meta = $derived(editedFile.meta);
    let unsavedChanges = $derived(editedFile.unsavedChanges);
    
    let selectedNotes: SvelteSet<EditorNoteID> = $state(new SvelteSet());
    let openMap: EditorMapID | null = $state(null);

    const SPLIT_KEY = 'editor_settings_width';
    let settingsWidth = $state(Number(localStorage.getItem(SPLIT_KEY)) ?? 200);
    let dragging = false;

    let wakatimeHandler: WakatimeHandler = new WakatimeHandler();
    const wakatimeStatus = wakatimeHandler.status;
    
    let subdivisions = $state(8);

    const gameScene = new GameScene(null, 0, true);
    const updateGameScene = debounce(async () => {
        const song = await Song.loadFromFile(editedFile);
        gameScene.setSong(song, song.maps.findIndex(m => m.id === openMap));
    }, 100);

    _$explicitEffect(() => [editedFile], () => {
        editedFile.changed.connect(updateGameScene);
        updateGameScene();
    });
    _$explicitEffect(() => [openMap], updateGameScene);

    $effect(() => {
        wakatimeHandler.filename = editedFile.getMeta().name || "untitled";
        
        const unsubscribe = editedFile.audioFileData.subscribe((data) => {
            wakatimeHandler.totalBeats = Math.floor((data?.buffer?.duration ?? 0) * editedFile.getMeta().bpm / 60);
        });
        
        wakatimeHandler.save();

        return () => unsubscribe();
    });

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
    <InlineScene scene={gameScene} />
</DraggableWindow>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="editor" onkeydown={() => wakatimeHandler.keypress()} onmousedown={() => wakatimeHandler.click()}>
    <div class="toolbar">
        <div class="section">
            <ToolbarDropdown title="File">
                <button onclick={() => {
                    if($unsavedChanges) {
                        if(!confirm("You have unsaved changes. Are you sure you want to create a new file?")) return;
                    }
                    editedFile.saveArchive.close();
                    editedFile = new EditorFile(new ZipSaveArchive());
                }}>New</button>
                {@const saveClass = editedFile.saveArchive.openable()}
                {#if saveClass !== null}
                    <button onclick={() => {
                        editedFile.save();
                        wakatimeHandler.save();
                    }}>Save {saveClass.getName()}</button>
                {/if}
                <hr />
                <ToolbarDropdownSubmenu title="Open from...">
                    {#each handlers as handler}
                        <button onclick={async () => {
                        if($unsavedChanges) {
                            if(!confirm("You have unsaved changes. Are you sure you want to open a new file?")) return;
                        }
                            editedFile = await EditorFile.load(await handler.open())
                        }}>Open from {handler.getName()}</button>
                    {/each}
                </ToolbarDropdownSubmenu>
                <ToolbarDropdownSubmenu title="Open built-in">
                    {#each songArchives as archive}
                        <button onclick={async () => {
                            if($unsavedChanges) {
                                if(!confirm("You have unsaved changes. Are you sure you want to open a new file?")) return;
                            }
                            editedFile = await EditorFile.load(archive);
                        }}>{archive.songName}</button>
                    {/each}
                </ToolbarDropdownSubmenu>
                <ToolbarDropdownSubmenu title="Save as...">
                    <!-- TODO -->
                    {#each handlers as handler}
                        <button onclick={() => {
                            editedFile.saveAs(handler);
                            wakatimeHandler.save();
                        }}>Save as {handler.getName()}</button>
                    {/each}
                </ToolbarDropdownSubmenu>
            </ToolbarDropdown>
            <ToolbarDropdown title="View">
                <ToolbarDropdownSubmenu title="Subdivisions">
                    <button onclick={() => subdivisions = 2} class:active={subdivisions === 2}>2</button>
                    <button onclick={() => subdivisions = 4} class:active={subdivisions === 4}>4</button>
                    <button onclick={() => subdivisions = 6} class:active={subdivisions === 6}>6</button>
                    <button onclick={() => subdivisions = 8} class:active={subdivisions === 8}>8</button>
                    <button onclick={() => subdivisions = 12} class:active={subdivisions === 12}>12</button>
                </ToolbarDropdownSubmenu>
                <button onclick={() => resetAllWindows()}>Reset windows</button>
            </ToolbarDropdown>
            <ToolbarDropdown title="Wakatime">
                <button onclick={() => {
                    alert(`API Key: ${wakatimeHandler.apiKey.value}\nAPI URL: ${wakatimeHandler.apiUrl.value}`);
                }}>Show info</button>
                <button onclick={() => {
                    wakatimeHandler.setApiKey(prompt("Enter your Wakatime API key:") ?? "");
                }}>Set API key</button>
                <button onclick={() => {
                    wakatimeHandler.setApiUrl(prompt("Enter your Wakatime API url:", "https://wakatime.com/api/v1") ?? "");
                }}>Set API url</button>
                <span>Status: {$wakatimeStatus}</span>
            </ToolbarDropdown>
        </div>

        <div class="section">
            <span class="title">{$meta.name}{$unsavedChanges ? " *" : ""}</span>
        </div>

        <div class="section"></div>
    </div>
    <div class="settings" style="width: {settingsWidth}px">
        <!-- Full rerender when open file changes -->
        {#key editedFile}
            {#if selectedNotes.size == 0 || !openMap}
                <EditorFileSettings file={editedFile} {playbackState} />
            {:else}
                <NoteSettings
                    file={editedFile} map={openMap}
                    selection={selectedNotes}
                    ondelete={() => {
                        if(!openMap) return;
                        const map = editedFile.getMap(openMap);
                        if(!map) return;
                        map.notes.update(notes => {
                            for(const noteID of selectedNotes) {
                                notes.delete(noteID);
                            }
                            return notes;
                        });
                        editedFile.changed();
                        
                        selectedNotes.clear();
                    }}
                />
            {/if}
        {/key}
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="splitter" onmousedown={startDrag} role="separator" aria-orientation="vertical"></div>
    <div class="content-toolbar">
        <div class="maps">
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
        
        <PlaybackControls bind:playbackState={playbackState} file={editedFile} />
    </div>
    <div class="lanes">
        {#if openMap && $maps.has(openMap)}
            <!-- Render lanes for the selected map -->
            <MapView file={editedFile} {subdivisions} {playbackState} map={openMap} bind:selectedNotes={selectedNotes} onmousemove={(beat, lane) => {
                wakatimeHandler.mouseBeat = Math.round(beat);
                wakatimeHandler.mouseLane = lane;
            }} />
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
        "settings content-toolbar"
        "settings lanes";
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto 1fr;
}
.toolbar {
    grid-area: toolbar;
    background-color: var(--panel);

    display: flex;
    justify-content: space-between;

    .section:first-of-type, .section:last-of-type {
        flex: 1;
    }

    .title {
        font-weight: bold;
        text-align: center;
        margin: 0 auto;
        font-size: 0.9em;
        display: flex;
        align-items: center;
        height: 100%;
        color: var(--text);
    }
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
.content-toolbar {
    grid-area: content-toolbar;
    background-color: var(--section);
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    padding-left: 1rem;

    .maps {
        display: flex;
        flex-direction: row;
        gap: 0.25rem;
        flex: 1;
    }
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