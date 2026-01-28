type LeaderboardEntry = {
    score: number;
    name: string;
    /** Submission time in UTC unix epoch milliseconds */
    time: number;
};

/**
 * For now, the leaderboard implementation only tracks local times; this could be
 * updated with a small backend in the future, though.
 */
export class SongLeaderboard {
    public static readonly MAX_ENTRIES = 10;
    /**
     * The top MAX_ENTRIES leaderboard entries for this song, sorted in descending order.
     */
    public entries: LeaderboardEntry[];
    
    constructor(private id: string) {
        this.entries = JSON.parse(
            localStorage.getItem(this.getStorageKey()) ?? "[]"
        );
    }

    private getStorageKey(): string {
        return `leaderboard_${this.id}`;
    }

    private save() {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(this.entries));
    }

    public hasEntries(): boolean {
        return this.entries.length > 0;
    }

    public addEntry(score: number, name: string = "You") {
        this.entries.push({
            time: Date.now(),
            score,
            name
        });

        this.entries.sort((a, b) => b.score - a.score); // descending order
        while(this.entries.length > SongLeaderboard.MAX_ENTRIES) this.entries.pop();

        this.save();
    }
}