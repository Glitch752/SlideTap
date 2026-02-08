import { GameMap } from "./Map";
import { SongLeaderboard } from "./SongLeaderboard";

type SongMap = {
    dataPath: string;
    name: string;
    difficulty: number;
    notes: number
};

/**
 * The metadata about a song, not including specific map data.
 */
export class Song {
    public name: string = "Unknown track";
    public artist: string = "Unknown";
    public trackPath: string = "";
    public coverPath: string = "";
    public bpm: number = 0;
    public length: number = 0; // seconds
    public maps: SongMap[] = [];

    public leaderboard: SongLeaderboard;

    public cover: HTMLImageElement = null as unknown as HTMLImageElement;

    private constructor(public id: string) {
        this.leaderboard = new SongLeaderboard(this.id);
    }

    public static async load(id: string): Promise<Song> {
        const song = new Song(id);
        await song.loadMetadata();
        await song.loadCover();

        return song;
    }

    public getRelativeFile(path: string) {
        return `songs/${this.id}/${path}`;
    }

    private async loadMetadata() {
        const file = await fetch(this.getRelativeFile("metadata.json"));
        const data = await file.json();

        this.name = data["name"];
        this.artist = data["artist"];
        this.trackPath = data["track"];
        this.coverPath = data["cover"];
        this.bpm = data["bpm"];
        this.length = data["length"];
        this.maps = data["maps"];
    }

    private async loadCover() {
        // this.cover = await createImageBitmap(await file.blob());
        this.cover = new Image();
        this.cover.src = this.getRelativeFile(this.coverPath);
        await new Promise(resolve => this.cover.onload = resolve);
    }

    public async getMap(index: number): Promise<GameMap> {
        const mapMeta = this.maps[index];
        const filePath = this.getRelativeFile(mapMeta.dataPath);
        const file = await fetch(filePath);
        const text = await file.text();
        if(text.startsWith("<")) {
            // Failed to load
            throw new Error(`Failed to load map data for ${this.name} (${this.id}), map index ${index}. Tried to fetch ${filePath}, but got HTML instead of JSON.`);
        }
        
        const data = JSON.parse(text);
        return new GameMap(data);
    }
}