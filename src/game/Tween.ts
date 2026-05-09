import { Signal } from "../lib/miniNodeTree";
import { GameNode } from "./types";

type KeysOfType<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];

type TweenStep<T> =
  | { type: 'interpolate', target: T, property: KeysOfType<T, number>, from?: number, to: number, duration: number, elapsed: number }
  | { type: 'wait', duration: number, elapsed: number }
  | { type: 'callback', fn: () => void, called: boolean };

export class Tween<T = any> extends GameNode {
    private steps: TweenStep<T>[] = [];
    private currentStepIndex: number = 0;
    public complete: Signal<[]> = new Signal();

    constructor() {
        super(null);
    }

    interpolate<K extends KeysOfType<T, number>>(target: T, property: K, to: number, duration: number): this {
        this.steps.push({
            type: 'interpolate',
            target,
            property,
            to,
            duration,
            elapsed: 0
        });
        return this;
    }

    wait(duration: number): this {
        this.steps.push({
            type: 'wait',
            duration,
            elapsed: 0
        });
        return this;
    }

    runCallback(fn: () => void): this {
        this.steps.push({
            type: 'callback',
            fn,
            called: false
        });
        return this;
    }

    update(deltaTime: number): void {
        while(this.currentStepIndex < this.steps.length && deltaTime > 0) {
            const step = this.steps[this.currentStepIndex];
            if(step.type === 'interpolate') {
                if(step.from === undefined) {
                    step.from = step.target[step.property] as unknown as number;
                }
                
                const remaining = step.duration - step.elapsed;
                const dt = Math.min(deltaTime, remaining);
                step.elapsed += dt;
                const t = Math.min(step.elapsed / step.duration, 1);
                const value = step.from + (step.to - step.from) * t;
                step.target[step.property] = value as unknown as T[KeysOfType<T, number>];
                deltaTime -= dt;
                if(step.elapsed >= step.duration) {
                    this.currentStepIndex++;
                } else {
                    break;
                }
            } else if(step.type === 'wait') {
                const remaining = step.duration - step.elapsed;
                const dt = Math.min(deltaTime, remaining);
                step.elapsed += dt;
                deltaTime -= dt;
                if(step.elapsed >= step.duration) {
                    this.currentStepIndex++;
                } else {
                    break;
                }
            } else if(step.type === 'callback') {
                if(!step.called) {
                    step.fn();
                    step.called = true;
                }
                this.currentStepIndex++;
            }
        }

        if(this.currentStepIndex >= this.steps.length) {
            this.removeFromParent();
            this.complete.emit();
        }
    }
}