<script lang="ts">
import { fly } from "svelte/transition";
import Settings from "../../lib/Settings.svelte";

let settingsOpen = $state(false);

export function open() {
    settingsOpen = true;
}
</script>

<svelte:document onkeydown={(e) => {
    if(e.code === "Escape") {
        settingsOpen = false;
    }
}}></svelte:document>

{#if settingsOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="settings-container" onclick={(e) => {
        if(e.target === e.currentTarget) {
            settingsOpen = false;
        }
    }}>
        <div class="settings" transition:fly={{ duration: 200, y: -20 }}>
            <Settings></Settings>
        </div>
    </div>
{/if}

<style lang="scss">
.settings-container {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    inset: 0;
    z-index: 100;
}
.settings {
    background-color: var(--panel);
    padding: 2rem;
    border-radius: 5px;
    max-height: 80vh;
    overflow: auto;
    box-shadow: 0 0 10px black;
}
</style>