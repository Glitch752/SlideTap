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
    private selectedMapIndex: number = 0;

    public show(): void {
        this.renderLists();
    }

    public hide(): void {
        
    }

    public draw(deltaTime: number): void {
        
    }

    public onKeyDown(event: KeyboardEvent): void {
        
    }

    private difficultyColor(difficulty: number): string {
        return `hsl(${240 - difficulty / 100 * 240}, 100.00%, 80.00%)`;
    }

    public renderLists() {
        const songListElement = document.getElementById("songListSongs")!;
        songListElement.innerHTML = "";

        const songInfosElement = document.getElementById("songListInfos")!;
        songInfosElement.innerHTML = "";

        for(const [i, song] of songs.entries()) {
            songListElement.innerHTML += html`
                <div class="song ${i === this.selectedSongIndex ? "selected" : ""}" style="--idx: ${i}">
                    <img src="${song.getRelativeFile(song.coverPath)}" />
                    <span class="title">${song.name}</span>
                    <span class="artist">${song.artist}</span>
                    <div class="maps">
                        ${ /* lol */ song.maps.map(map => html`
                            <span style="--color: ${this.difficultyColor(map.difficulty)}">${map.difficulty}</span>
                        `)}
                    </div>
                </div>
            `;

            const selectedMap = song.maps[this.selectedMapIndex];
            const selectedDifficultyColor = this.difficultyColor(selectedMap.difficulty);
            songInfosElement.innerHTML += html`
                <div class="item ${i === this.selectedSongIndex ? "selected" : ""}" data-song="kontonBoogie" style="--idx: ${i}">
                    <span class="title">${song.name}</span>
                    <span class="artist">${song.artist}</span>
                    <img src="${song.getRelativeFile(song.coverPath)}" />
                    <div class="data">
                        <span>${song.bpm} bpm</span>
                        <span>${formatDuration(song.length)} long</span>
                    </div>
                    <div class="maps">
                        ${ /* heh */ song.maps.map(map => html`
                            <button class="map" style="--color: ${this.difficultyColor(map.difficulty)}">
                                <span class="difficulty">${map.difficulty}</span>
                                <span class="name">${map.name}</span>
                                <span class="notes">${map.notes} notes</span>
                            </button>
                        `)}
                    </div>
                    <div class="buttons">
                        <button class="play" style="--selected-color: ${selectedDifficultyColor}">
                            Play
                            <span class="map-name" style="color: ${selectedDifficultyColor}">${selectedMap.name}</span>
                        </button>
                        <button class="preview">Preview</button>
                    </div>
                    <div class="leaderboard">
                        <h2>Leaderboard</h2>
                        <div class="entry">
                            <span>1</span>
                            <span>10,500</span>
                            <span>Dec 10. 2026</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    public updateSelection() {

    }
}