<script lang="ts">
  import { slide } from "svelte/transition";
import Settings from "../../lib/Settings.svelte";
import { loadScene } from "../../router";
import { EditorScene } from "../Editor";
import { SongListScene } from "../SongList";

function startGame() {
    loadScene(new SongListScene());
}

function startEditor() {
    loadScene(new EditorScene());
}

let settingsOpen = $state(false);
</script>

<!-- TODO: less generic ahh menu -->
<div class="menu">
    <h1>SlideTap</h1>
    <button onclick={startGame}>Play</button>
    <button onclick={() => settingsOpen = !settingsOpen}>Settings</button>
    <button onclick={startEditor}>Editor</button>
</div>

{#if settingsOpen}
    <div class="settings" transition:slide={{ duration: 200 }}>
        <Settings></Settings>
    </div>
{/if}

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

.settings {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--panel);
    padding: 2rem;
    border-radius: 5px;
}
</style>