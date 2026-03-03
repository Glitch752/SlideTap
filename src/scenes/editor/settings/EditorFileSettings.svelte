<script lang="ts">
    import type { EditorFile } from "../EditorFile";
    import { guess } from 'web-audio-beat-detector';
    import EditorFileMapSettings from "./EditorFileMapSettings.svelte";

    const {
        file
    }: {
        file: EditorFile
    } = $props();

    const coverImageUrl = $derived(file.coverImageUrl);
    const audioFileData = $derived(file.audioFileData);
    const trackDuration = $derived($audioFileData?.buffer?.duration ?? 0);

    const meta = $derived(file.meta);
    let bpm = $derived($meta.bpm);
    let offset = $derived($meta.firstBeatOffset);
    let segmentStart = $derived($meta.start);
    let segmentEnd = $derived($meta.start + $meta.length);

    $effect(() => {
        file.meta.set({
            ...file.getMeta(),
            bpm,
            firstBeatOffset: offset,
            start: segmentStart,
            length: segmentEnd - segmentStart
        });
        file.changed();
    });

    $effect(() => {
        if(!$audioFileData) {
            segmentStart = 0;
            segmentEnd = 0;
            return;
        } else {
            segmentStart = 0;
            segmentEnd = Math.round(trackDuration * 10) / 10;
        }
    });
    
    function clampSegment() {
        if(segmentStart < 0) segmentStart = 0;
        if(segmentEnd > trackDuration) segmentEnd = trackDuration;
        if(segmentStart > segmentEnd) segmentStart = segmentEnd;
        if(segmentEnd < segmentStart) segmentEnd = segmentStart;
    }

    function formatTime(t: number) {
        if(!isFinite(t)) return '0:00';
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    async function autodetectTempo() {
        if(!$audioFileData) {
            alert("Please upload an audio file first.");
            return;
        }

        const { bpm: guessedBpm, offset: guessedOffset } = await guess($audioFileData.buffer);
        
        bpm = guessedBpm;
        offset = guessedOffset;
    }
</script>

<div class="settings">
    <h2>File Settings</h2>
    
    <label for="name">Name</label>
    <input id="name" value={$meta.name} onchange={(e) => {
        file.meta.set({ ...file.getMeta(), name: (e.target as HTMLInputElement).value });
        file.changed();
    }} placeholder="Name" type="text" />

    <label for="artist">Artist</label>
    <input id="artist" value={$meta.artist} onchange={(e) => {
        file.meta.set({ ...file.getMeta(), artist: (e.target as HTMLInputElement).value });
        file.changed();
    }} placeholder="Artist" type="text" />
    <label for="coverImage">Cover Image</label>
    <div class="row">
        <input id="coverImage" type="file" accept="image/*" onchange={(e) => {
            const el = e.target as HTMLInputElement;
            if(!el.files?.[0]) return;

            file.setCoverImage(el.files[0]);
            file.changed();
        }} />
        <button onclick={() => {
            file.setCoverImage(null);
            file.changed();
        }}>Reset</button>
    </div>
    {#if $coverImageUrl}
        <img class="cover" src={$coverImageUrl} alt="Cover" />
    {:else}
        <div class="cover placeholder">No Cover</div>
    {/if}

    <hr />

    <label for="track">Track</label>
    <div class="row">
        <input id="track" type="file" accept="audio/*" onchange={(e) => {
            const el = e.target as HTMLInputElement;
            if(!el.files?.[0]) return;

            file.setAudioFile(el.files[0]);
            file.changed();
        }} />
        <button onclick={() => {
            file.setAudioFile(null);
            file.changed();
        }}>Reset</button>
    </div>
    {#if $audioFileData}
        <audio controls>
            <source src={$audioFileData.url} type={$audioFileData.blob.type} />
        </audio>
    {:else}
        <div class="placeholder-audio">No Audio</div>
    {/if}

    {#if trackDuration > 0}
        <span>Segment</span>
        <div class="segment-section">
            <div class="segment-bar-container">
                <div class="bg">
                    <div class="range" style="left: {
                        (segmentStart/trackDuration)*100
                    }%; width:{
                        ((segmentEnd-segmentStart)/trackDuration)*100
                    }%"></div>
                </div>
                <div class="labels">
                    <span>{formatTime(segmentStart)} ({Math.round((segmentStart/trackDuration)*100)}%)</span>
                    <span>{formatTime(segmentEnd)} ({Math.round((segmentEnd/trackDuration)*100)}%)</span>
                </div>
            </div>
            <div class="segment-inputs-row">
                <input id="segmentStart" type="number" min="0" max={trackDuration} step="0.01" bind:value={segmentStart} onchange={clampSegment} />
                <input id="segmentEnd" type="number" min="0" max={trackDuration} step="0.01" bind:value={segmentEnd} onchange={clampSegment} />
            </div>
        </div>
    {/if}

    <div class="tempo-info">
        <div>
            <label for="bpm">BPM</label>
            <input id="bpm" bind:value={bpm} type="number" />
        </div>
        <div>
            <label for="offset">Offset (beats)</label>
            <input id="offset" bind:value={offset} type="number" />
        </div>
    </div>
    <button onclick={autodetectTempo}>Autodetect</button>
    
    <hr />

    <span>Maps</span>
    <EditorFileMapSettings {file} />
</div>

<style lang="scss">
.settings {
    padding: 1rem 0.5rem;
}

h2 {
    margin: 0;
    font-size: 1.25em;
}
label, span {
    display: block;
    font-size: 1.1em;
    margin-top: 1.5rem;
}
input[type="text"], input[type="number"] {
    display: block;
    background-color: var(--panel);
    width: 100%;
    border: 2px solid var(--surface);
    color: var(--text);
    font-size: 0.9em;
    padding: 2px 4px;
}
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}
input[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield;
}

input[type="file"] {
    font-size: 0.9em;
}

.row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
button, input[type="file"]::file-selector-button {
    background-color: var(--panel);
    border: 2px solid var(--surface);
    color: var(--text);
    font-size: 1em;
    padding: 2px 4px;
    margin-bottom: 0.25rem;

    &:hover {
        background-color: var(--surface);
    }
}
input[type="file"]::file-selector-button {
    margin-right: 1rem;
}

.cover {
    background-color: var(--background);
    aspect-ratio: 1 / 1;
    width: 200px;
    margin: 0 auto;
    border: 2px solid var(--panel);

    display: grid;
    place-items: center;
    
    object-fit: cover;
}

hr {
    border: none;
    background-color: var(--surface);
    height: 2px;
    margin: 1rem 0;
}

.placeholder-audio, audio {
    background-color: var(--background);
    width: 100%;
    border: 2px solid var(--panel);
    text-align: center;
}
.placeholder-audio {
    padding: 0.5rem 0;
}

.tempo-info {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    gap: 0.5rem;

    > div {
        min-width: 125px;
        flex: 1;
    }

    margin-bottom: 0.5rem;
}

.segment-section {
    margin: 0 0 1.5rem 0;
}
.segment-bar-container {
    margin: 0.5rem 0 0 0;

    .bg {
        position: relative;
        width: 100%;
        height: 4px;
        background: var(--surface);
        overflow: hidden;

        .range {
            position: absolute;
            top: 0;
            height: 100%;
            background: var(--text);
        }
    }

    .labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.95em;
    }

    span {
        margin: 0.5rem 0;
    }
}

.segment-inputs-row {
    display: flex;
    gap: 0.5rem;
     > input {
        flex: 1;
    }
}
</style>