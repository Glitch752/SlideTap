import type { Component } from "svelte";

export interface Scene {
    component: Component<{}>;
    componentProps?(): {
        [key: string]: any
    };

    init?(): void;
    
    onKeyDown?(event: KeyboardEvent): void;
    onKeyUp?(event: KeyboardEvent): void;
    onScroll?(event: WheelEvent): void;
}