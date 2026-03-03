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
    const audioUrl = $derived(file.audioUrl);

    let bpm = $derived(file.meta.bpm);
    let offset = $derived(file.meta.firstBeatOffset);

    $effect(() => {
        file.meta.bpm = bpm;
        file.meta.firstBeatOffset = offset;
        file.changed();
    });

    async function autodetectTempo() {
        if(!file.audioFile) {
            alert("Please upload an audio file first.");
            return;
        }

        const audioCtx = new AudioContext();
        const buffer: AudioBuffer = await audioCtx.decodeAudioData(await file.audioFile.arrayBuffer());
        const { bpm: guessedBpm, offset: guessedOffset } = await guess(buffer);
        
        bpm = guessedBpm;
        offset = guessedOffset;
    }
</script>

<div class="settings">
    <h2>File Settings</h2>
    
    <label for="name">Name</label>
    <input id="name" value={file.meta.name} onchange={(e) => {
        file.meta.name = (e.target as HTMLInputElement).value;
        file.changed();
    }} placeholder="Name" type="text" />

    <label for="artist">Artist</label>
    <input id="artist" value={file.meta.artist} onchange={(e) => {
        file.meta.artist = (e.target as HTMLInputElement).value;
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
    {#if $audioUrl}
        <audio controls>
            <source src={$audioUrl} type={file.audioFile?.type} />
        </audio>
    {:else}
        <div class="placeholder-audio">No Audio</div>
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
</style>