export enum PlaybackType {
    External,
    PlaybackControls,
    Paused
}

export type PlaybackState = {
    playing: PlaybackType;
    /** Time in seconds */
    time: number;
};

export function syncPlaybackToElement(playbackState: PlaybackState, audioElement: HTMLAudioElement) {
    audioElement.addEventListener("play", () => {
        playbackState.playing = PlaybackType.External;
    });
    audioElement.addEventListener("pause", () => {
        playbackState.playing = PlaybackType.Paused;
    });
    audioElement.addEventListener("timeupdate", () => {
        playbackState.time = audioElement.currentTime;
    });
}
export function unsyncPlayback(playbackState: PlaybackState, audioElement: HTMLAudioElement) {
    audioElement.removeEventListener("play", () => {
        playbackState.playing = PlaybackType.External;
        playbackState.time = audioElement.currentTime;
    });
    audioElement.removeEventListener("pause", () => {
        playbackState.playing = PlaybackType.Paused;
    });
    audioElement.removeEventListener("timeupdate", () => {
        playbackState.time = audioElement.currentTime;
    });
}