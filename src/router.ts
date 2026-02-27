import { get, writable, derived } from 'svelte/store';
import { MenuScene } from "./scenes/Menu";
import type { Scene } from "./scenes/Scene";

export const activeScene = writable<Scene>(new MenuScene());
export const transitioning = writable<boolean>(false);
export const activeComponent = derived(activeScene, $s => $s.component);

export function loadScene(scene: Scene) {
    if(get(transitioning)) return;
    transitioning.set(true);

    setTimeout(() => {
        activeScene.set(scene);
        setTimeout(() => {
            transitioning.set(false);
        }, 50);
    }, 50);
}
