<script lang="ts">
    import { fade } from "svelte/transition";
    import { TimerState, type Timer } from "../../game/Timer";
    import { loadScene } from "../../router.svelte";
    import { SongListScene } from "../SongList";

    const {
        timer
    }: {
        timer: Timer
    } = $props();

    // svelte-ignore state_referenced_locally
    // We intentionally initialize to false since the timer starts not running. There's probably a less hacky way to do this.
    let paused = $state(false);
    $effect(() => {
        timer.stateChanged.connect((state) => {
            paused = state === TimerState.Paused;
        });
    });
</script>

{#if paused}
    <div class="overlay" transition:fade={{ duration: 100 }}>
        <div class="pauseMenu">
            <h1>Paused</h1>
            <button onclick={() => timer.unpause()}>Resume</button>
            <button onclick={() => loadScene(new SongListScene())}>Exit</button>
        </div>
    </div>
{/if}

<style lang="scss">
.overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.pauseMenu {
    background-color: var(--panel);
    padding: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;

    h1 {
        margin: 0 2rem;
    }

    button {
        --bg-color: var(--surface);
        color: var(--text);
        padding: 0.5rem 1rem;
        font-size: 1rem;
        cursor: pointer;
        border: none;
        width: 100%;
    }
}
</style>