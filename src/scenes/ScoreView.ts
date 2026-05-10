import type { Score } from "../game/Score";
import type { Song } from "../Song";
import type { Scene } from "./Scene";
import ScoreView from "./scoreView/ScoreView.svelte";

export class ScoreViewScene implements Scene {
    public component = ScoreView;
    public componentProps() {
        return {
            score: this.score,
            song: this.song,
            mapPlayed: this.mapPlayed
        };
    }

    constructor(public score: Score, public song: Song, public mapPlayed: number) {}
}