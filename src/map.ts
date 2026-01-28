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
    private notes: MapNote[];
    private widthLanes: number;
}