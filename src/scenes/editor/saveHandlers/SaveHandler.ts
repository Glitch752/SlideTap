import { EditorFile } from "../EditorFile";

/**
 * The file structure of song file directories is:  
 * - metadata.json (schema SongDataJSON)  
 * - A cover under the path defined by (metadata.json).cover  
 * - A track under the path defined by (metadata.json).track  
 * - A JSON file for each map defined by (metadata.json).maps[N].dataPath  
 *   
 * These can be saved in multiple ways, though, so this is a generic interface.
 */
export interface SaveHandler {
    load(): Promise<EditorFile>;
    save(file: EditorFile): Promise<void>;
    close(file: EditorFile): Promise<void>;
}

export class BlankSaveHandler implements SaveHandler {
    async load(): Promise<EditorFile> {
        return new EditorFile(this);
    }

    async save(file: EditorFile): Promise<void> {
        alert("not saving");
    }

    async close(file: EditorFile): Promise<void> {
    }
}