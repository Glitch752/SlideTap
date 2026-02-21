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

<!-- TODO: less generic ahh menu -->
<div class="menu">
    <h1>SlideTap</h1>
    <button onclick={startGame}>Song List</button>
    <button onclick={startEditor}>Editor</button>
</div>

<style lang="scss">
.menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    gap: 1rem;
}

.menu h1 {
    color: #fff;
    font-size: 3rem;
    letter-spacing: 2px;
    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    margin: 0;
}

.menu button {
    --bg-color: var(--panel);
    color: #ccc;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 2rem;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 15rem;
}
</style>