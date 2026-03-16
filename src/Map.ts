export enum MapNoteLayer {
    Primary = 0,
    Background = 1
};

export enum MapNoteType {
    Tap = 0,
    Hold = 1,
    Damage = 2
};

export type LaneRange = {
    start: number;
    width: number;
};

/**
 * All times are in beats, not seconds.
 */
export type MapNote = {
    /** Beats; based off of the beginning of the track, not the played segment */
    startTime: number;
    /** Beats; based off of the beginning of the track, not the played segment */
    endTime: number;
    start: LaneRange;
    end: LaneRange;
    
    layer: MapNoteLayer;
    type: MapNoteType;
};

export type LoadedMapDataJSON = {
    notes: MapNote[];
};

export class GameMap {
    /** All of the notes in this map. Sorted by start time. */
    private notes: MapNote[] = [];

    constructor(mapData: LoadedMapDataJSON) {
        this.notes = mapData.notes;
    }
}