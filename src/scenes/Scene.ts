export interface Scene {
    show(): void;
    hide(): void;
    
    onKeyDown?(event: KeyboardEvent): void;
    onKeyUp?(event: KeyboardEvent): void;
}