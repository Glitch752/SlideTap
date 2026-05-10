import { get, writable, derived } from 'svelte/store';
import { MenuScene } from "./scenes/Menu";
import type { Scene } from "./scenes/Scene";

export const activeScene = $state<{
    scene: Scene;
    transitioning: boolean  
}>({
    scene: new MenuScene(),
    transitioning: false
});


export function loadScene(scene: Scene) {
    console.log("Loading scene", scene.constructor.name);
    if(activeScene.transitioning) {
        console.warn("Not loading scene " + scene.constructor.name + " because already transitioning");
        return;
    }
    activeScene.transitioning = true;

    setTimeout(() => {
        activeScene.scene = scene;
        setTimeout(() => {
            activeScene.transitioning = false;
        }, 100);
    }, 100);
}
