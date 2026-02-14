/**
 * I like GDScript, okay?
 */
export class Signal<T extends[...any[]]> {
    private listeners: Array<(...args: T) => void> = [];

    public connect(listener: ((...args: T) => void) | Signal<T>) {
        if(listener instanceof Signal) {
            this.listeners.push(listener.boundEmit);
            return () => this.disconnect(listener);
        }
        this.listeners.push(listener);
        return () => this.disconnect(listener);
    }

    public once(listener: (...args: T) => void) {
        const wrapper = (...args: T) => {
            this.disconnect(wrapper);
            listener(...args);
        };
        return this.connect(wrapper);
    }

    public boundEmit = this.emit.bind(this);
    public emit(...args: T) {
        for(const listener of this.listeners) {
            listener(...args);
        }
    }

    public disconnect(listener: ((...args: T) => void) | Signal<T>) {
        if(listener instanceof Signal) {
            this.listeners = this.listeners.filter(l => l !== listener.boundEmit);
            return;
        }
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    public clear() {
        this.listeners = [];
    }
}

export interface Node3DLike<T> {
    add(child: T): void;
    remove(child: T): void;
}

export function connectParenting<T extends Node3DLike<T>, G extends {}>(tree: NodeTree<T, G>) {
    const offAdd = tree.onNodeAdded.connect((node) => {
        const parent = node.parent;
        if(!(parent instanceof Node)) return;
        if(!parent.value || !node.value) return;
        parent.value.add(node.value);
    });

    const offRemove = tree.onNodeRemoved.connect((node) => {
        const parent = node.parent;
        if(!(parent instanceof Node)) return;
        if(!parent.value || !node.value) return;
        parent.value.remove(node.value);
    });

    return () => {
        offAdd();
        offRemove();
    };
}

/**
 * T = Node value type,
 * G = Global context
 */
export class NodeTree<T, G extends {}> {
    children: Set<Node<T, G>> = new Set();
    updatingChildren: Set<Node<T, G>> = new Set();
    /** A recursive map of uniquely-identified children across this scene tree. */
    namedChildren: Map<string, Node<T, G>> = new Map();

    onNodeAdded: Signal<[Node<T, G>]> = new Signal();
    onNodeRemoved: Signal<[Node<T, G>]> = new Signal();
    onIdChanged: Signal<[Node<T, G>, string | null, string | null]> = new Signal();
    onEvent: Signal<[CustomEvent]> = new Signal();
    
    private _context: G | null;
    get context() {
        return this._context;
    }

    constructor(context: G | null) {
        this._context = context;
        this.onIdChanged.connect(this.handleIdChanged.bind(this));
    }

    private handleIdChanged(node: Node<T, G>, oldId: string | null, newId: string | null) {
        if(oldId) this.namedChildren.delete(oldId);
        if(newId) this.namedChildren.set(newId, node);
    }

    addChildren(...nodes: Array<Node<T, G>>): void {
        for(const node of nodes) this.add(node);
    }

    removeChildren(...nodes: Array<Node<T, G>>): void {
        for(const node of nodes) this.remove(node);
    }

    clear(): void {
        for(const node of Array.from(this.children)) {
            this.remove(node);
        }
    }

    getById(id: string): Node<T, G> | undefined {
        return this.namedChildren.get(id);
    }

    *walkRecursive(): IterableIterator<Node<T, G>> {
        for(const child of this.children) {
            yield child;
            yield* child.walkRecursive();
        }
    }

    findRecursive(predicate: (node: Node<T, G>) => boolean): Node<T, G> | undefined {
        for(const node of this.walkRecursive()) {
            if(predicate(node)) return node;
        }
        return undefined;
    }

    forEachRecursive(visitor: (node: Node<T, G>) => void): void {
        for(const node of this.walkRecursive()) {
            visitor(node);
        }
    }

    private indexNamedChildren(node: Node<T, G>): void {
        if(node.id) this.namedChildren.set(node.id, node);
        for(const child of node.children) {
            this.indexNamedChildren(child);
        }
    }

    private removeNamedChildren(node: Node<T, G>): void {
        if(node.id) this.namedChildren.delete(node.id);
        for(const child of node.children) {
            this.removeNamedChildren(child);
        }
    }

    remove(node: Node<T, G>): void {
        node._parent = null;
        
        this.children.delete(node);
        this.updatingChildren.delete(node);
        this.removeNamedChildren(node);

        node.onNodeAdded.disconnect(this.onNodeAdded);
        node.onNodeRemoved.disconnect(this.onNodeRemoved);
        node.onIdChanged.disconnect(this.onIdChanged);
        node.onEvent.disconnect(this.onEvent);

        this.onNodeRemoved.emit(node);
    }

    add(node: Node<T, G>): void {
        node._parent = this;

        this.children.add(node);
        if(node.updates) this.updatingChildren.add(node);
        if(node.id) this.setNodeId(node, node.id);
        this.indexNamedChildren(node);

        node.onNodeAdded.connect(this.onNodeAdded);
        node.onNodeRemoved.connect(this.onNodeRemoved);
        node.onIdChanged.connect(this.onIdChanged);
        node.onEvent.connect(this.onEvent);

        this.onNodeAdded.emit(node);

        if(!node._initialized) {
            const ctx = node.context;
            if(!ctx) throw new Error("Global context is not available");
            node.init(ctx);
            node._initialized = true;
        }
    }

    setNodeUpdating(node: Node<T, G>, updates: boolean): void {
        if(updates) {
            this.updatingChildren.add(node);
        } else {
            this.updatingChildren.delete(node);
        }
    }
    setNodeId(node: Node<T, G>, id: string | null): void {
        const oldId = node.id === id ? null : node.id;
        this.onIdChanged.emit(node, oldId, id);
    }

    updateRecursive(deltaTime: number): void {
        for(const child of this.updatingChildren) {
            child.updateRecursive(deltaTime);
            child.update(deltaTime);
        }
    }

    emitEvent(event: CustomEvent): void {
        this.onEvent.emit(event);
    }
}

/**
 * T = node value type,
 * G = global context
 */
export class Node<T, G extends {}> extends NodeTree<T, G> {
    _parent: NodeTree<T, G> | null = null;
    get parent() {
        return this._parent;
    }

    get context() {
        return this._parent ? this._parent.context : null;
    }

    value: T | null = null;

    private _updates: boolean = false;
    get updates() {
        return this._updates;
    }
    _initialized: boolean = false;

    private _id: string | null = null;
    get id() {
        return this._id;
    }

    constructor(value: T | null = null) {
        super(null);
        this.value = value;
    }

    reparent(newParent: NodeTree<T, G>) {
        if(this._parent) this._parent.remove(this);
        this._parent = newParent;
        this._parent.add(this);
        return this;
    }

    removeFromParent(): void {
        if(this._parent) this._parent.remove(this);
        this._parent = null;
    }

    get root(): NodeTree<T, G> {
        let current: NodeTree<T, G> = this;
        while(current instanceof Node && current.parent) {
            current = current.parent;
        }
        return current;
    }

    setUpdates(updates: boolean) {
        this._updates = updates;
        if(this._parent) this._parent.setNodeUpdating(this, updates);
        return this;
    }
    setId(id: string | null) {
        this._id = id;
        if(this._parent) this._parent.setNodeId(this, id);
        return this;
    }

    init(_context: G): void {}

    update(_deltaTime: number): void {}
}