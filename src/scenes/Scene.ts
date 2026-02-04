import type { Component } from "svelte";

export interface Scene {
    component: Component<{}>;

    init?(): void;
    
    onKeyDown?(event: KeyboardEvent): void;
    onKeyUp?(event: KeyboardEvent): void;
    onScroll?(event: WheelEvent): void;
}