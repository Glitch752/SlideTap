import type { MapNote } from "../../Map";
import { get, writable, type Writable } from "svelte/store";
import type { SaveHandler } from "./saveHandlers/SaveHandler";
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

        this.audioFileData.set({ blob: file, context: audioContext, buffer, url: URL.createObjectURL(file) });
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

    public hasChanges: boolean = false;
    public changed() {
        this.hasChanges = true;
    }

    public static load(handler: SaveHandler) {
        return handler.load();
    }
    public loadMeta(metadata: SongMetadataJSON) {
        this.meta.set(metadata);

        this._maps.clear();
        for(const map of metadata.maps) {
            const mapId = this.generateMapId();
            this._maps.set(mapId, new EditorMapData(map.name, map.difficulty));
        }
        if(this.maps) {
            this.maps.set(this._maps);
        }
    }

    public async save() {
        await this.saveHandler.save(this);
    }

    // Create a blank editor file with no data.
    public constructor(public saveHandler: SaveHandler) {
    }
}