import type { GameMap, MapEvent } from "../Map";
import type { Song } from "../Song";
import { type Scene } from "../scenes/Scene";
import * as THREE from "three";
import Game from "../scenes/game/Game.svelte";
import { connectParenting, NodeTree, Signal } from "../lib/miniNodeTree";
import { Renderer } from "./Renderer";
import { Skybox } from "./environment/Skybox";
import { Platforms } from "./environment/Platforms";
import { Lighting } from "./environment/Lighting";
import { Lanes } from "./Lanes";
import { Input } from "./Input";
import { NodeID } from "./types";
import { Timer, TimerState } from "./Timer";
import { LevelInterface } from "./ui/LevelInterface";
import { Score } from "./Score";

export class GameScene implements Scene {
    public component = Game;
    public componentProps() {
        return {
            timer: this.timer,
            editor: this.controlledByEditor
        };
    }

    private timer: Timer;

    public song: Song | null;
    public map: GameMap | null = null;

    public scene: THREE.Scene;
    public tree: NodeTree<THREE.Object3D, GameScene> = new NodeTree(this as GameScene, true);
    
    public onInit: Signal<[]> = new Signal();
    public onMapEvent: Signal<[MapEvent]> = new Signal();

    public score: Score = new Score();

    public init(): void {
        connectParenting(this.tree, this.scene);

        this.timer.jumpedBackward.connect(() => this.resetEventIndex());

        this.tree.addChildren(
            // Logic
            this.timer,
            new Input().setId(NodeID.Input),

            // Rendering
            new Lighting(),
            new Platforms(),
            new Skybox(),

            new Lanes(this.map).setId(NodeID.Lanes),

            // Renderer must be last so we update before drawing
            new LevelInterface(this.controlledByEditor),
            new Renderer().setId(NodeID.Renderer)
        );

        if(!this.controlledByEditor) {
            // Begin playback
            this.timer.startPlayback(this.song);
            this.timer.done.connect(this.score.end.bind(this.score));

            this.score.ended.connect(() => {
                // TODO
                console.log("Game ended");
            });
        }

        this.onInit();

        // @ts-expect-error
        window["tree"] = this.tree; // for debugging
    }

    private async loadMap(): Promise<void> {
        if(this.mapIndex < 0 || this.mapIndex >= (this.song?.maps.length ?? 0)) {
            console.warn("Invalid map index, not loading map");
            this.tree.get<Lanes>(NodeID.Lanes)?.setMap(null);
            return;
        }

        this.map = (await this.song?.getMap(this.mapIndex)) ?? null;
        this.tree.get<Lanes>(NodeID.Lanes)?.setMap(this.map);
    }

    public static async load(song: Song, mapIndex: number, speed = 1): Promise<GameScene> {
        const scene = new GameScene(song, mapIndex, speed);
        await scene.loadMap();
        return scene;
    }

    constructor(song: Song | null, public mapIndex: number, private speed: number = 1, public controlledByEditor: boolean = false) {
        this.song = song;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#060d16");

        this.timer = new Timer(this.speed).setId(NodeID.Timer);
    }

    public setSong(song: Song, mapIndex: number) {
        this.song = song;
        this.mapIndex = mapIndex;
        this.loadMap();
    }

    private lastTime: number = 0;
    public animate(time: DOMHighResTimeStamp) {
        if(this.lastTime === 0) this.lastTime = time - (1000 / 60);
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        const events = this.getNewEventsElapsed();
        for(const event of events) {
            this.onMapEvent(event);
        }

        this.tree.updateRecursive((this.timer.state === TimerState.Running || this.controlledByEditor) ? deltaTime : 0);
    }

    private eventIndex = 0;
    private getNewEventsElapsed() {
        if(!this.map) return [];
        if(this.eventIndex >= this.map.events.length) return [];
        
        const events = [];
        const elapsed = this.timer.getElapsed();
        const elapsedBeats = elapsed / this.song!.beatDuration;
        while(this.eventIndex < this.map.events.length && this.map.events[this.eventIndex].time <= elapsedBeats) {
            events.push(this.map.events[this.eventIndex]);
            this.eventIndex++;
        }
        return events;
    }
    private resetEventIndex() {
        this.eventIndex = 0;
        if(!this.map) return;

        const elapsed = this.timer.getElapsed();
        const elapsedBeats = elapsed / this.song!.beatDuration;
        while(this.eventIndex < this.map.events.length && this.map.events[this.eventIndex].time <= elapsedBeats) {
            this.eventIndex++;
        }
    }

    onKeyDown(event: KeyboardEvent): void {
        this.tree.get<Input>(NodeID.Input)!.onKeyDown(event);
    }
    onKeyUp(event: KeyboardEvent): void {
        this.tree.get<Input>(NodeID.Input)!.onKeyUp(event);
    }
}
