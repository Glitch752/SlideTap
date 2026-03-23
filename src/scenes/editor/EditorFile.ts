import type { LoadedMapDataJSON, MapNote } from "../../Map";
import { get, writable, type Writable } from "svelte/store";
import type { OpenableSaveArchive, SaveArchive } from "./saveHandlers/SaveArchive";
import type { SongMapJSON, SongMetadataJSON } from "../../Song";
import { tween } from "../../lib/timing";
import { Signal } from "../../lib/miniNodeTree";
import { Settings } from "../../Settings";

export type EditorMapID = string & { __brand: "EditorMapID" };
export type EditorNoteID = string & { __brand: "EditorNoteID" };

export class EditorMapData {
    get name() { return this.data.name; }
    get difficulty() { return this.data.difficulty; }
    get dataPath() { return this.data.dataPath; }

    set name(value: string) { this.data.name = value; }
    set difficulty(value: number) { this.data.difficulty = value; }

    public _notes: Map<EditorNoteID, MapNote> = new Map();
    public notes: Writable<Map<EditorNoteID, MapNote>> = writable(this._notes);

    public loaded = false;

    constructor(private data: SongMapJSON, public id: EditorMapID) {
    }

    public serialize(): LoadedMapDataJSON {
        if(!this.loaded) {
            throw new Error("Cannot serialize map that hasn't been loaded");
        }

        return {
            notes: Array.from(this._notes.values())
        };
    }

    public deserialize(data: LoadedMapDataJSON, editor: EditorFile) {
        this._notes.clear();
        for(const note of data.notes) {
            this._notes.set(editor.generateNoteId(), note);
        }
        this.notes.set(this._notes);

        this.loaded = true;
    }
}
export type EditorFileMetadata = Omit<SongMetadataJSON, "track" | "cover" | "maps">;

/**
 * The full data in a song opened in the editor. Can be exported to a zip file.
 */
export class EditorFile {
    public meta: Writable<EditorFileMetadata> = writable({
        id: Math.random().toString(36).substring(2, 7),
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
        source?: AudioBufferSourceNode,
        globalGain: GainNode,
        fadeGain: GainNode,
        buffer: AudioBuffer,
        url: string
    } | null> = writable(null);

    public beginPlayback(atTime: number) {
        const audioFileData = get(this.audioFileData);
        if(!audioFileData) return;

        let time = atTime +
            this.getMeta().firstBeatOffset * (60 / this.getMeta().bpm) -
            Settings.audioLatency.value / 1000.;
        let offset = 0;
        if(time < 0) {
            offset = -time;
            time = 0;
        }

        const { context: audioContext, buffer, fadeGain } = audioFileData;
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(fadeGain);
        source.start(audioContext.currentTime + offset, time);

        tween(fadeGain.gain.value, 1, 0.1, 16, value => {
            fadeGain.gain.value = value;
        });

        this.audioFileData.update(data => {
            if(!data) return data;
            return {
                ...data,
                source
            };
        });
    }
    public stopPlayback() {
        const audioFileData = get(this.audioFileData);
        if(!audioFileData) return;
        
        audioFileData.source?.stop(audioFileData.context.currentTime + 0.1);
        tween(audioFileData.fadeGain.gain.value, 0, 0.1, 16, value => {
            audioFileData.fadeGain.gain.value = value;
        });

        this.audioFileData.update(data => {
            if(!data) return data;
            return {
                ...data,
                source: undefined
            };
        });
    }

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

        const sourceGain = audioContext.createGain();
        sourceGain.gain.value = 0.5;
        sourceGain.connect(audioContext.destination);

        const fadeGain = audioContext.createGain();
        fadeGain.gain.value = 1;
        fadeGain.connect(sourceGain);

        this.audioFileData.set({
            blob: file,
            context: audioContext,
            buffer,
            globalGain: sourceGain,
            fadeGain,
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
        return (Math.random().toString(36).substring(2, 7) as unknown) as EditorMapID;
    }
    public generateNoteId(): EditorNoteID {
        return (Math.random().toString(36).substring(2, 7) as unknown) as EditorNoteID;
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
            new EditorMapData({
                name: `Map ${this._maps.size + 1}`,
                difficulty: 1,
                notes: 0,
                dataPath: `maps/map${this._maps.size + 1}.json`
            }, mapId)
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
    public changed: Signal<[]>;

    public loadMeta(metadata: SongMetadataJSON) {
        this.meta.set(metadata);
    }

    public static async load(ar: SaveArchive, loadMaps: boolean = true): Promise<EditorFile> {
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

        if(!cover) console.warn(`Cover image not found for track ${metadata.name}, continuing without it`);
        if(!track) console.warn(`Audio track not found for track ${metadata.name}, continuing without it`);

        let editorFile = new EditorFile(ar);
        editorFile.loadMeta(metadata);
        await editorFile.setAudioFile(track ?? null);
        editorFile.setCoverImage(cover ?? null);

        // Load maps

        editorFile._maps.clear();
        for(const map of metadata.maps) {
            const mapId = editorFile.generateMapId();
            const editorData = new EditorMapData(map, mapId);
            editorFile._maps.set(mapId, editorData);

            if(loadMaps) {
                editorFile.loadMap(editorData);
            }
        }
        if(editorFile.maps) {
            editorFile.maps.set(editorFile._maps);
        }

        return editorFile;
    }

    public async loadMap(editorData: EditorMapData) {
        const dataFile = await this.saveArchive.readFile(editorData.dataPath);
        if(!dataFile) {
            console.error(`Data file for map ${editorData.name} not found; resetting to empty map`);
            editorData.deserialize({ notes: [] }, this);
            return;
        }

        const decoder = new TextDecoder();
        const dataStr = decoder.decode(await dataFile.arrayBuffer());
        const data: LoadedMapDataJSON = JSON.parse(dataStr);

        try {
            editorData.deserialize(data, this);
        } catch(e) {
            console.error(`Failed to deserialize map ${editorData.name}`);
        }
    }

    public async saveAs(ar: OpenableSaveArchive): Promise<void> {
        this.saveArchive = new ar();
        await this.save();
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
        this.changed = new Signal();
        this.changed.connect(() => {
            this.unsavedChanges.set(true);
        });
    }
}