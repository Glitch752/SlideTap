import type { Writable } from "svelte/store";

export class PersistedValue<V> {
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

    get writable(): Writable<V> {
        return {
            set: (value: V) => {
                this.value = value;
            },
            subscribe: (run, _invalidate) => {
                this.addCallback(run);
                run(this.value);
                
                return () => {
                    this.removeCallback(run);
                };
            },
            update: (updater) => {
                this.value = updater(this.value);
            }
        };
    }

    private static instances: Map<string, PersistedValue<any>> = new Map();
    public static get<V>(key: string, defaultValue: V): PersistedValue<V> {
        if(this.instances.has(key)) return this.instances.get(key)!;
        const instance = new PersistedValue<V>(defaultValue, key);
        this.instances.set(key, instance);
        return instance;
    }

    private constructor(defaultValue: V, private key: string) {
        this._value = JSON.parse(localStorage.getItem(key) ?? "null") ?? defaultValue;
    }

    public addCallback(cb: (newValue: V) => void) {
        this.callbacks.push(cb);
    }

    public removeCallback(cb: (newValue: V) => void) {
        this.callbacks = this.callbacks.filter(f => f !== cb);
    }
}