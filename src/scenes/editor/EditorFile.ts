import type { MapNote } from "../../Map";
import { writable, type Writable } from "svelte/store";

function createWritableAccessor(target: any, propertyKey: string) {
    const privateKey = Symbol(propertyKey);
    const writableKey = propertyKey + "Writable";

    Object.defineProperty(target, propertyKey, {
        get() {
            return this[privateKey];
        },
        set(value: any) {
            this[privateKey] = value;
            if (this[writableKey]) {
                this[writableKey].set(value);
            }
        },
        enumerable: false,
        configurable: true,
    });

    Object.defineProperty(target, writableKey, {
        get() {
            if (!this["__writables__"]) this["__writables__"] = {};
            if (!this["__writables__"][propertyKey]) {
                this["__writables__"][propertyKey] = writable(this[propertyKey]);
            }
            return this["__writables__"][propertyKey];
        },
        enumerable: true,
        configurable: true,
    });
}

export type EditorMapID = string & { __brand: "EditorMapID" };
export type EditorNoteID = string & { __brand: "EditorNoteID" };

type EditorMapData = {
    name: string;
    difficulty: number;

    notes: Map<EditorNoteID, MapNote>;
};

/**
 * The full data in a song opened in the editor. Can be exported to a zip file.
 */
export class EditorFile {
    public name: string = "";
    public artist: string = "Unknown";
    public bpm: number = 120;
    /** Offset of the first beat, in beats */
    public firstBeatOffset: number = 0;

    public coverImageFile: Blob | null = null;
    public audioFile: Blob | null = null;

    private generateMapId(): EditorMapID {
        return (Math.random().toString(36).substring(2, 5) as unknown) as EditorMapID;
    }
    private generateNoteId(): EditorNoteID {
        return (Math.random().toString(36).substring(2, 5) as unknown) as EditorNoteID;
    }

    private _maps: Map<EditorMapID, EditorMapData> = new Map()
        // .set(this.generateMapId(), {
        //     name: "Default",
        //     difficulty: 1,
        //     notes: new Map()
        // });
    public readonly maps: Writable<Map<EditorMapID, EditorMapData>> | null = writable(this._maps);

    public hasChanges: boolean = false;

    public constructor() {
    }
}