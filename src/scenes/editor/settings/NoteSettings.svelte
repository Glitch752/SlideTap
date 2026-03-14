<script lang="ts">
    import type { EditorFile, EditorNoteID } from "../EditorFile";

    const {
        file,
        notes
    }: {
        file: EditorFile,
        notes: Set<EditorNoteID>
    } = $props();
</script>