import { type Scene } from "./Scene";
import SongList from "./songList/SongList.svelte";

export class SongListScene implements Scene {
    public component = SongList;
}