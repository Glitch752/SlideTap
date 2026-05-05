import { get } from "svelte/store";
import type { EditorEventID, EditorFile, EditorMapData, EditorNoteID } from "./EditorFile";
import type { MapNote } from "../../Map";

export function copyNotes(idsToCopy: EditorNoteID[], map: EditorMapData) {
    const noteDatas = get(map.notes);
    const notesToCopy = idsToCopy
        .map(id => noteDatas.get(id))
        .filter((n): n is MapNote => n !== undefined)
        .map(n => ({ ...n }));

    // Shift all times to the earliest start time
    let earliest = Infinity;
    for(const note of notesToCopy) {
        if(note.startTime < earliest) earliest = note.startTime;
    }
    for(const note of notesToCopy) {
        note.startTime -= earliest;
        note.endTime -= earliest;
    }

    navigator.clipboard.writeText(`NOTES:${JSON.stringify(notesToCopy)}`);
}

export function copyEvent(idToCopy: EditorEventID, map: EditorMapData) {
    const eventDatas = get(map.events);
    const eventToCopy = eventDatas.get(idToCopy);
    if(!eventToCopy) return;

    navigator.clipboard.writeText(`EVENT:${JSON.stringify(eventToCopy)}`);
}

function pasteNotes(startBeat: number, editedFile: EditorFile, map: EditorMapData, selectedNotes: Set<EditorNoteID>, data: unknown) {
    if(!Array.isArray(data)) return;

    map.notes.update(existingNotes => {
        for(const note of data) {
            const newID = editedFile.generateNoteId();
            existingNotes.set(newID, {
                ...note,
                startTime: note.startTime + startBeat,
                endTime: note.endTime + startBeat
            });
            selectedNotes.add(newID);
        }
        return existingNotes;
    });
    editedFile.changed();
}

function pasteEvent(startBeat: number, editedFile: EditorFile, map: EditorMapData, selectedNotes: Set<EditorNoteID>, data: any) {
    if(typeof data !== "object" || data === null || !("time" in data)) return;

    map.events.update(existingEvents => {
        const newID = editedFile.generateEventId();
        existingEvents.set(newID, {
            ...data,
            time: startBeat
        });
        return existingEvents;
    });

    editedFile.changed();
}

export function paste(startTime: number, editedFile: EditorFile, map: EditorMapData, selectedNotes: Set<EditorNoteID>) {
    const startBeat = startTime * editedFile.getMeta().bpm / 60;

    navigator.clipboard.readText().then(text => {
        const split = text.split(":");
        if(split.length < 2) return;
        const dataType = split[0];
        const data = JSON.parse(split.slice(1).join(":")) as MapNote[];

        switch(dataType) {
            case "NOTES": {
                pasteNotes(startBeat, editedFile, map, selectedNotes, data);
                break;
            }
            case "EVENT": {
                pasteEvent(startBeat, editedFile, map, selectedNotes, data);
                break;
            }
            default: {
                console.warn("Unknown clipboard data type:", dataType);
            }
        }
    });
}
