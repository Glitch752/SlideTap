<script lang="ts">
    let open = $state(false);
    let speed = $state(100);
    let practiceMenu: HTMLDivElement;

    const { loadPractice }: { loadPractice: (speed: number) => void } = $props();

    function handleClickOutside(event: MouseEvent) {
        const path = event.composedPath();
        if(!path.includes(practiceMenu)) {
            open = false;
            document.removeEventListener("click", handleClickOutside);
        }
    }

    export function toggle() {
        open = !open;

        if(open) {
            setImmediate(() => document.addEventListener("click", handleClickOutside));
        } else {
            document.removeEventListener("click", handleClickOutside);
        }
    }
</script>

<div class="practice-mode" class:show={open} bind:this={practiceMenu}>
    <label for="speed">Speed: <span id="speed-value">{speed}%</span></label>
    <input type="range" min="5" max="150" id="speed" bind:value={speed} />
    <button onclick={() => loadPractice(speed / 100)}>Start Practice</button>
</div>

<style lang="scss">
.practice-mode {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;

    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    width: 300px;

    background: var(--surface);
    box-shadow: 0 0 5px #00000080;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-10px);
    transition: opacity 0.3s ease, transform 0.3s ease;


    &.show {
        opacity: 1;
        pointer-events: all;
        transform: translateY(0);
    }

    label {
        font-size: 1.25rem;
        margin-bottom: 0.25rem;
    }
}

input[type="range"] {
    width: 100%;
    accent-color: var(--accent-blue);
    margin-bottom: 0.5rem;
    position: relative;

    &::-moz-range-thumb, &::-webkit-slider-thumb {
        width: 12px;
        height: 12px;
        background: var(--surface);
        border: 2px solid var(--accent-blue);
        border-radius: 50%;
        cursor: pointer;
    }
    &::-moz-range-track, &::-webkit-slider-runnable-track {
        height: 4px;
        background: var(--text);
        border-radius: 2px;
    }
    &::-moz-range-progress {
        height: 4px;
        background: var(--accent-blue);
        border-radius: 2px;
    }
}

button {
    --bg-color: var(--panel);
    margin-top: 0.5rem;
    padding: 0.5rem;
    font-size: 1.25rem;
    border: none;
    color: var(--text);
}
</style>