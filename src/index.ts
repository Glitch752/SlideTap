import './index.scss';

import { Settings } from './Settings';
import { Sounds } from './Sounds';
import { Song } from './Song';

export const songs = await Promise.all([
    Song.load("kontonBoogie")
]);

const settings = new Settings();
Sounds.init();


// (document.getElementById("settings") as HTMLDialogElement).showModal();
