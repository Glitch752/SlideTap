import type { SaveArchive } from "./SaveArchive";

export class ReadonlyStaticDirSaveHandler implements SaveArchive {
    constructor(private songPath: string, public songName: string) {}

    openable() {
        return null;
    }

    async readFile(path: string): Promise<Blob | null> {
        try {
            const response = await fetch(`${this.songPath}/${path}`, {
                credentials: "omit"
            });
            if(!response || !response.ok) return null;

            const blob = await response.blob();
            return blob;
        } catch(e) {
            return null;
        }
    }

    async close(): Promise<void> {
        // no resources to clean up
        return;
    }

    writeFile(path: string, data: Blob | string): Promise<void> {
        return Promise.reject(new Error("Cannot write to static directory"));
    }

    persist(name: string): Promise<void> {
        return Promise.reject(new Error("Cannot persist to static directory"));
    }
}