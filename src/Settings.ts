import { PersistedValue } from "./utils/persistedValue";

export type LayerKeymap = {
    slideKeys: string[],
    tapKeys: string[]
}

export class Settings {
    /**
     * The audio latency. Negative numbers will move the track forward
     * (screen is delayed) and positive numbers will move the track backward
     * (audio output is delayed).
     */
    public static audioLatency: PersistedValue<number> = PersistedValue.get("audio_latency", 0);

    public static keymap: {
        bg: LayerKeymap,
        fg: LayerKeymap
    } = {
        bg: {
            slideKeys: "QWERTYUIOP".split("").map(k => `Key${k}`),
            tapKeys: ["Tab", "BracketLeft", "BracketRight", "Backslash", "Backspace", "ShiftRight", "ArrowDown"]
        },
        fg: {
            slideKeys: "ASDFGHJKL;".split("").map(k => `Key${k}`.replace("Key;", "Semicolon")),
            tapKeys: ["Space", "Quote", "Enter", "CapsLock", "ShiftLeft", "ControlLeft", "MetaLeft", "AltLeft", "ArrowUp"]
        }
    };
}