import { PersistedValue } from "./utils/persistedValue";

export type LayerKeymap = {
    slideKeys: string[][],
    tapKeys: string[]
}

export class Settings {
    /**
     * The audio latency in ms. Negative numbers will move the track forward
     * (screen is delayed) and positive numbers will move the track backward
     * (audio output is delayed).
     */
    public static audioLatency: PersistedValue<number> = PersistedValue.get("audio_latency", 0);

    public static keymap: {
        bg: LayerKeymap,
        fg: LayerKeymap
    } = {
        bg: {
            slideKeys: [
                "QWERTYUIOP".split("").map(k => `Key${k}`),
                "1234567890".split("").map(k => `Digit${k}`)
            ],
            tapKeys: ["Tab", "BracketLeft", "BracketRight", "Backslash", "Backspace", "ShiftRight", "ControlRight", "AltRight", "ArrowDown", "ArrowRight", "Backquote", "Minus", "Equal"]
        },
        fg: {
            slideKeys: [
                "ASDFGHJKL;".split("").map(k => `Key${k}`.replace("Key;", "Semicolon")),
                "ZXCVBNM,./".split("").map(k => {
                    if(k === ",") return "Comma";
                    if(k === ".") return "Period";
                    if(k === "/") return "Slash";
                    return `Key${k}`;
                })
            ],
            tapKeys: ["Space", "Quote", "Enter", "CapsLock", "ShiftLeft", "ControlLeft", "AltLeft", "ArrowUp", "ArrowLeft"]
        }
    };
}