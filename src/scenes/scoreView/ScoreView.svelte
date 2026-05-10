<script lang="ts">
    import type { Score } from "../../game/Score";
    import { loadScene } from "../../router.svelte";
    import type { Song } from "../../Song";
    import { SongListScene } from "../SongList";
    import LevelLeaderboard from "../songList/LevelLeaderboard.svelte";
    import SmallSongPreview from "../songList/SmallSongPreview.svelte";

    const { score, song, mapPlayed }: { score: Score, song: Song, mapPlayed: number } = $props();

    // Assume song and map info are available via score or props in a real integration
    let playerName = $state("");
    let submitted = $state(false);
    let canSubmit = $derived(!score.failed && !score.isPractice);

    function submitScore(e: SubmitEvent) {
        e.preventDefault();
        song.leaderboard.addEntry(score.score, playerName || "You");
        submitted = true;
    }

    function getHeader() {
        if(score.isPractice) return "Practice finished!";
        if(score.failed) return "Level failed";
        return "Level complete!";
    }

    function percent(val: number) {
        return (val * 100).toFixed(2) + "%";
    }

    function formatScore(val: number) {
        const padded = val.toString().padStart(6, "0");
        return padded.slice(0, 3) + "," + padded.slice(3);
    }
</script>

<div class="score-view-container">
    <div class="score-view">
        <h1
            class:failed={score.failed}
            class:practice={score.isPractice}
            class:complete={!score.failed && !score.isPractice}
        >{getHeader()}</h1>

        <SmallSongPreview {song} i={0} selectedSongIndex={0} showMapIndex={mapPlayed} />
        <div class="center">
            <div class="stats">
                <h2 class="score">{formatScore(score.score)}</h2>
                
                <div class="value" style="color: var(--accent-blue)">
                    <span class="label">Accuracy:</span>
                    {percent(score.accuracyPercent)}
                </div>
                
                <div class="value" style="color: var(--accent-green)">
                    <span class="label">Max Combo:</span>
                    {score.maxCombo} / {score.totalScoringNotes}
                </div>
                
                <div class="value">
                    <span class="label">Notes Hit:</span>
                    {score.hitNotes} / {score.totalScoringNotes}
                </div>
                
                <div class="value" style="color: {score.failed ? 'var(--accent-red)' : 'var(--accent-green)'}">
                    <span class="label">Remaining health:</span>
                    {score.health}
                </div>
            </div>

            <div class="leaderboard-section">
                <div class="leaderboard">
                    <LevelLeaderboard leaderboard={song.leaderboard} />
                </div>
                {#if canSubmit && !submitted}
                    <form class="submit-form" onsubmit={submitScore}>
                        <input class="--button-like" type="text" placeholder="Your name" bind:value={playerName} maxlength="16" />
                        <button type="submit">Submit Score</button>
                    </form>
                {:else if submitted}
                    <div class="submitted-msg">Score submitted!</div>
                {/if}
            </div>
        </div>
        <div class="buttons">
            <button onclick={() => loadScene(new SongListScene())}>Return to Song List</button>
            <!-- TODO: retry button -->
        </div>
    </div>
</div>

<style lang="scss">
.score-view-container {
    display: grid;
    place-items: center;
}
.score-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
}
.center {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: center;
    gap: 2rem;
}

h1 {
    font-size: 4rem;
    font-weight: bold;
    margin-bottom: 1rem;
    text-align: center;
    margin-top: 3rem;
    
    &.failed { color: var(--accent-red); }
    &.practice { color: var(--accent-blue); }
    &.complete { color: var(--accent-green); }
}

.stats {
    display: flex;
    flex-direction: column;
    padding: 1rem 2rem;
    min-width: 320px;
    justify-content: center;
    background-color: var(--panel);
}

.score {
    font-size: 3rem;
    font-family: monospace;
    font-weight: bold;
    color: var(--text);
    margin: 0;
}

.value {
    margin-left: 1rem;
    margin-top: 0.5rem;
    font-size: 1.5rem;
    font-weight: bold;
    
    .label {
        color: var(--text-dim);
        margin-bottom: 0.25rem;
        margin-right: 0.5rem;
        font-size: 1rem;
        vertical-align: middle;
    
        &:not(:first-child) {
            margin-top: 1rem;
        }
    }
}

.leaderboard-section {
    background-color: var(--panel);
    padding: 1rem 1.5rem;
    min-width: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    .leaderboard {
        flex: 1;
        width: 100%;
    }
}

.submit-form {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    margin-top: 1rem;
    width: 100%;
    input {
        --bg-color: var(--surface);
        flex: 1;
        font-size: 1.25rem;
        padding: 0.25rem 0.75rem;
        border: none;
        color: var(--text);
        width: 10rem;
    }

    button {
        --bg-color: var(--surface-green);
        padding: 0.25rem 1.25rem;
    }
}
.submitted-msg {
    color: var(--accent-green);
    font-size: 1.25rem;
    margin-top: 1rem;
}

.buttons {
    display: flex;
    flex-direction: row;
    width: 100%;

    > button {
        flex: 1;
    }
}
button {
    --bg-color: var(--panel);
    color: var(--text);
    font-size: 1.25rem;
    padding: 0.5rem 2rem;
    border: none;
    cursor: pointer;
}
</style>