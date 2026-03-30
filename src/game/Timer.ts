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

    public jumpedBackward: Signal<[newTime: number]> = new Signal();

    constructor() {
        super(null);
    }

    public getElapsed() {
        return this.time;
    }

    public start() {
        this.running = true;
        this.time = 0;
        this.length = Infinity;
        return this;
    }

    public startPlayback(song: Song | null) {
        if(!song) {
            return;
        }

        this.running = true;
        this.time = song.firstBeatOffset * song.beatDuration;
        if(!song.track) return;
        
        let songTime = this.time + song.startTime - Settings.audioLatency.value / 1000.;
        if(songTime < 0) {
            // If the time is negative, we need to delay the start of the track
            setTimeout(() => {
                song.track?.play();
            }, -songTime * 1000);
        } else {
            // Otherwise, we can start the track immediately and seek to the correct time
            song.track.currentTime = songTime;
            song.track.play();
        }
        this.length = song.length + song.firstBeatOffset * song.beatDuration;
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

            if(this.time >= this.length) {
                this.time = this.length;
                this.running = false;
                this.done();
            }
        }
    }
}