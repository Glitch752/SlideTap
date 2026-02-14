import * as THREE from "three";
import type { GameScene } from "./Game";
import { Node } from "../lib/miniNodeTree";

// This is so cursed what
export const GameNode = Node<THREE.Object3D, GameScene>;

export enum NodeID {
    Renderer = "renderer"
}