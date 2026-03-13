import { ReadonlyStaticDirSaveHandler } from "./scenes/editor/saveHandlers/ReadonlyStaticDirSaveHandler";

export const songArchives: ReadonlyStaticDirSaveHandler[] = [
    new ReadonlyStaticDirSaveHandler("songs/badApple", "Bad Apple!!"),
    new ReadonlyStaticDirSaveHandler("songs/kontonBoogie", "Konton Boogie")
];