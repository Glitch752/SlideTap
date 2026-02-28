<script lang="ts">
    import type { EditorFile } from "./EditorFile";

    const {
        file
    }: {
        file: EditorFile
    } = $props();

    function autodetectTempo() {

    }
</script>

<div class="settings">
    <h2>File Settings</h2>
    
    <label for="name">Name</label>
    <input id="name" bind:value={file.meta.name} onchange={file.changed} placeholder="Name" type="text" />

    <label for="artist">Artist</label>
    <input id="artist" bind:value={file.meta.artist} onchange={file.changed} placeholder="Artist" type="text" />

    <label for="coverImage">Cover Image</label>
    <input id="coverImage" type="file" accept="image/*" onchange={(e) => {
        const el = e.target as HTMLInputElement;
        if(!el.files?.[0]) return;

        file.coverImageFile = el.files[0];
        file.coverImageUrl = URL.createObjectURL(el.files[0]);
        file.changed();
    }} />
    {#if file.coverImageUrl}
        <img class="cover" src={file.coverImageUrl} alt="Cover" />
    {:else}
        <div class="cover placeholder">No Cover</div>
    {/if}

    <hr />

    <label for="track">Track</label>
    <input id="track" type="file" accept="audio/*" onchange={(e) => {
        const el = e.target as HTMLInputElement;
        if(!el.files?.[0]) return;

        file.audioFile = el.files[0];
        file.audioUrl = URL.createObjectURL(el.files[0]);
        file.changed();
    }} />
    {#if file.audioUrl}
        <audio controls>
            <source src={file.audioUrl} type={file.audioFile?.type} />
        </audio>
    {:else}
        <div class="placeholder-audio">No Audio</div>
    {/if}

    <div class="track-info">
        <div>
            <label for="bpm">BPM</label>
            <input id="bpm" bind:value={file.meta.bpm} onchange={file.changed} type="number" />
        </div>
        <div>
            <label for="offset">Offset (beats)</label>
            <input id="offset" bind:value={file.meta.offset} onchange={file.changed} type="number" />
        </div>
        <button onclick={autodetectTempo}>Autodetect</button>
    </div>
</div>

<style lang="scss">
.settings {
    padding: 1rem 0.5rem;
}

h2 {
    margin: 0;
    font-size: 1.25em;
}
label {
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
input[type="file"] {
    font-size: 0.9em;
}

button, input[type="file"]::file-selector-button {
    background-color: var(--panel);
    border: 2px solid var(--surface);
    color: var(--text);
    font-size: 1em;
    padding: 2px 4px;
    margin-right: 1rem;

    &:hover {
        background-color: var(--surface);
    }
}

.cover {
    background-color: var(--background);
    aspect-ratio: 1 / 1;
    width: 200px;
    margin: 0 auto;
    border: 2px solid var(--panel);

    display: grid;
    place-items: center;
}

hr {
    border: none;
    background-color: var(--surface);
    height: 2px;
}
</style>