<script lang="ts">
    import type { Snippet } from "svelte";
    
    const {
        title,
        children,
        onclose,
        minWidth = 300,
        minHeight = 180,
        id
    }: {
        title: string,
        children: Snippet,
        onclose?: () => void,
        minWidth?: number,
        minHeight?: number,
        id: string
    } = $props();
    
    const RESIZE_MARGIN = 6;

    type ResizeDirection = {
        left: boolean;
        right: boolean;
        top: boolean;
        bottom: boolean;
    };

    let windowEl: HTMLDivElement | null = null;

    let storageKey = $derived(`draggable-window-${id}`);
    // svelte-ignore state_referenced_locally
    let position = $state(JSON.parse(localStorage.getItem(storageKey) ?? "null") ?? {
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        folded: false
    });
    $effect(() => {
        localStorage.setItem(storageKey, JSON.stringify(position));
    });

    let windowState = $state({
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
        windowState.dragging = true;
        windowState.dragOffset = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
        window.addEventListener("mousemove", onDrag);
        window.addEventListener("mouseup", onDragEnd);
    }
    
    function onDrag(e: MouseEvent) {
        if(!windowState.dragging) return;

        const winWidth = position.width;
        const winHeight = position.folded ? 24 : position.height;
        
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        let newX = e.clientX - windowState.dragOffset.x;
        let newY = e.clientY - windowState.dragOffset.y;
        
        // clamp so window stays inside viewport
        newX = Math.max(0, Math.min(newX, screenW - winWidth));
        newY = Math.max(0, Math.min(newY, screenH - winHeight));
        
        position.x = newX;
        position.y = newY;
    }
    
    function onDragEnd() {
        windowState.dragging = false;
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

        windowState.dragging = false;
        windowState.resizing = true;
        windowState.resizeDirection = direction;
        windowState.resizeStart = {
            x: e.clientX,
            y: e.clientY,
            width: position.width,
            height: position.height,
            windowX: position.x,
            windowY: position.y
        };
        window.addEventListener("mousemove", onResize);
        window.addEventListener("mouseup", onResizeEnd);
    }

    function onWindowMouseMove(e: MouseEvent) {
        if (windowState.dragging || windowState.resizing) return;
        const target = e.currentTarget as HTMLElement | null;
        if(!target) return;
        
        const direction = getResizeDirection(e, target);
        windowState.resizeCursor = getResizeCursor(direction);
    }

    function onWindowMouseLeave() {
        if (windowState.dragging || windowState.resizing) return;
        windowState.resizeCursor = "default";
    }
    
    function onResize(e: MouseEvent) {
        if(!windowState.resizing) return;

        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        const dx = e.clientX - windowState.resizeStart.x;
        const dy = e.clientY - windowState.resizeStart.y;

        let newX = windowState.resizeStart.windowX;
        let newY = windowState.resizeStart.windowY;
        let newWidth = windowState.resizeStart.width;
        let newHeight = windowState.resizeStart.height;

        const { left, right, top, bottom } = windowState.resizeDirection;

        if(right) {
            newWidth = windowState.resizeStart.width + dx;
        }
        if(left) {
            newWidth = windowState.resizeStart.width - dx;
            newX = windowState.resizeStart.windowX + dx;
        }
        if(bottom) {
            newHeight = windowState.resizeStart.height + dy;
        }
        if(top) {
            newHeight = windowState.resizeStart.height - dy;
            newY = windowState.resizeStart.windowY + dy;
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

        position.x = newX;
        position.y = newY;
        position.width = newWidth;
        position.height = newHeight;
    }
    
    function onResizeEnd() {
        windowState.resizing = false;
        window.removeEventListener("mousemove", onResize);
        window.removeEventListener("mouseup", onResizeEnd);
    }

    function onWindowResize() {
        // Make sure we're in bounds
        if(position.x + position.width > window.innerWidth) {
            position.x = window.innerWidth - position.width;
        }
        if(position.y + position.height > window.innerHeight) {
            position.y = window.innerHeight - position.height;
        }
    }

    function toggleFold() {
        position.folded = !position.folded;
    }
</script>

<svelte:window onresize={onWindowResize}></svelte:window>

<div
    class="window"
    bind:this={windowEl}
    role="presentation"
    style="left: {position.x}px; top: {position.y}px; width: {position.width}px; height: {position.folded ? "auto" : position.height + "px"}; cursor: {windowState.resizeCursor};"
    onmousedown={onWindowMouseDown}
    onmousemove={onWindowMouseMove}
    onmouseleave={onWindowMouseLeave}
>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="titlebar" onmousedown={onTitlebarMouseDown} ondblclick={toggleFold}>
        <span class="title">{title}</span>
        <button class="fold-btn" onclick={toggleFold}>{position.folded ? "▼" : "▲"}</button>
        {#if onclose}
            <button class="close-btn" onclick={onclose}>×</button>
        {/if}
    </div>
    <div class="content" class:hidden={position.folded}>
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