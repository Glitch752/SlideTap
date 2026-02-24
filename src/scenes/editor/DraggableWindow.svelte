<script lang="ts">
    import type { Snippet } from "svelte";
    
    const {
        title,
        children,
        onclose,
        minWidth = 300,
        minHeight = 180
    }: {
        title: string,
        children: Snippet,
        onclose?: () => void,
        minWidth?: number,
        minHeight?: number
    } = $props();
    
    const RESIZE_MARGIN = 6;

    type ResizeDirection = {
        left: boolean;
        right: boolean;
        top: boolean;
        bottom: boolean;
    };

    let windowEl: HTMLDivElement | null = null;

    let state = $state({
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        folded: false,
        dragging: false,
        resizing: false,
        dragOffset: { x: 0, y: 0 },
        resizeStart: { x: 0, y: 0, width: 0, height: 0, windowX: 0, windowY: 0 },
        resizeDirection: { left: false, right: false, top: false, bottom: false },
        resizeCursor: "default"
    });
    
    function onTitlebarMouseDown(e: MouseEvent) {
        if(windowEl) {
            const direction = getResizeDirection(e, windowEl);
            if(direction.left || direction.right || direction.top || direction.bottom) return;
        }
        state.dragging = true;
        state.dragOffset = {
            x: e.clientX - state.x,
            y: e.clientY - state.y
        };
        window.addEventListener("mousemove", onDrag);
        window.addEventListener("mouseup", onDragEnd);
    }
    
    function onDrag(e: MouseEvent) {
        if (!state.dragging) return;

        const winWidth = state.width;
        const winHeight = state.folded ? 24 : state.height;
        
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        let newX = e.clientX - state.dragOffset.x;
        let newY = e.clientY - state.dragOffset.y;
        
        // clamp so window stays inside viewport
        newX = Math.max(0, Math.min(newX, screenW - winWidth));
        newY = Math.max(0, Math.min(newY, screenH - winHeight));
        
        state.x = newX;
        state.y = newY;
    }
    
    function onDragEnd() {
        state.dragging = false;
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", onDragEnd);
    }
    
    function getResizeDirection(e: MouseEvent, target: HTMLElement): ResizeDirection {
        const rect = target.getBoundingClientRect();
        const left = e.clientX - rect.left <= RESIZE_MARGIN;
        const right = rect.right - e.clientX <= RESIZE_MARGIN;
        const top = e.clientY - rect.top <= RESIZE_MARGIN;
        const bottom = rect.bottom - e.clientY <= RESIZE_MARGIN;
        return { left, right, top, bottom };
    }

    function getResizeCursor(direction: ResizeDirection) {
        const { left, right, top, bottom } = direction;
        if((left && top) || (right && bottom)) return "nwse-resize";
        if((right && top) || (left && bottom)) return "nesw-resize";
        if(left || right) return "ew-resize";
        if(top || bottom) return "ns-resize";
        return "default";
    }

    function onWindowMouseDown(e: MouseEvent) {
        const target = e.currentTarget as HTMLElement | null;
        if(!target) return;

        const direction = getResizeDirection(e, target);
        if(!direction.left && !direction.right && !direction.top && !direction.bottom) return;

        e.stopPropagation();
        e.preventDefault();

        state.dragging = false;
        state.resizing = true;
        state.resizeDirection = direction;
        state.resizeStart = {
            x: e.clientX,
            y: e.clientY,
            width: state.width,
            height: state.height,
            windowX: state.x,
            windowY: state.y
        };
        window.addEventListener("mousemove", onResize);
        window.addEventListener("mouseup", onResizeEnd);
    }

    function onWindowMouseMove(e: MouseEvent) {
        if (state.dragging || state.resizing) return;
        const target = e.currentTarget as HTMLElement | null;
        if(!target) return;
        
        const direction = getResizeDirection(e, target);
        state.resizeCursor = getResizeCursor(direction);
    }

    function onWindowMouseLeave() {
        if (state.dragging || state.resizing) return;
        state.resizeCursor = "default";
    }
    
    function onResize(e: MouseEvent) {
        if(!state.resizing) return;

        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        const dx = e.clientX - state.resizeStart.x;
        const dy = e.clientY - state.resizeStart.y;

        let newX = state.resizeStart.windowX;
        let newY = state.resizeStart.windowY;
        let newWidth = state.resizeStart.width;
        let newHeight = state.resizeStart.height;

        const { left, right, top, bottom } = state.resizeDirection;

        if(right) {
            newWidth = state.resizeStart.width + dx;
        }
        if(left) {
            newWidth = state.resizeStart.width - dx;
            newX = state.resizeStart.windowX + dx;
        }
        if(bottom) {
            newHeight = state.resizeStart.height + dy;
        }
        if(top) {
            newHeight = state.resizeStart.height - dy;
            newY = state.resizeStart.windowY + dy;
        }

        if(newWidth < minWidth) {
            if(left) newX -= minWidth - newWidth;
            newWidth = minWidth;
        }
        if(newHeight < minHeight) {
            if(top) newY -= minHeight - newHeight;
            newHeight = minHeight;
        }

        if(newX < 0) {
            if(left) newWidth += newX;
            newX = 0;
        }
        if(newY < 0) {
            if(top) newHeight += newY;
            newY = 0;
        }

        if(newX + newWidth > screenW) newWidth = screenW - newX;
        if(newY + newHeight > screenH) newHeight = screenH - newY;

        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);

        state.x = newX;
        state.y = newY;
        state.width = newWidth;
        state.height = newHeight;
    }
    
    function onResizeEnd() {
        state.resizing = false;
        window.removeEventListener("mousemove", onResize);
        window.removeEventListener("mouseup", onResizeEnd);
    }
    
    function toggleFold() {
        state.folded = !state.folded;
    }
</script>

<div
    class="window"
    bind:this={windowEl}
    role="presentation"
    style="left: {state.x}px; top: {state.y}px; width: {state.width}px; height: {state.folded ? "auto" : state.height + "px"}; cursor: {state.resizeCursor};"
    onmousedown={onWindowMouseDown}
    onmousemove={onWindowMouseMove}
    onmouseleave={onWindowMouseLeave}
>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="titlebar" onmousedown={onTitlebarMouseDown} ondblclick={toggleFold}>
        <span class="title">{title}</span>
        <button class="fold-btn" onclick={toggleFold}>{state.folded ? "▼" : "▲"}</button>
        {#if onclose}
            <button class="close-btn" onclick={onclose}>×</button>
        {/if}
    </div>
    <div class="content" class:hidden={state.folded}>
        {@render children()}
    </div>
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

        display: grid;
        grid-template-rows: 25px 1fr;
        grid-template-areas:
            "titlebar"
            "content";
    }
    .titlebar {
        display: flex;
        align-items: center;
        background-color: var(--panel);
        grid-area: titlebar;
        cursor: grab;
        padding: 0 12px;
        border-bottom: 1px solid var(--surface);
        font-size: 1.1em;
        
        .title {
            flex: 1;
        }
        > button {
            background-color: transparent;
            border: none;
            cursor: pointer;
            color: var(--accent);
            margin-left: 8px;
        }
        .fold-btn {
            font-size: 0.5em;
        }
    }
    .content {
        padding: 16px;
        min-height: 60px;
        background-color: var(--panel);
        position: relative;
        grid-area: content;

        &.hidden {
            display: none;
        }
    }
</style>