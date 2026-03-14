import { get } from "svelte/store";
import { GameMap } from "./Map";
import { EditorFile, EditorMapData } from "./scenes/editor/EditorFile";
import type { SaveArchive } from "./scenes/editor/saveHandlers/SaveArchive";
import { SongLeaderboard } from "./SongLeaderboard";
import { timeout } from "./utils/timing";

export type SongMetadataJSON = {
    id: string;

    name: string;
    artist: string;
    
    track: string;
    cover: string;
    
    bpm: number;
    /** Offset of the first beat, in beats */
    firstBeatOffset: number;

    /** Start time of the song from the audio file, in seconds */
    start: number;
    /** Length of the song, in seconds */
    length: number;

    maps: SongMapJSON[];
}

export type SongMapJSON = {
    dataPath: string;
    name: string;
    difficulty: number;
    notes: number;
};

/**
 * A read-only song, used for playing in the game. The data is loaded from an EditorFile.
 * The metadata about a song, not including specific map data.  
 * It's kind of gross that this is separate from EditorFile but depends on it, but... oh well. This all works.
 */
export class Song {
    public get name() {
        return this.file.getMeta().name;
    }
    public get artist() {
        return this.file.getMeta().artist;
    }
    public get bpm() {
        return this.file.getMeta().bpm;
    }
    public get length() {
        return this.file.getMeta().length;
    }

    public leaderboard: SongLeaderboard;

    public cover: HTMLImageElement | null = null;
    public track: HTMLAudioElement | null = null;

    public maps: EditorMapData[] = [];

    private constructor(public id: string, private file: EditorFile) {
        this.leaderboard = new SongLeaderboard(this.id);
        this.maps = file.getMaps();
    }

    public static async load(ar: SaveArchive): Promise<Song> {
        const file = await EditorFile.load(ar, false);
        return this.loadFromFile(file);
    }

    public static async loadFromFile(file: EditorFile): Promise<Song> {
        const meta = file.getMeta();
        const song = new Song(meta.id, file);

        const coverData = await file.coverImageFile?.arrayBuffer();
        if(coverData) {
            const blob = new Blob([coverData]);
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.src = url;
            song.cover = img;
        }

        const audioData = await get(file.audioFileData);
        if(audioData) {
            const blob = audioData.blob;
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            song.track = audio;
        }

        return song;
    }

    public async getMap(index: number): Promise<GameMap> {
        const map = this.maps[index];
        if(!map.loaded) {
            await this.file.loadMap(map);
        }
        return new GameMap(map.serialize());
    }
}