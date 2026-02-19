<script lang="ts">
import { loadScene } from "../../App.svelte";
import { EditorScene } from "../Editor";
import { SongListScene } from "../SongList";

function startGame() {
    loadScene(new SongListScene());
}

function startEditor() {
    loadScene(new EditorScene());
}
</script>

<div class="menu">
    <h1>SlideTap</h1>
    <button onclick={startGame}>Song List</button>
    <button onclick={startEditor}>Editor</button>
</div>

<style lang="scss">
.menu {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
}
</style>