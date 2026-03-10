/**
 * The file structure of song file directories is:  
 * - metadata.json (schema SongDataJSON)  
 * - A cover under the path defined by (metadata.json).cover  
 * - A track under the path defined by (metadata.json).track  
 * - A JSON file for each map defined by (metadata.json).maps[N].dataPath  
 *   
 * These can be saved in multiple ways, though, so this is a generic interface.
 */
export interface SaveArchive {
    isSupported(): boolean;
    /** The name of this archive type, to be included in "Save as {name}..." or "Open {name}..." */
    getName(): string;

    open(): Promise<void>;

    readFile(path: string): Promise<Blob | null>;
    
    writeFile(path: string, data: Blob | string): Promise<void>;

    // getFiles(): Promise<string[]>;
    // removeFile(path: string): Promise<void>;
    
    persist(name: string): Promise<void>;
    close(): Promise<void>;
}