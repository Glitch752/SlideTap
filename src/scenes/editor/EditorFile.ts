import type { MapDataJSON, MapNote } from "../../Map";
import { get, writable, type Writable } from "svelte/store";
import type { SaveArchive } from "./saveHandlers/SaveArchive";
import type { SongMetadataJSON } from "../../Song";

export type EditorMapID = string & { __brand: "EditorMapID" };
export type EditorNoteID = string & { __brand: "EditorNoteID" };

export class EditorMapData {
    public name: string;
    public difficulty: number;

    public _notes: Map<EditorNoteID, MapNote> = new Map();
    public notes: Writable<Map<EditorNoteID, MapNote>> = writable(this._notes);

    constructor(name: string, difficulty: number) {
        this.name = name;
        this.difficulty = difficulty;
    }

    public serialize(): MapDataJSON {
        return {
            notes: Array.from(this._notes.values())
        };
    }

    public deserialize(data: MapDataJSON, editor: EditorFile) {
        this._notes.clear();
        console.log(data);
        for(const note of data.notes) {
            this._notes.set(editor.generateNoteId(), note);
        }
        this.notes.set(this._notes);
    }
}
export type EditorFileMetadata = Omit<SongMetadataJSON, "track" | "cover" | "maps">;

/**
 * The full data in a song opened in the editor. Can be exported to a zip file.
 */
export class EditorFile {
    public meta: Writable<EditorFileMetadata> = writable({
        name: "Untitled",
        artist: "",
        bpm: 0,
        firstBeatOffset: 0,
        start: 0,
        length: 0
    });
    public getMeta(): EditorFileMetadata {
        return get(this.meta);
    }

    public coverImageFile: Blob | null = null;
    public coverImageUrl: Writable<string | null> = writable(null);
    public audioFileData: Writable<{
        blob: Blob,
        context: AudioContext,
        bufferSource: AudioBufferSourceNode,
        buffer: AudioBuffer,
        url: string
    } | null> = writable(null);

    public setCoverImage(file: Blob | null) {
        this.coverImageFile = file;
        const currentUrl = get(this.coverImageUrl);
        if(currentUrl) URL.revokeObjectURL(currentUrl);
        this.coverImageUrl.set(file ? URL.createObjectURL(file) : null);
    }
    public async setAudioFile(file: Blob | null) {
        const currentUrl = get(this.audioFileData)?.url;
        if(currentUrl) URL.revokeObjectURL(currentUrl);

        if(!file) {
            this.audioFileData.set(null);
            return;
        }

        const audioContext = new AudioContext();
        const buffer = await audioContext.decodeAudioData(await file.arrayBuffer());

        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);

        this.audioFileData.set({
            blob: file,
            context: audioContext,
            buffer,
            bufferSource: source,
            url: URL.createObjectURL(file)
        });
    }
    public async close(file: EditorFile): Promise<void> {
        const audioUrl = get(file.audioFileData)?.url;
        if(audioUrl) URL.revokeObjectURL(audioUrl);
        const coverUrl = get(file.coverImageUrl);
        if(coverUrl) URL.revokeObjectURL(coverUrl);
    }

    private generateMapId(): EditorMapID {
        return (Math.random().toString(36).substring(2, 5) as unknown) as EditorMapID;
    }
    public generateNoteId(): EditorNoteID {
        return (Math.random().toString(36).substring(2, 5) as unknown) as EditorNoteID;
    }

    private _maps: Map<EditorMapID, EditorMapData> = new Map()
        .set(this.generateMapId(), {
            name: "Default",
            difficulty: 1,
            notes: new Map()
        });
    public readonly maps: Writable<Map<EditorMapID, EditorMapData>> = writable(this._maps);

    public addMap(): EditorMapID {
        const mapId = this.generateMapId();
        this._maps.set(
            mapId,
            new EditorMapData(`Map ${this._maps.size + 1}`, 1)
        );
        this.maps.set(this._maps);
        this.changed();

        return mapId;
    }
    public deleteMap(id: EditorMapID) {
        this._maps.delete(id);
        this.maps.set(this._maps);
        this.changed();
    }

    public getMaps(): EditorMapData[] {
        return Array.from(this._maps.values());
    }
    public getMap(id: EditorMapID) {
        return this._maps.get(id);
    }

    public unsavedChanges: Writable<boolean> = writable(false);
    public changed() {
        this.unsavedChanges.set(true);
    }

    public loadMeta(metadata: SongMetadataJSON) {
        this.meta.set(metadata);
    }


    public static async load(ar: SaveArchive) {
        await ar.open();

        const metaFile = await ar.readFile("metadata.json");
        if(!metaFile) throw new Error("metadata.json not found in zip");
        const decoder = new TextDecoder();
        const metaStr = decoder.decode(await metaFile.arrayBuffer());
        const metadata: SongMetadataJSON = JSON.parse(metaStr);

        const getBlob = async (path?: string) => {
            if(!path) return undefined;
            return await ar.readFile(path);
        };

        const cover = await getBlob(metadata.cover);
        const track = await getBlob(metadata.track);

        let editorFile = new EditorFile(ar);
        editorFile.loadMeta(metadata);
        await editorFile.setAudioFile(track ?? null);
        editorFile.setCoverImage(cover ?? null);

        // Load maps

        editorFile._maps.clear();
        for(const map of metadata.maps) {
            const mapId = editorFile.generateMapId();
            const editorData = new EditorMapData(map.name, map.difficulty);
            editorFile._maps.set(mapId, editorData);

            const dataFile = await ar.readFile(map.dataPath);
            if(!dataFile) throw new Error(`Map data not found: ${map.dataPath}`);

            const decoder = new TextDecoder();
            const dataStr = decoder.decode(await dataFile.arrayBuffer());
            const data: MapDataJSON = JSON.parse(dataStr);

            try {
                editorData.deserialize(data, editorFile);
            } catch(e) {
                console.error(`Failed to deserialize map ${map.name}`);
            }
        }
        if(editorFile.maps) {
            editorFile.maps.set(editorFile._maps);
        }

        return editorFile;
    }

    public async save(): Promise<void> {
        const ar = this.saveArchive;

        let metadata: SongMetadataJSON = {
            ...this.getMeta(),
            maps: [],
            cover: "",
            track: ""
        };

        // add audio and cover blobs if present on the editor file
        const audioFileData = get(this.audioFileData);
        if(audioFileData) {
            const mimeExt = audioFileData.blob.type.split('/')[1];
            await ar.writeFile(`track.${mimeExt}`, audioFileData.blob);
            metadata.track = `track.${mimeExt}`;
        }
        if(this.coverImageFile) {
            const mimeExt = this.coverImageFile.type.split('/')[1];
            await ar.writeFile(`cover.${mimeExt}`, this.coverImageFile);
            metadata.cover = `cover.${mimeExt}`;
        }

        // collect maps from editor file (try several common property names)
        const mapsFromFile = this.getMaps();
        for(let i = 0; i < mapsFromFile.length; i++) {
            const map = mapsFromFile[i];
            const dataPath = `maps/map${i+1}.json`;
            metadata.maps[i] = {
                difficulty: map.difficulty,
                name: map.name,
                notes: map._notes.size,
                dataPath
            };
            try {
                await ar.writeFile(dataPath, JSON.stringify(map.serialize()));
            } catch {
                console.error(`Failed to serialize map ${i+1}`);
            }
        }

        // write metadata
        await ar.writeFile("metadata.json", JSON.stringify(metadata));
    
        await ar.persist(this.getMeta().name);

        this.unsavedChanges.set(false);
    }

    // Create a blank editor file with no data.
    public constructor(public saveArchive: SaveArchive) {
    }
}