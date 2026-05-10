<script lang="ts">
import { loadScene } from "../../router.svelte";
import { EditorScene } from "../Editor";
import { SongListScene } from "../SongList";
  import SettingsContainer from "./SettingsContainer.svelte";

function startGame() {
    loadScene(new SongListScene());
}

function startEditor() {
    loadScene(new EditorScene());
}

let settings: SettingsContainer;
</script>

<!-- TODO: less generic ahh menu -->
<div class="menu">
    <h1>SlideTap</h1>
    <button onclick={startGame}>Play</button>
    <button onclick={() => settings.open()}>Settings</button>
    <button onclick={startEditor}>Editor</button>
</div>

<SettingsContainer bind:this={settings}></SettingsContainer>

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
    padding: 0.5rem 2rem;
    font-size: 1.2rem;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 15rem;
}
</style>