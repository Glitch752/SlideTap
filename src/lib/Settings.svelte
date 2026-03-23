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

function calibratePress() {
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
    "◀": "ArrowLeft",
    "▲": "ArrowUp",
    "▼": "ArrowDown",
    "▶": "ArrowRight",
    "Bksp": "Backspace",
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
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Bksp"],
    ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
    ["CapsLk", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
    ["ShiftL", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "ShiftR"],
    ["CtrlL", "MetaL", "AltL", " ", "AltR", "MetaR", "CtrlR", "◀", ["▲", "▼"], "▶"],
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
        <input type="number" name="audioLatency" placeholder="Latency (ms)" bind:value={audioLatency}>
        <button class="adjust up" onclick={() => audioLatency += 25}>+</button>
        <button class="calibrate" style="--progress: 0%" onmousedown={calibratePress}>{calibrateText}</button>
    </div>
    
    <h2>Keyboard layout</h2>
    <p>Note: QWERTY is the only supported layout currently, and the game will play differently on equirectangular keyboard layouts.</p>
    <p>This keyboard also acts as a tester. If your taps aren't being registered, check what your keyboard is reporting here. Many laptop keyboards don't support <a href="https://en.wikipedia.org/wiki/Rollover_(key)" target="_blank">rollover</a> on certain keys, which will cause missed inputs on a game like this where many keys must be pressed simultaneously.</p>
    <div class="keyboard-layout-preview">
        {#each keyboard as row}
            <div class="row">
                {#snippet keyEl(key: string)}
                    {@const keyCode = keyCodeMap[key] || key}
                    <span
                        class:fgSlide={Settings.keymap.fg.slideKeys.some(k => k.includes(keyCode))}
                        class:bgSlide={Settings.keymap.bg.slideKeys.some(k => k.includes(keyCode))}
                        class:fgTap={Settings.keymap.fg.tapKeys.includes(keyCode)}
                        class:bgTap={Settings.keymap.bg.tapKeys.includes(keyCode)}
                        class:flex={key === " "}
                        class:small={key.length > 1}
                        data-animate-keycode={keyCode}
                    >{key}</span>
                {/snippet}
                {#each row as key}
                    {#if typeof key === "string"}
                        {@render keyEl(key)}
                    {:else}
                        <div class="vertical-stack">
                            {@render keyEl(key[0])}
                            {@render keyEl(key[1])}
                        </div>
                    {/if}
                {/each}
            </div>
        {/each}
    </div>
    <p>This game allows you to use the whole keyboard, but you don't need to! The colors on this keymap represent:</p>
    <ul class="keyboard-legend">
        <li><span class="fgSlide">Green</span>: Foreground slide keys</li>
        <li><span class="bgSlide">Blue</span>: Background slide keys</li>
        <li><span class="fgTap">Light green</span>: Foreground tap keys</li>
        <li><span class="bgTap">Light blue</span>: Background tap keys</li>
    </ul>
</div>

<svelte:document onkeydown={(e) => {
    if(e.repeat) return;
    document.querySelector(`[data-animate-keycode="${e.code}"]`)?.animate(
        [
            { filter: "brightness(150%)", offset: 0 },
            { filter: "brightness(120%)", offset: 1 }
        ],
        {
            duration: 200,
            iterations: 1,
            fill: "forwards"
        }
    );
}} onkeyup={(e) => {
    document.querySelector(`[data-animate-keycode="${e.code}"]`)?.animate(
        [
            { filter: "brightness(120%)", offset: 0 },
            { filter: "brightness(100%)", offset: 1 }
        ],
        {
            duration: 200,
            iterations: 1,
            fill: "forwards"
        }
    );
}}></svelte:document>

<style lang="scss">
.settings {
    width: 48rem;
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


// :root to increase specificity lol
:root .fgSlide {
    --color: var(--surface-green);
}
:root .bgSlide {
    --color: var(--surface-blue);
}
:root .fgTap {
    --color: color-mix(in oklab, var(--surface-green), var(--text) 30%);
}
:root .bgTap {
    --color: color-mix(in oklab, var(--surface-blue), var(--text) 30%);
}

.keyboard-layout-preview {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    --key-size: 2.5rem;
    --key-gap: 0.5rem;
    margin: 0 auto;
    width: fit-content;

    .row {
        display: flex;
        flex-direction: row;
        gap: var(--key-gap);

        &:not(:last-child) :last-child {
            flex-grow: 1;
        }
    }

    .vertical-stack {
        display: flex;
        flex-direction: column;
        gap: var(--key-gap);

        span {
            height: calc(var(--key-size) / 2 - var(--key-gap) / 2);
            font-size: 0.5rem;
        }
    }

    span {
        display: grid;
        place-items: center;
        min-width: var(--key-size);
        height: var(--key-size);
        padding: 0 0.35rem;
        font-family: monospace;
        font-size: 1rem;
        line-height: 1;
        white-space: nowrap;
        --color: var(--surface);
        background-color: var(--color);
        border: 1px solid #ffffff33;

        box-shadow: 0 2px color-mix(in srgb, black 20%, var(--color));

        &.flex {
            flex-grow: 1;
        }

        &.small {
            font-size: 0.8rem;
        }
    }

    .row:nth-child(2) {
        span:first-child {
            min-width: calc(var(--key-size) * 1.5); // Tab
        }

        span:last-child {
            min-width: calc(var(--key-size) * 1.5); // Backslash
        }
    }

    .row:nth-child(3) {
        span:first-child {
            min-width: calc(var(--key-size) * 1.8); // CapsLk
        }

        span:last-child {
            min-width: calc(var(--key-size) * 2.2); // Enter
        }
    }

    .row:nth-child(4) {
        span:first-child,
        span:last-child {
            min-width: calc(var(--key-size) * 2.35); // Shift keys
        }
    }

    .row:nth-child(5) {
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

.keyboard-legend {
    list-style: none;
    padding-left: 0;

    span {
        color: color-mix(in oklab, var(--color), var(--text) 30%);
        font-weight: bold;
    }
}
</style>