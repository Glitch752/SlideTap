import { Song } from "../Song";
import { type Scene } from "./Scene";

export const songs = await Promise.all([
    Song.load("kontonBoogie"),
    Song.load("badApple")
]);

/** Simple template function for syntax highlighting and light templating */
function html(strings: TemplateStringsArray, ...values: any[]): string {
    return String.raw({ raw: strings }, ...values.map(val => {
        if(Array.isArray(val)) return val.join("");
        return val;
    }));
}

function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export class SongListScene implements Scene {
    private selectedSongIndex: number = 0;

    public show(): void {
        this.renderLists();
    }

    public hide(): void {
        
    }

    public draw(deltaTime: number): void {
        
    }

    public onKeyDown(event: KeyboardEvent): void {
        
    }

    public renderLists() {
        const songListElement = document.getElementById("songListSongs")!;
        songListElement.innerHTML = "";

        const songInfosElement = document.getElementById("songListInfos")!;
        songInfosElement.innerHTML = "";

        for(const song of songs) {
            songListElement.innerHTML += html`
                <div class="song">
                    <!-- temporary -->
                    <img src="${song.getRelativeFile(song.coverPath)}" />
                    <span class="title">${song.name}</span>
                    <span class="artist">${song.artist}</span>
                    <div class="maps">
                        ${ /* lol */ song.maps.map(map => html`
                            <span style="--color: #9999ff">${map.difficulty}</span>
                        `)}
                    </div>
                </div>
            `;
            songInfosElement.innerHTML += html`
                <div class="item" data-song="kontonBoogie">
                    <span class="title">${song.name}</span>
                    <span class="artist">${song.artist}</span>
                    <div class="info">
                        <span>${song.bpm} bpm</span>
                        <span>${formatDuration(song.length)} long</span>
                    </div>
                    <div class="maps">
                        ${ /* heh */ song.maps.map(map => html`
                            <div class="map" style="--color: #9999ff">
                                <span class="difficulty">${map.difficulty}</span>
                                <span class="name">${map.name}</span>
                                <span>${map.notes} notes</span>
                            </div>
                        `)}
                    </div>
                    <button>Play</button>
                </div>
            `;
        }
    }

    public updateSelection() {

    }
}