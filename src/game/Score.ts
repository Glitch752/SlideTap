import { Signal } from "../lib/miniNodeTree";

export class Score {
    public health: number = 100;
    public score: number = 0;
    public maxScorePossible: number = 0;
    public combo: number = 0;
    public maxCombo: number = 0;
    public totalScoringNotes: number = 0;
    public hitNotes: number = 0;
    public failed: boolean = false;
    public finished: boolean = false;

    public get scorePercent(): number {
        return this.maxScorePossible === 0 ? 0 : this.score / this.maxScorePossible;
    }
    public get accuracyPercent(): number {
        return this.totalScoringNotes === 0 ? 0 : this.hitNotes / this.totalScoringNotes;
    }

    public ended: Signal<[]> = new Signal();

    private getScoreIncrement(): number {
        return Math.min(this.combo, 10);
    }

    public onNoteHit() {
        if(this.failed || this.finished) return;
        this.hitNotes++;
        this.combo++;
        if(this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.health = Math.min(100, this.health + 3);
        this.score += this.getScoreIncrement();
        this.maxScorePossible += this.getScoreIncrement();
    }
    public onNoteMiss() {
        if(this.failed || this.finished) return;
        this.combo = 0;
        this.health = Math.max(0, this.health - 10);
        if(this.health === 0) {
            this.failed = true;
            this.end();
        }
        this.maxScorePossible += this.getScoreIncrement();
    }

    public end() {
        this.finished = true;
        this.ended();
    }
}