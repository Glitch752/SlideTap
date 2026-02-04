import { PersistedValue } from "./utils/persistedValue";

export class Settings {
    /**
     * The audio latency. Negative numbers will move the track forward
     * (screen is delayed) and positive numbers will move the track backward
     * (audio output is delayed).
     */
    public static audioLatency: PersistedValue<number> = new PersistedValue(0, "audio_latency");
}