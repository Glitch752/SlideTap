<script lang="ts">
    import type { SongLeaderboard } from "../../SongLeaderboard";
    import { dateFormat, numberFormat } from "./SongList.svelte";

    const {
        leaderboard
    }: {
        leaderboard: SongLeaderboard
    } = $props();

    let updates = $state(0);

    function update() {
        // rerender component
        updates++;
    }

    $effect(() => {
        leaderboard.changed.connect(update);
        return () => leaderboard.changed.disconnect(update);
    });
</script>

{#key updates}
    <div class="leaderboard">
        <h2>Leaderboard</h2>
        {#if leaderboard.hasEntries()}
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Name</th>
                        <th>Score</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {#each leaderboard.entries as entry, idx}
                        <tr>
                            <td class="index">{idx + 1}</td>
                            <td class="name">{entry.name}</td>
                            <td>{numberFormat.format(entry.score)}</td>
                            <td>{dateFormat.format(entry.time)}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {:else}
            <p>This song has no leaderboard entries yet. Be the first to add one!</p>
            <p class="note">Leaderboard is currently only local. It's a wip!</p>
        {/if}
    </div>
{/key}

<style lang="scss">
.leaderboard {
    grid-column: 1 / -1;
    grid-row: 6;
}

h2 {
    font-size: 1.5rem;
    margin: 0.5rem 0;
}

table {
    width: 100%;
    border-collapse: collapse;

    th, td {
        text-align: left;
        padding: 0.25rem 1rem;
    }

    .index {
        width: 2rem;
        color: var(--text-dim);
    }
    .name {
        max-width: calc(100% - 10rem);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    tbody tr:nth-child(odd) {
        background-color: color-mix(var(--surface) 25%, var(--panel));
    }
}

p {
    text-align: center;
    margin: 0.5rem 0;

    &.note {
        color: var(--text-dim);
    }
}
</style>