import { Signal } from "../lib/miniNodeTree";
import { Settings } from "../Settings";
import type { Song } from "../Song";
import { GameNode } from "./types";

export enum TimerState {
    Stopped,
    Running,
    Paused
}

export class Timer extends GameNode {
    public state: TimerState = TimerState.Stopped;
    public stateChanged: Signal<[state: TimerState]> = new Signal();
    
    private time: number = 0;
    private lastTime: number = 0;
    private timeSource: (() => number) | null = null;
    public done: Signal<[]> = new Signal();
    private length: number = 0;
    private timeScale: number = 1.0;

    public jumpedBackward: Signal<[newTime: number]> = new Signal();

    constructor(speed: number = 1) {
        super(null);
        this.timeScale = speed;
    }

    public getElapsed() {
        return this.time;
    }

    private audioSourceNode: AudioBufferSourceNode | null = null;
    private song: Song | null = null;
    private stopTimeout: ReturnType<typeof setTimeout> | null = null;
    private stopPreviousPlaybackImmediately() {
        // Stop previous sources
        if(this.audioSourceNode) {
            this.audioSourceNode.stop();
            this.audioSourceNode.disconnect();
            if(this.stopTimeout) {
                clearTimeout(this.stopTimeout);
                this.stopTimeout = null;
            }
            this.audioSourceNode = null;
        }
    }

    public startPlayback(song: Song | null) {
        if(!song) return;
        if(this.state === TimerState.Running) return;

        this.state = TimerState.Running;
        this.stateChanged(this.state);

        this.time = song.startTime;
        this.length = song.length;
        this.song = song;

        this.stopPreviousPlaybackImmediately();

        const audioData = song.audioFileData;
        if(!audioData) {
            console.warn("Audio not ready for song", song.name);
            return;
        }

        const ctx = audioData.context;
        const source = ctx.createBufferSource();
        source.buffer = audioData.buffer;
        source.playbackRate.value = this.timeScale;
        source.connect(audioData.fadeGain);

        audioData.fadeGain.gain.cancelScheduledValues(ctx.currentTime);
        audioData.fadeGain.gain.setValueAtTime(0, ctx.currentTime);
        audioData.fadeGain.gain.setTargetAtTime(1, ctx.currentTime, 0.05);

        // Calculate when to start and offset
        let songTime = this.time + song.firstBeatOffset * song.beatDuration - Settings.audioLatency.value / 1000.;
        let offset = Math.max(0, songTime);
        let when = ctx.currentTime;
        if(songTime < 0) when -= songTime;
        source.start(when, offset);
        this.audioSourceNode = source;
    }

    public stop() {
        if(this.state === TimerState.Stopped) return;
        
        this.state = TimerState.Stopped;
        this.stateChanged(this.state);
        this.stopPlayback();
    }
    public pause() {
        this.state = TimerState.Paused;
        this.stateChanged(this.state);
        this.stopPlayback();
    }
    private stopPlayback() {
        if(this.audioSourceNode) {
            // try { this.audioSourceNode.stop(); } catch {}
            this.audioSourceNode.stop(0.2);
            this.stopTimeout = setTimeout(() => {
                this.audioSourceNode?.disconnect();
                this.stopTimeout = null;
                this.audioSourceNode = null;
            }, 200);

            const audioData = this.song?.audioFileData;
            if(audioData) {
                audioData.fadeGain.gain.setTargetAtTime(0, audioData.context.currentTime, 0.05);
            }
        }
    }

    public unpause() {
        if(this.state !== TimerState.Paused) return;

        this.state = TimerState.Running;
        this.stateChanged(this.state);
        // Re-create buffer source and resume playback from current time
        const song = this.song;
        if(song && song.audioFileData) {
            this.stopPreviousPlaybackImmediately();

            const audioData = song.audioFileData;
            const source = audioData.context.createBufferSource();
            source.buffer = audioData.buffer;
            source.playbackRate.value = this.timeScale;
            source.connect(audioData.fadeGain);

            audioData.fadeGain.gain.cancelScheduledValues(audioData.context.currentTime);
            audioData.fadeGain.gain.setValueAtTime(0, audioData.context.currentTime);
            audioData.fadeGain.gain.setTargetAtTime(1, audioData.context.currentTime, 0.05);

            // Calculate offset for resume
            let songTime = this.time + song.firstBeatOffset * song.beatDuration - Settings.audioLatency.value / 1000.;
            let offset = Math.max(0, songTime);
            let when = audioData.context.currentTime;
            if(songTime < 0) when -= songTime;
            source.start(when, offset);
            this.audioSourceNode = source;
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
        } else if(this.state === TimerState.Running) {
            this.time += deltaTime * this.timeScale;

            if(this.time >= this.length) {
                this.time = this.length;
                this.stop();
                this.done();
            }
        }

        if(this.time < this.lastTime) {
            this.jumpedBackward(this.time);
        }
        this.lastTime = this.time;
    }
}