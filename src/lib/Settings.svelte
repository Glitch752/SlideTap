<script lang="ts">
import { get } from "svelte/store";
import { Settings } from "../Settings";
import { Sounds, SoundType } from "../Sounds";

let audioLatencyWritable = Settings.audioLatency.writable;
let audioLatency = $state(get(audioLatencyWritable));
$effect(() => {
    audioLatencyWritable.update(() => audioLatency);
});

let calibrationData: number[] = [];
let calibrationStartTime: number | null = null;
let calibrationInterval: number | null = null;
const calibrationSoundInterval = 500; // ms; the maximum amount that we can calibrate off
const samplesRequired = 10;
let calibrateText = $state("Calibrate");

function addSample() {
    let dataPoint = Date.now() - (calibrationStartTime ?? 0);
    dataPoint += calibrationSoundInterval / 4;
    dataPoint %= calibrationSoundInterval;
    dataPoint -= calibrationSoundInterval / 4;

    calibrationData.push(dataPoint);

    calibrateText = `Click on beat [${calibrationData.length}/${samplesRequired}]`;

    if (calibrationData.length >= samplesRequired) {
        calibrationStartTime = null;
        clearInterval(calibrationInterval as number);

        const avg = calibrationData.reduce((a, v) => a + v, 0) / calibrationData.length;
        audioLatency = Math.round(avg * 10) / 10;
        calibrateText = "Calibrate";
        window.removeEventListener("keydown", addSample);
    }
}

function startCalibration() {
    if (calibrationStartTime === 0) return;
    if (calibrationStartTime !== null) {
        addSample();
    } else {
        calibrationStartTime = 0;
        calibrationData = [];
        calibrationInterval = setInterval(() => {
            if (calibrationStartTime === 0) calibrationStartTime = Date.now() + 50;
            Sounds.play(SoundType.ClibrationClick, 1, 1, 0);
        }, calibrationSoundInterval);

        calibrateText = `Click on beat`;
        window.addEventListener("keydown", addSample);
    }
}
</script>

<div class="settings">
    <h1>Settings</h1>
    <h2>Audio latency</h2>
    <p>
        Negative numbers will move the track forward (screen is delayed)
        and positive numbers will move the track backward (audio output is delayed).
        Press calibrate and click in sync with the click sounds to fill automatically.
        You may also press any keyboard key for claibration if it's more accurate.
    </p>
    <div class="audio-latency-settings">
        <button class="adjust down" onclick={() => audioLatency -= 25}>-</button>
        <input type="number" name="audioLatency" placeholder="Latency (ms)">
        <button class="adjust up" onclick={() => audioLatency += 25}>+</button>
        <button class="calibrate" style="--progress: 0%" onmousedown={startCalibration}>{calibrateText}</button>
    </div>
    
    <h2>Keyboard layout</h2>
    <p>Note: QWERTY is the only supported layout currently, and the game will play differently on equirectangular keyboard layouts.</p>
    <div class="keyboard-layout-preview">
        <div class="row"><span class="inactive">Q</span><span>W</span><span>E</span><span>R</span><span>T</span><span>Y</span><span>U</span><span>I</span><span>O</span><span class="inactive">P</span></div>
        <div class="row"><span class="inactive">A</span><span>S</span><span>D</span><span>F</span><span>G</span><span>H</span><span>J</span><span>K</span><span>L</span><span class="inactive">;</span></div>
    </div>
</div>

<style lang="scss">
.settings {
    width: 32rem;
}

h1 {
    font-size: 2rem;
    margin: 0 0 1rem 0;
}

h2 {
    font-size: 1.5rem;
    margin: 0;
    &:not(:first-of-type) {
        margin: 2rem 0 0 0;
    }
}

input[type="number"] {
    appearance: textfield;
    font-family: monospace;
    text-align: center;
}
input, button {
    --bg-color: var(--surface);
    color: white;
    border: none;
    padding: 0.25rem 0.5rem;
    outline: none;
    font-size: 1rem;
}

.audio-latency-settings {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;

    input {
        width: 8rem;
    }

    .adjust {
        aspect-ratio: 1;
    }
    .down {
        --bg-color: var(--surface-red);
    }
    .up {
        --bg-color: var(--surface-green);
    }

    .calibrate {
        margin: 0 auto;
        width: 12rem;
        position: relative;

        &::after {
            content: '';
            position: absolute;
            inset: 0;
            width: var(--progress);
            transition: width 200ms ease;
            background-color: var(--surface-green);
        }
    }
}

.keyboard-layout-preview {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    --key-size: 2rem;
    margin: 0 auto;
    width: fit-content;

    .row {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;

        &:nth-child(2) {
            margin-left: calc(var(--key-size) / 3)
        }
    }

    span {
        display: grid;
        place-items: center;
        width: var(--key-size);
        aspect-ratio: 1;
        font-family: monospace;
        background-color: var(--surface);
        // border: 2px solid var(--surface-green);

        &.inactive {
            background-color: var(--surface-inactive);
            border: none;
        }
    }
}
</style>