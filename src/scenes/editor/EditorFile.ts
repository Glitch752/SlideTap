import type { MapNote } from "../../Map";

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

    public maps: Map<EditorMapID, EditorMapData> = new Map();

    public hasChanges: boolean = false;

    public constructor() {
    }
}