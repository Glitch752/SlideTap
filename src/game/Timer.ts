import { GameNode, NodeID } from "./types";

export class Timer extends GameNode {
    private running: boolean = false;
    private time: number = 0;
    private timeSource: (() => number) | null = null;

    constructor() {
        super(null);
    }

    public start() {
        this.running = true;
        this.time = 0;
        return this;
    }

    public stop() {
        this.running = false;
        return this;
    }

    public setTimeSource(source: () => number) {
        this.time = source();
        this.timeSource = source;
    }

    public update(deltaTime: number): void {
        if(this.timeSource) {
            this.time = this.timeSource();
        } else if(this.running) {
            this.time += deltaTime;
        }
    }
}