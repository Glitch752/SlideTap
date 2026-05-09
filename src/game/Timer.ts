import { Signal } from "../lib/miniNodeTree";
import { Settings } from "../Settings";
import type { Song } from "../Song";
import { GameNode, NodeID } from "./types";

export class Timer extends GameNode {
    private running: boolean = false;
    private time: number = 0;
    private lastTime: number = 0;
    private timeSource: (() => number) | null = null;
    public done: Signal<[]> = new Signal();
    private length: number = 0;
    private timeScale: number = 1.0;

    public jumpedBackward: Signal<[newTime: number]> = new Signal();

    constructor() {
        super(null);
    }

    public getElapsed() {
        return this.time;
    }

    private audioSourceNode: AudioBufferSourceNode | null = null;

    public startPlayback(song: Song | null) {
        if(!song) return;

        this.running = true;
        this.time = song.startTime;
        this.length = song.length;

        // Stop previous sources
        if(this.audioSourceNode) {
            try { this.audioSourceNode.stop(); } catch {}
            this.audioSourceNode = null;
        }

        if(!song.audioContext || !song.audioBuffer) {
            console.warn("Audio not ready for song", song.name);
            return;
        }

        const ctx = song.audioContext;
        const source = ctx.createBufferSource();
        source.buffer = song.audioBuffer;
        source.playbackRate.value = this.timeScale;
        source.connect(ctx.destination);

        // Calculate when to start and offset
        let songTime = this.time + song.firstBeatOffset * song.beatDuration - Settings.audioLatency.value / 1000.;
        let offset = Math.max(0, songTime);
        let when = ctx.currentTime;
        if(songTime < 0) when -= songTime;
        source.start(when, offset);
        this.audioSourceNode = source;
    }

    public stop() {
        this.running = false;
        if(this.audioSourceNode) {
            try { this.audioSourceNode.stop(); } catch {}
            this.audioSourceNode = null;
        }
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
            this.time += deltaTime * this.timeScale;

            if(this.time >= this.length) {
                this.time = this.length;
                this.running = false;
                this.done();
            }
        }

        if(this.time < this.lastTime) {
            this.jumpedBackward(this.time);
        }
        this.lastTime = this.time;
    }
}