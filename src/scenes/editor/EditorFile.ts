import type { MapNote } from "../../Map";
import { writable, type Writable } from "svelte/store";
import type { SaveHandler } from "./saveHandlers/SaveHandler";
import type { SongMetadataJSON } from "../../Song";

export type EditorMapID = string & { __brand: "EditorMapID" };
export type EditorNoteID = string & { __brand: "EditorNoteID" };

type EditorMapData = {
    name: string;
    difficulty: number;

    notes: Map<EditorNoteID, MapNote>;
};

export type EditorFileMetadata = Omit<SongMetadataJSON, "track" | "cover" | "maps">;

/**
 * The full data in a song opened in the editor. Can be exported to a zip file.
 */
export class EditorFile {
    public meta: EditorFileMetadata = {
        name: "Untitled",
        artist: "",
        bpm: 0,
        firstBeatOffset: 0,
        offset: 0,
        length: 0
    };

    public coverImageFile: Blob | null = null;
    public audioFile: Blob | null = null;

    private generateMapId(): EditorMapID {
        return (Math.random().toString(36).substring(2, 5) as unknown) as EditorMapID;
    }
    private generateNoteId(): EditorNoteID {
        return (Math.random().toString(36).substring(2, 5) as unknown) as EditorNoteID;
    }

    private _maps: Map<EditorMapID, EditorMapData> = new Map()
        .set(this.generateMapId(), {
            name: "Default",
            difficulty: 1,
            notes: new Map()
        });
    public readonly maps: Writable<Map<EditorMapID, EditorMapData>> | null = writable(this._maps);

    public getMaps(): EditorMapData[] {
        return Array.from(this._maps.values());
    }

    public hasChanges: boolean = false;

    public static load(handler: SaveHandler) {
        return handler.load();
    }
    public loadMeta(metadata: SongMetadataJSON) {
        this.meta = metadata;

        for(const map of metadata.maps) {
            const mapId = this.generateMapId();
            this._maps.set(mapId, {
                name: map.name,
                difficulty: map.difficulty,
                notes: new Map()
            });
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