import { get } from "svelte/store";
import type { MapDataJSON } from "../../../Map";
import type { SongMetadataJSON } from "../../../Song";
import { EditorFile } from "../EditorFile";
import type { SaveHandler } from "./SaveHandler";
import JSZip from "jszip";

export class ZipSaveHandler implements SaveHandler {
    private file: EditorFile | null = null;

    async load(): Promise<EditorFile> {
        const file = await new Promise<File | null>(resolve => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".zip";
            input.onchange = () => resolve(input.files ? input.files[0] : null);
            input.click();
        });

        if(!file) throw new Error("No file selected");

        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });

        const zip = await JSZip.loadAsync(arrayBuffer);

        const metaFile = zip.file("metadata.json");
        if(!metaFile) throw new Error("metadata.json not found in zip");
        const metaStr = await metaFile.async("string");
        const metadata: SongMetadataJSON = JSON.parse(metaStr);

        const getBlob = async (path?: string) => {
            if(!path) return undefined;
            const f = zip.file(path);
            if(!f) return undefined;
            return await f.async("blob");
        };

        const cover = await getBlob(metadata.cover);
        const track = await getBlob(metadata.track);

        const maps: MapDataJSON[] = [];
        if(Array.isArray(metadata.maps)) {
            for(const m of metadata.maps) {
                if (!m || !m.dataPath) continue;
                const mf = zip.file(m.dataPath);
                if (!mf) continue;
                const mapStr = await mf.async("string");
                maps.push(JSON.parse(mapStr) as MapDataJSON);
            }
        }

        let editorFile = new EditorFile(this);
        editorFile.loadMeta(metadata);
        editorFile.setAudioFile(track ?? null);
        editorFile.setCoverImage(cover ?? null);
        this.file = editorFile;

        return editorFile;
    }

    async save(): Promise<void> {
        const file = this.file;
        if(!file) throw new Error("No file to save");

        const zip = new JSZip();

        let metadata: SongMetadataJSON = {
            ...file.meta,
            maps: [],
            cover: "",
            track: ""
        };

        // add audio and cover blobs if present on the editor file
        if(file.audioFile) {
            const mimeExt = file.audioFile.type.split('/')[1];
            zip.file(`track.${mimeExt}`, file.audioFile);
            metadata.track = `track.${mimeExt}`;
        }
        if(file.coverImageFile) {
            const mimeExt = file.coverImageFile.type.split('/')[1];
            zip.file(`cover.${mimeExt}`, file.coverImageFile);
            metadata.cover = `cover.${mimeExt}`;
        }

        // collect maps from editor file (try several common property names)
        const mapsFromFile = file.getMaps();
        for(let i = 0; i < mapsFromFile.length; i++) {
            const map = mapsFromFile[i];
            const dataPath = `maps/map${i+1}.json`;
            metadata.maps[i] = {
                difficulty: map.difficulty,
                name: map.name,
                notes: map.notes.size,
                dataPath
            };
            try {
                zip.file(dataPath, JSON.stringify(map, null, 2));
            } catch {
                console.error(`Failed to serialize map ${i+1}`);
            }
        }

        // write metadata
        zip.file("metadata.json", JSON.stringify(metadata, null, 2));

        const blob = await zip.generateAsync({ type: "blob" });

        // trigger download
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${metadata.name ?? "song"}.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    async close(): Promise<void> {
        if(!this.file) return;

        const audioUrl = get(this.file.audioUrl);
        if(audioUrl) URL.revokeObjectURL(audioUrl);
        const coverUrl = get(this.file.coverImageUrl);
        if(coverUrl) URL.revokeObjectURL(coverUrl);
    }
}