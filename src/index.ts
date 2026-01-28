import './styles/index.scss';

import { Settings } from './Settings';
import { Sounds } from './Sounds';
import type { Scene } from './scenes/Scene';
import { SongListScene } from './scenes/SongList';

const settings = new Settings();
Sounds.init();

let scene: Scene = new SongListScene();
scene.show();

export function loadScene(newScene: Scene) {
    scene.hide();
    scene = newScene;
    scene.show();
}

document.addEventListener("keydown", (e) => scene.onKeyDown?.(e));
document.addEventListener("keyup", (e) => scene.onKeyUp?.(e));

// (document.getElementById("settings") as HTMLDialogElement).showModal();
