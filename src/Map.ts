enum MapNoteType {
    Primary,
    Background
};

type MapNote = {
    startTime: number;
    endTime: number;
    startLane: number;
    endLane: number;
    type: MapNoteType;
};

export class Map {
    /** All of the notes in this map. Sorted by start time. */
    private notes: MapNote[] = [];
    /** The total width of this map in lanes */
    private widthLanes: number = 0;

    
}