import { Signal } from "../lib/miniNodeTree";
import { GameNode } from "./types";

type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];

export class Tween<T> extends GameNode {
    private elapsed: number = 0;
    private from: number = 0;

    public complete: Signal<[]> = new Signal();

    constructor(
        private target: T,
        private property: KeysOfType<T, number>,
        private to: number,
        private duration: number
    ) {
        super(null);

        this.from = this.target[this.property] as unknown as number;
    }

    update(deltaTime: number): void {
        this.elapsed += deltaTime;
        const t = Math.min(this.elapsed / this.duration, 1);
        const value = this.from + (this.to - this.from) * t;
        this.target[this.property] = value as unknown as T[KeysOfType<T, number>];

        if(t >= 1) {
            this.removeFromParent();
            this.complete.emit();
        }
    }
}