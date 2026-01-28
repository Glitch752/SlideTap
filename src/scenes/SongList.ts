import { Song } from "../Song";
import { type Scene } from "./Scene";

export const songs = await Promise.all([
    Song.load("kontonBoogie"),
    Song.load("badApple"),
    Song.load("kontonBoogie"),
    Song.load("badApple"),
    Song.load("kontonBoogie"),
    Song.load("badApple"),
    Song.load("kontonBoogie"),
    Song.load("badApple"),
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

    public onKeyDown(event: KeyboardEvent): void {
        
    }

    private deltaAccumulator: number = 0;
    private requiredDelta: number = 0;
    private lastScrollTime: number = 0;

    public onScroll(event: WheelEvent): void {
        // This logic works well on my laptop, but I'm not sure if it does
        // anywhere else sob

        if(Date.now() - this.lastScrollTime < 50) return;
        if(Date.now() - this.lastScrollTime > 500) this.requiredDelta = 200;

        this.deltaAccumulator += event.deltaY;
        if(Math.abs(this.deltaAccumulator) < this.requiredDelta) return;

        if(this.requiredDelta < 1500) this.requiredDelta += 500;
        
        this.selectedSongIndex = (
            this.selectedSongIndex + songs.length + Math.sign(event.deltaY)
        ) % songs.length;
        this.updateListSelected();

        this.deltaAccumulator = 0;
        this.lastScrollTime = Date.now();
    }

    private difficultyColor(difficulty: number): string {
        return `hsl(${240 - difficulty / 100 * 240}, 100.00%, 80.00%)`;
    }

    public renderLists() {
        const songListElement = document.getElementById("songListSongs")!;
        songListElement.innerHTML = "";

        const songInfosElement = document.getElementById("songListInfos")!;
        songInfosElement.innerHTML = "";

        const numberFormat = Intl.NumberFormat(undefined, {
            style: "decimal"
        });
        const dateFormat = Intl.DateTimeFormat(undefined, {
            dateStyle: "medium"
        });

        for(const [i, song] of songs.entries()) {
            songListElement.innerHTML += html`
                <div class="song" data-song="${song.id}" data-song-infos-idx="${i}">
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
                <div class="item" data-song="${song.id}" data-song-infos-idx="${i}">
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
                        ${
                            song.leaderboard.hasEntries() ? song.leaderboard.entries.map((entry, i) => html`
                                <div class="entry">
                                    <span>${i + 1}</span>
                                    <span>${entry.name}</span>
                                    <span>${numberFormat.format(entry.score)}</span>
                                    <span>${dateFormat.format(entry.time)}</span>
                                </div>
                            `) : html`
                                <p>This song has no leaderboard entries yet. Be the first to add one!</p>
                                <p class="note">Note: leaderboard is currently only local.</p>
                            `
                        }
                    </div>
                </div>
            `;
        }

        this.updateListSelected();
    }

    private updateListSelected() {
        document.querySelectorAll("[data-song-infos-idx].selected").forEach(s =>
            s.classList.remove("selected")
        );
        document.querySelectorAll(`[data-song-infos-idx="${this.selectedSongIndex}"]`).forEach(s =>
            s.classList.add("selected")
        );

        const songListElement = document.getElementById("songListSongs")!;
        const songInfosElement = document.getElementById("songListInfos")!;
        
        let songListFocusHeight = songListElement.querySelector<HTMLElement>(".selected")?.offsetTop ?? 0;
        
        const selectedSongInfo = songInfosElement.querySelector<HTMLElement>(".selected");
        let songInfoFocusHeight = selectedSongInfo?.offsetTop ?? 0;

        // Not perfect, but whatever; I think it looks good
        const screenOffset = window.innerHeight / 2 - (selectedSongInfo?.clientHeight ?? 0) / 2;
        songListFocusHeight -= screenOffset;
        songInfoFocusHeight -= screenOffset;

        songListElement.style.setProperty("--focus-height", `${songListFocusHeight}px`);
        songInfosElement.style.setProperty("--focus-height", `${songInfoFocusHeight}px`);
    }
}