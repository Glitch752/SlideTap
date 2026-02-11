/**
 * I like GDScript, okay?
 */
export class Signal<T extends[...any[]]> {
    private listeners: Array<(...args: T) => void> = [];

    public connect(listener: ((...args: T) => void) | Signal<T>) {
        if(listener instanceof Signal) {
            this.listeners.push(listener.boundEmit);
            return;
        }
        this.listeners.push(listener);
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

export class NodeTree<T> {
    children: Set<Node<T>> = new Set();
    updatingChildren: Set<Node<T>> = new Set();
    /** A recursive map of uniquely-identified children across this scene tree. */
    namedChildren: Map<string, Node<T>> = new Map();

    onNodeAdded: Signal<[Node<T>]> = new Signal();
    onNodeRemoved: Signal<[Node<T>]> = new Signal();
    onIdChanged: Signal<[Node<T>, string | null, string | null]> = new Signal();
    onEvent: Signal<[CustomEvent]> = new Signal();

    constructor() {
        this.onIdChanged.connect(this.handleIdChanged.bind(this));
    }

    private handleIdChanged(node: Node<T>, oldId: string | null, newId: string | null) {
        if(oldId) this.namedChildren.delete(oldId);
        if(newId) this.namedChildren.set(newId, node);
    }

    remove(node: Node<T>): void {
        this.children.delete(node);
        this.updatingChildren.delete(node);

        node.onNodeAdded.disconnect(this.onNodeAdded);
        node.onNodeRemoved.disconnect(this.onNodeRemoved);
        node.onIdChanged.disconnect(this.onIdChanged);
        node.onEvent.disconnect(this.onEvent);

        this.onNodeRemoved.emit(node);
    }

    add(node: Node<T>): void {
        this.children.add(node);
        if(node.updates) this.updatingChildren.add(node);
        if(node.id) this.setNodeId(node, node.id);

        node.onNodeAdded.connect(this.onNodeAdded);
        node.onNodeRemoved.connect(this.onNodeRemoved);
        node.onIdChanged.connect(this.onIdChanged);
        node.onEvent.connect(this.onEvent);

        this.onNodeAdded.emit(node);

        if(!node._initialized) {
            node.init();
            node._initialized = true;
        }
    }

    setNodeUpdating(node: Node<T>, updates: boolean): void {
        if(updates) {
            this.updatingChildren.add(node);
        } else {
            this.updatingChildren.delete(node);
        }
    }
    setNodeId(node: Node<T>, id: string): void {
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

export class Node<T> extends NodeTree<T> {
    _parent: NodeTree<T> | null;
    get parent() {
        return this._parent;
    }

    private _updates: boolean = false;
    get updates() {
        return this._updates;
    }
    _initialized: boolean = false;

    private _id: string | null = null;
    get id() {
        return this._id;
    }

    constructor(parent: NodeTree<T> | null) {
        super();
        this._parent = parent;
    }

    reparent(newParent: NodeTree<T>) {
        if(this._parent) this._parent.remove(this);
        this._parent = newParent;
        this._parent.add(this);
    }

    setUpdates(updates: boolean) {
        this._updates = updates;
        if(this._parent) this._parent.setNodeUpdating(this, updates);
    }
    setId(id: string) {
        this._id = id;
        if(this._parent) this._parent.setNodeId(this, id);
    }

    init(): void {}

    update(deltaTime: number): void {}
    
    pause(): void {}
    unpause(): void {}
}