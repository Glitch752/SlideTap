enum MapNoteType {
    Primary = 0,
    Background = 1
};

type MapNote = {
    startTime: number;
    endTime: number;
    startLane: number;
    endLane: number;
    type: MapNoteType;
};

export class GameMap {
    /** All of the notes in this map. Sorted by start time. */
    private notes: MapNote[] = [];

    constructor(mapData: any) {
        this.notes = mapData["notes"];
    }
}