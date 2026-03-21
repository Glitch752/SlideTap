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
let calibrationInterval: ReturnType<typeof setInterval> | null = null;
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

    if(calibrationData.length >= samplesRequired) {
        calibrationStartTime = null;
        clearInterval(calibrationInterval!);

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

const keyCodeMap: Record<string, string> = {
    ';': "Semicolon",
    "'": "Quote",
    ' ': "Space",
    '[': "BracketLeft",
    ']': "BracketRight",
    '\\': "Backslash",
    ',': "Comma",
    '.': "Period",
    '/': "Slash",
    "ShiftL": "ShiftLeft",
    "ShiftR": "ShiftRight",
    "CtrlL": "ControlLeft",
    "CtrlR": "ControlRight",
    "AltL": "AltLeft",
    "AltR": "AltRight",
    "MetaL": "MetaLeft",
    "MetaR": "MetaRight",
    '`': "Backquote",
    '-': "Minus",
    '=': "Equal",
    "CapsLk": "CapsLock",
};
for(let i = 0; i < 26; i++) {
    const char = String.fromCharCode(65 + i);
    keyCodeMap[char] = `Key${char}`;
}
for(let i = 0; i < 10; i++) {
    const char = String.fromCharCode(48 + i);
    keyCodeMap[char] = `Digit${char}`;
}

const keyboard = [
    ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
    ["CapsLk", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
    ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"],
    ["CtrlL", "MetaL", "AltL", " ", "AltR", "MetaR", "CtrlR"]
];
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
        {#each keyboard as row}
            <div class="row">
                {#each row as key}
                    {@const keyCode = keyCodeMap[key] || key}
                    <span
                        class:fgSlide={Settings.keymap.fg.slideKeys.includes(keyCode)}
                        class:bgSlide={Settings.keymap.bg.slideKeys.includes(keyCode)}
                        class:fgTap={Settings.keymap.fg.tapKeys.includes(keyCode)}
                        class:bgTap={Settings.keymap.bg.tapKeys.includes(keyCode)}
                        class:flex={key === " "}
                    >{key}</span>
                {/each}
            </div>
        {/each}
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
    gap: 0.4rem;
    --key-size: 1.8rem;
    --key-gap: 0.2rem;
    margin: 0 auto;
    width: fit-content;

    .row {
        display: flex;
        flex-direction: row;
        gap: var(--key-gap);

        &:nth-child(4) {
            margin-left: calc(var(--key-size) * 0.2);
        }
    }

    span {
        display: grid;
        place-items: center;
        min-width: var(--key-size);
        height: var(--key-size);
        padding: 0 0.35rem;
        font-family: monospace;
        font-size: 0.78rem;
        line-height: 1;
        white-space: nowrap;
        background-color: var(--surface);
        border: 1px solid #ffffff33;

        &.flex {
            min-width: calc(var(--key-size) * 5.4);
        }

        &.fgSlide {
            background-color: var(--surface-green);
        }
        &.bgSlide {
            background-color: var(--surface-blue);
        }
        &.fgTap {
            background-color: color-mix(in oklab, var(--surface-green), var(--text) 30%);
        }
        &.bgTap {
            background-color: color-mix(in oklab, var(--surface-blue), var(--text) 30%);
        }
    }

    .row:nth-child(1) {
        span:first-child {
            min-width: calc(var(--key-size) * 1.5); // Tab
        }

        span:last-child {
            min-width: calc(var(--key-size) * 1.5); // Backslash
        }
    }

    .row:nth-child(2) {
        span:first-child {
            min-width: calc(var(--key-size) * 1.8); // CapsLk
        }

        span:last-child {
            min-width: calc(var(--key-size) * 2.2); // Enter
        }
    }

    .row:nth-child(3) {
        span:first-child,
        span:last-child {
            min-width: calc(var(--key-size) * 2.35); // Shift keys
        }
    }

    .row:nth-child(4) {
        span:nth-child(1),
        span:nth-child(2),
        span:nth-child(3),
        span:nth-child(5),
        span:nth-child(6),
        span:nth-child(7) {
            min-width: calc(var(--key-size) * 1.3); // Ctrl/Meta/Alt
        }
    }
}
</style>