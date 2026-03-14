import { staticImplements, type SaveArchive, type OpenableSaveArchive } from "./SaveArchive";
import JSZip from "jszip";

@staticImplements<OpenableSaveArchive>()
export class ZipSaveArchive implements SaveArchive {
    public static isSupported(): boolean {
        return true;
    }
    public static getName(): string {
        return "zip";
    }

    public constructor(private zip: JSZip | null = null) {}

    openable() {
        return ZipSaveArchive;
    }
    
    static async open(): Promise<ZipSaveArchive> {
        const file = await new Promise<File | null>(resolve => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".zip";
            input.onchange = () => resolve(input.files ? input.files[0] : null);
            input.click();
        });

        if(!file) throw new Error("No file selected");

        const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });

        return new ZipSaveArchive(
            await JSZip.loadAsync(arrayBuffer)
        );
    }

    async readFile(path: string): Promise<Blob | null> {
        if(!this.zip) throw new Error("No zip file open");
        const file = this.zip.file(path);
        if(!file) return Promise.resolve(null);

        return await file.async("blob");
    }

    async writeFile(path: string, data: Blob | string): Promise<void> {
        if(!this.zip) {
            this.zip = new JSZip();
        }

        this.zip.file(path, data);
    }

    async close(): Promise<void> {
        this.zip = null;
    }

    async persist(name: string): Promise<void> {
        if(!this.zip) throw new Error("No zip file open");
        const blob = await this.zip.generateAsync({ type: "blob" });

        // trigger download
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${name}.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
    }
}