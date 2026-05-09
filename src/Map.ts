export enum MapNoteLayer {
    Primary = 0,
    Background = 1
};

export enum MapNoteType {
    Tap = 0,
    Hold = 1,
    Damage = 2
};

export function getNoteColor(type: MapNoteType, layer: MapNoteLayer) {
    if(layer === MapNoteLayer.Background) {
        return ({
            [MapNoteType.Hold]: "#4444ff",
            [MapNoteType.Damage]: "#ff4444",
            [MapNoteType.Tap]: "#44ffff"
        })[type];
    }
    return ({
        [MapNoteType.Hold]: "#8888ff",
        [MapNoteType.Damage]: "#ff8888",
        [MapNoteType.Tap]: "#88ffff"
    })[type];
}

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

export type MapEvent = {
    /** Beats */
    duration: number,
    /** Beats; based off of the beginning of the track, not the played segment */
    time: number
} & ({
    type: "flash",
    color: string
} | {
    type: "text",
    text: string
});

export type LoadedMapDataJSON = {
    notes: MapNote[];
    events: MapEvent[];
};

export class GameMap {
    /** All of the notes in this map. Sorted by start time. */
    public notes: MapNote[] = [];
    /** All of the events in this map. Sorted by time. */
    public events: MapEvent[] = [];

    constructor(mapData: LoadedMapDataJSON) {
        this.notes = mapData.notes.sort((a, b) => a.startTime - b.startTime);
        this.events = mapData.events.sort((a, b) => a.time - b.time);
    }
}