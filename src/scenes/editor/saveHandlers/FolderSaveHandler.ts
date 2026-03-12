import type { SaveArchive } from "./SaveArchive";

export class FolderSaveHandler implements SaveArchive {
    private directoryHandle: FileSystemDirectoryHandle | null = null;

    getName(): string {
        return "folder";
    }
    isSupported(): boolean {
        return !!(window as any).showDirectoryPicker;
    }

    async open(): Promise<void> {
        // Prompt the user to select a folder
        this.directoryHandle = await (window as any).showDirectoryPicker();      
    }

    async writeFile(filename: string, data: Blob | string): Promise<void> {
        if(!this.directoryHandle) throw new Error("No folder selected");
        
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
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
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
        this.directoryHandle = null;
    }

    async persist(_name: string): Promise<void> {
        // No logic required
    }
}