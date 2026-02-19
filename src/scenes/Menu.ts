import type { Scene } from "./Scene";
import Menu from "./menu/Menu.svelte";

export class MenuScene implements Scene {
    public component = Menu;
}