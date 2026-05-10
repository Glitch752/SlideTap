import type { Component } from "svelte";


export interface Scene<C extends Component<any> = Component<any>> {
    // I don't know how to type this properly so this is good enough I guess
    component: C;
    componentProps?: () => C extends Component<infer P> ? P : never;

    init?(): void;
    onKeyDown?(event: KeyboardEvent): void;
    onKeyUp?(event: KeyboardEvent): void;
    onScroll?(event: WheelEvent): void;
}