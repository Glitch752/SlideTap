import { Sounds, SoundType } from "./Sounds";

class PersistedValue<V> {
    private _value: V;
    private callbacks: ((newValue: V) => void)[] = [];

    get value(): V {
        return this._value;
    }
    set value(val: V) {
        this._value = val;
        localStorage.setItem(this.key, JSON.stringify(this._value));
        this.callbacks.forEach(cb => cb(val));
    }

    constructor(private defaultValue: V, private key: string) {
        this._value = JSON.parse(localStorage.getItem(key) ?? "null") ?? defaultValue;
    }

    public addCallback(cb: (newValue: V) => void) {
        this.callbacks.push(cb);
    }

    public connectInput(el: HTMLInputElement) {
        if(typeof this.value === "number") {
            el.onchange = (_ev: Event) => {
                this.value = parseFloat(el.value) as V;
            };
            el.value = (this._value as number).toString();
            this.addCallback(v => el.value = (v as number).toString());
        } else if(typeof this.value === "string") {
            el.onchange = (_ev: Event) => {
                this.value = el.value as V;
            };
            el.value = this._value as string;
            this.addCallback(v => el.value = v as string);
        } else {
            throw new Error("Unable to connect input to persisted value which isn't a number or string");
        }
    }
}

export class Settings {
    /**
     * The audio latency. Negative numbers will move the track forward
     * (screen is delayed) and positive numbers will move the track backward
     * (audio output is delayed).
     */
    public audioLatency: PersistedValue<number> = new PersistedValue(0, "audio_latency");

    constructor() {
        this.setupAudioLatencyUI();
    }

    private setupAudioLatencyUI() {
        const adjustDownButton = document.getElementById("audioLatencyDown") as HTMLButtonElement;
        const audioLatencyInput = document.getElementById("audioLatency") as HTMLInputElement;
        const adjustUpButton = document.getElementById("audioLatencyUp") as HTMLButtonElement;
        const latencyCalibrateButton = document.getElementById("audioLatencyCalibrate") as HTMLButtonElement;
        
        this.audioLatency.connectInput(audioLatencyInput);
        adjustUpButton.onclick = () => this.audioLatency.value += 50;
        adjustDownButton.onclick = () => this.audioLatency.value -= 50;

        let calibrationData: number[] = [];
        let calibrationStartTime: number | null = null;
        let calibrationInterval: number | null = null;
        const calibrationSoundInterval = 500; // ms; the maximum amount that we can calibrate off
        const initialText = latencyCalibrateButton.textContent;
        const samplesRequired = 10;

        const addSample = () => {
            let dataPoint = Date.now() - (calibrationStartTime ?? 0);
            // /4 because we bias toward there being positive instead of negative latency
            dataPoint += calibrationSoundInterval / 4;
            dataPoint %= calibrationSoundInterval;
            dataPoint -= calibrationSoundInterval / 4;

            calibrationData.push(dataPoint);

            latencyCalibrateButton.textContent = `Click on beat [${calibrationData.length}/${samplesRequired}]`;
        
            if(calibrationData.length >= samplesRequired) {
                // Stop calibrating
                calibrationStartTime = null;
                clearInterval(calibrationInterval as number);
                console.log(calibrationData);

                const avg = calibrationData.reduce((a, v) => a + v, 0) / calibrationData.length;
                this.audioLatency.value = Math.round(avg * 10) / 10;
                document.removeEventListener("keydown", addSample);

                latencyCalibrateButton.textContent = initialText;
            }
        };

        latencyCalibrateButton.onmousedown = () => {
            if(calibrationStartTime === 0) return;
            if(calibrationStartTime !== null) {
                addSample();
            } else {
                calibrationStartTime = 0;
                calibrationData = [];
                calibrationInterval = setInterval(() => {
                    if(calibrationStartTime === 0) calibrationStartTime = Date.now() + 50;
                    Sounds.play(SoundType.ClibrationClick, 1, 1, 0);
                }, calibrationSoundInterval);

                latencyCalibrateButton.textContent = `Click on beat`;
                document.addEventListener("keydown", addSample);
            }
        }
    }
}