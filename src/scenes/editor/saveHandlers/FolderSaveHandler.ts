import { staticImplements, type SaveArchive, type OpenableSaveArchive } from "./SaveArchive";

@staticImplements<OpenableSaveArchive>()
export class FolderSaveArchive implements SaveArchive {
    public static isSupported(): boolean {
        return !!(window as any).showDirectoryPicker;
    }
    public static getName(): string {
        return "folder";
    }

    private writables: Map<string, FileSystemWritableFileStream> = new Map();

    constructor(private directoryHandle: FileSystemDirectoryHandle | null = null) {
    }

    openable() {
        return FolderSaveArchive;
    }

    static async open(): Promise<FolderSaveArchive> {
        // Prompt the user to select a folder
        return new FolderSaveArchive(
            await (window as any).showDirectoryPicker()
        );     
    }

    async writeFile(filename: string, data: Blob | string): Promise<void> {
        try {
            if(!this.directoryHandle) {
                this.directoryHandle = await (window as any).showDirectoryPicker();
            }
            if(!this.directoryHandle) throw new Error("No folder selected");
            
            let writable = this.writables.get(filename);
            if(!writable) {
                // Create parent folders if they don't exist
                let parentDir = this.directoryHandle;
                if(filename.includes("/")) {
                    const pathParts = filename.split("/");
                    filename = pathParts[pathParts.length - 1];
                    for(let i = 0; i < pathParts.length - 1; i++) {
                        parentDir = await parentDir.getDirectoryHandle(pathParts[i], { create: true });
                    }
                }

                const fileHandle = await parentDir.getFileHandle(filename, { create: true });
                writable = await fileHandle.createWritable();
                this.writables.set(filename, writable);
            }

            await writable.truncate(0);
            await writable.write(data);
        } catch(e) {
            console.error(`Error writing file ${filename}:`, e);
            throw e;
        }
    }

    async readFile(filename: string): Promise<Blob | null> {
        if(!this.directoryHandle) throw new Error("No folder selected");

        try {
            let parentDir = this.directoryHandle;
            if(filename.includes("/")) {
                const pathParts = filename.split("/");
                filename = pathParts[pathParts.length - 1];
                for(let i = 0; i < pathParts.length - 1; i++) {
                    parentDir = await parentDir.getDirectoryHandle(pathParts[i], { create: true });
                }
            }
            
            const fileHandle = await parentDir.getFileHandle(filename);
            const file = await fileHandle.getFile();
            return file;
        } catch(e) {
            return null;
        }
    }

    async close(): Promise<void> {
        for(const writable of this.writables.values()) {
            await writable.close();
        }
        this.writables.clear();

        this.directoryHandle = null;
    }

    async persist(_name: string): Promise<void> {
        // No logic required
    }
}