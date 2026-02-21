<script lang="ts">
    import type { Snippet } from "svelte";
    
    const {
        title,
        children
    }: {
        title: string,
        children: Snippet
    } = $props();
    
    let position = $state({
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        folded: false,
        dragging: false,
        resizing: false,
        dragOffset: { x: 0, y: 0 },
        resizeStart: { x: 0, y: 0, width: 0, height: 0 }
    });
    
    function onTitlebarMouseDown(e: MouseEvent) {
        position.dragging = true;
        position.dragOffset = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        window.addEventListener("mousemove", onDrag);
        window.addEventListener("mouseup", onDragEnd);
    }
    
    function onDrag(e: MouseEvent) {
        if (!position.dragging) return;

        const winWidth = position.width;
        const winHeight = position.folded ? 40 : position.height;
        
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        let newX = e.clientX - position.dragOffset.x;
        let newY = e.clientY - position.dragOffset.y;
        
        // clamp so window stays inside viewport
        newX = Math.max(0, Math.min(newX, screenW - winWidth));
        newY = Math.max(0, Math.min(newY, screenH - winHeight));
        
        position.x = newX;
        position.y = newY;
    }
    
    function onDragEnd() {
        position.dragging = false;
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", onDragEnd);
    }
    
    function onResizeHandleMouseDown(e: MouseEvent) {
        e.stopPropagation();
        position.resizing = true;
        position.resizeStart = {
            x: e.clientX,
            y: e.clientY,
            width: position.width,
            height: position.height
        };
        window.addEventListener("mousemove", onResize);
        window.addEventListener("mouseup", onResizeEnd);
    }
    
    function onResize(e: MouseEvent) {
        if(!position.resizing) return;

        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        let newWidth = position.resizeStart.width + (e.clientX - position.resizeStart.x);
        let newHeight = position.resizeStart.height + (e.clientY - position.resizeStart.y);
        
        // minimum size
        newWidth = Math.max(150, newWidth);
        newHeight = Math.max(40, newHeight);
        
        // clamp so window doesn't go outside viewport
        newWidth = Math.min(newWidth, screenW - position.x);
        newHeight = Math.min(newHeight, screenH - position.y);
        
        position.width = newWidth;
        position.height = newHeight;
    }
    
    function onResizeEnd() {
        position.resizing = false;
        window.removeEventListener("mousemove", onResize);
        window.removeEventListener("mouseup", onResizeEnd);
    }
    
    function toggleFold() {
        position.folded = !position.folded;
    }
</script>

<div class="window" style="left: {position.x}px; top: {position.y}px; width: {position.width}px; height: {position.folded ? 40 : position.height}px;">
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="titlebar" onmousedown={onTitlebarMouseDown}>
        <span class="title">{title}</span>
        <button class="fold-btn" onclick={toggleFold}>{position.folded ? "▼" : "▲"}</button>
    </div>
    <div class="content" class:hidden={position.folded}>
        {@render children()}
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-handle" onmousedown={onResizeHandleMouseDown}></div>
</div>

<style lang="scss">
    .window {
        position: absolute;
        background-color: var(--panel);
        border: 2px solid var(--surface);
        border-radius: 5px;
        box-shadow: 0 0 8px #00000044;
        overflow: hidden;
        user-select: none;
        z-index: 100;
    }
    .titlebar {
        display: flex;
        align-items: center;
        background-color: var(--panel);
        height: 24px;
        cursor: grab;
        padding: 0 12px;
        border-bottom: 1px solid var(--surface);
        font-size: 1.1em;
    }
    .titlebar .title {
        flex: 1;
    }
    .fold-btn {
        background-color: transparent;
        border: none;
        font-size: 0.5em;
        cursor: pointer;
        color: var(--accent);
        margin-left: 8px;
    }
    .content {
        padding: 16px;
        min-height: 60px;
        background-color: var(--panel);
        position: relative;

        &.hidden {
            display: none;
        }
    }
    .resize-handle {
        position: absolute;
        right: 0;
        bottom: 0;
        width: 16px;
        height: 16px;
        background-color: var(--surface);
        cursor: se-resize;
        z-index: 2;
    }
</style>