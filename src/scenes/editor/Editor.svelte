<script lang="ts">
    import Game from "../game/Game.svelte";
    import DraggableWindow from "./DraggableWindow.svelte";
    import ToolbarDropdown from "./ToolbarDropdown.svelte";
</script>

<DraggableWindow title="Preview">
    <Game />
</DraggableWindow>

<div class="editor">
    <div class="toolbar">
        <ToolbarDropdown title="File">
            <button onclick={() => console.log("New")}>New</button>
            <button onclick={() => console.log("Open")}>Open</button>
            <button onclick={() => console.log("Save")}>Save</button>
        </ToolbarDropdown>
    </div>
    <div class="settings">

    </div>
    <div class="lanes">

    </div>
</div>

<style lang="scss">
.editor {
    display: grid;
    grid-template-areas:
        "toolbar toolbar"
        "settings lanes";
    grid-template-columns: 200px 1fr;
    grid-template-rows: auto 1fr;
    
    position: absolute;
    inset: 0;
}

.toolbar {
    grid-area: toolbar;
    background-color: var(--panel);
}
</style>