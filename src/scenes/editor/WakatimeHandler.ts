// https://wakatime.com/developers#heartbeats

import { writable, type Writable } from "svelte/store";
import { PersistedValue } from "../../utils/persistedValue";

export type HeartbeatType = "file" | "app" | "domain";

export interface Heartbeat {
    /** entity heartbeat is logging time against, such as an absolute file path or domain */
    entity: string;
    /** type of entity; can be file, app, or domain */
    type: HeartbeatType;
    /** UNIX epoch timestamp; numbers after decimal point are fractions of a second */
    time?: number; // not optional but assigned by WakatimeHandler if not provided

    /** category for this activity (optional); normally this is inferred automatically from type; can be coding, building, indexing, debugging, browsing, running tests, writing tests, manual testing, writing docs, communicating, code reviewing, notes, researching, learning, designing, or ai coding */
    category?: string;
    /** project name (optional but not really helpful if not specified) */
    project?: string;
    /** count of the number of folders in the project root path (optional); for ex: if the project folder is /Users/user/projects/wakatime and the entity path is /Users/user/projects/wakatime/models/user.py then the project_root_count is 5 and the relative entity path after removing 5 prefix folders is models/user.py */
    project_root_count?: number;
    /** branch name (optional) */
    branch?: string;
    /** language name (optional) */
    language?: string;
    /** comma separated list of dependencies detected from entity file (optional) */
    dependencies?: string;
    /** total number of lines in the entity (when entity type is file) */
    lines: number;
    /** number of lines added or removed by GenAI since last heartbeat in the current file (optional) */
    ai_line_changes?: number;
    /**
     * number of lines added or removed by old-school typing since last heartbeat in the current file (optional)
     * side-note, wakatime... "old-school"??
     */
    human_line_changes?: number;
    /** current line row number of cursor with the first line starting at 1 (optional) */
    lineno?: number;
    /** current cursor column position starting from 1 (optional) */
    cursorpos?: number;
    /** whether this heartbeat was triggered from writing to a file (optional) */
    is_write?: boolean;
}

interface WakaTimeOptions {
    apiKey: string;
    editor: string;
    version?: string;
    apiUrl?: string;
}

// "ok" | "connecting" | "error" | "no_api_key"
enum WakatimeStatus {
    Ok = "ok",
    Connecting = "connecting",
    Error = "error",
    NoApiKey = "no_api_key"
}

/**
 * A simple handler to act as a wakatime plugin.
 */
export class WakatimeHandler {
    public apiKey = PersistedValue.get("wakatimeApiKey", "");
    public apiUrl = PersistedValue.get("wakatimeApiUrl", "https://api.wakatime.com/api/v1");
    public projectName = PersistedValue.get("wakatimeProjectName", "SlideTap");

    public status: Writable<WakatimeStatus> = writable(WakatimeStatus.Connecting);
    public lastError: string | "ok" | null = null;

    public filename: string | null = null;
    public totalBeats = 0;
    public mouseBeat = 0;
    public mouseLane = 0;

    private wakatime: WakatimeWrapper;
    private lastHeartbeatTime = 0;
    private rateLimitSeconds = 30;

    constructor() {
        this.wakatime = new WakatimeWrapper({
            apiKey: this.apiKey.value,
            editor: "SlideTap",
            apiUrl: this.apiUrl.value
        });

        this.apiKey.addCallback((newKey) => {
            this.wakatime.setApiKey(newKey);
            this.updateStatus();
        });
        this.apiUrl.addCallback((newUrl) => {
            this.wakatime.setApiUrl(newUrl);
            this.updateStatus();
        });

        this.updateStatus();
    }

    private updateStatus() {
        if(!this.apiKey.value) {
            this.status.set(WakatimeStatus.NoApiKey); 
        } else if(this.lastError === "ok") {
            this.status.set(WakatimeStatus.Ok);
        } else if(this.lastError === null) {
            this.status.set(WakatimeStatus.Connecting);
        } else {
            this.status.set(WakatimeStatus.Error);
        }
    }

    public setApiKey(key: string) {
        this.apiKey.value = key;
    }
    public setApiUrl(url: string) {
        this.apiUrl.value = url;
    }

    public save() {
        this.sendHeartbeat(true);
    }
    public click() {
        this.sendHeartbeat(false);
    }
    public keypress() {
        this.sendHeartbeat(false);
    }

    private sendHeartbeat(isWrite: boolean) {
        if(!this.filename || !this.totalBeats || !this.projectName.value) return;

        // Always send write heartbeats
        if(!isWrite && Date.now() - this.lastHeartbeatTime < this.rateLimitSeconds * 1000) {
            return;
        }

        // Make sure totalbeats, mousebeat, and mouseline are all finite integers with reasonable values before sending heartbeat
        if(!Number.isFinite(this.totalBeats) || !Number.isInteger(this.totalBeats) || this.totalBeats < 0) {
            console.warn("Wakatime: invalid totalBeats", this.totalBeats);
            return;
        }
        if(!Number.isFinite(this.mouseBeat) || !Number.isInteger(this.mouseBeat) || this.mouseBeat < 0) {
            console.warn("Wakatime: invalid mouseBeat", this.mouseBeat);
            return;
        }
        if(!Number.isFinite(this.mouseLane) || !Number.isInteger(this.mouseLane) || this.mouseLane < 0) {
            console.warn("Wakatime: invalid mouseLane", this.mouseLane);
            return;
        }

        this.lastHeartbeatTime = Date.now();

        const hb: Heartbeat = {
            entity: this.filename,
            lines: this.totalBeats,
            type: "file",
            
            lineno: this.mouseBeat,
            cursorpos: this.mouseLane,
            language: "SlideTapMap",

            project: this.projectName.value,

            is_write: isWrite
        };

        console.log("Wakatime: sending heartbeat", hb);
        this.wakatime.sendHeartbeat(hb);
    }
}

/**
 * https://wakatime.com/help/creating-plugin#plugin-overview
 */
export class WakatimeWrapper {
    private apiKey: string;
    private userAgent: string;
    private apiUrl: string;

    constructor(opts: WakaTimeOptions) {
        this.apiKey = opts.apiKey;
        // The user agent pattern is /wakatime\/[^ ]+ \(([^)]+)\)(?: [^ ]+ ([^\/]+)(?:\/([^\/]+))?)?/
        // matches are [full match, os (first part before "-"), editor, ...]
        // e.g. "wakatime/1.0 (Windows) - VSCode/1.75.1" would match with os=Windows, editor=VSCode
        // i'm not sure why there needs to be that - (or any non-space character) in there? but we just put whatever there
        this.userAgent = `wakatime/1.0 (${this.detectOS()}) - ${opts.editor}/${opts.version ?? "unknown"}`;
        this.apiUrl = opts.apiUrl ?? "https://api.wakatime.com/api/v1";
    }

    public setApiKey(key: string) {
        this.apiKey = key;
    }
    public setApiUrl(url: string) {
        this.apiUrl = url;
    }

    private detectOS(): string {
        const platform = navigator.platform.toLowerCase();
        if(platform.includes("win")) {
            return "Windows";
        }
        if(platform.includes("mac")) {
            return "macOS";
        }
        if(platform.includes("linux")) {
            return "Linux";
        }
        return "Unknown";
    }

    /** https://wakatime.com/developers#heartbeats */
    public async sendHeartbeat(hb: Heartbeat): Promise<void> {
        const body = {
            ...hb,
            time: hb.time ?? Date.now() / 1000,
            user_agent: this.userAgent // fallback for browsers that don't respect custom user agent per https://github.com/hackclub/hackatime/blob/b915f6d4d97432770aa7ab7d08e68b48cf928659/app/controllers/api/hackatime/v1/hackatime_controller.rb#L268
        };

        try {
            await fetch(`${this.apiUrl}/users/current/heartbeats?api_key=${this.apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": this.userAgent
                },
                body: JSON.stringify(body)
            });
        } catch(e) {
            console.warn("Wakatime: failed to send heartbeat", e);
        }
    }

    /** https://wakatime.com/developers#heartbeats */
    public async sendHeartbeatsBulk(heartbeats: Heartbeat[]): Promise<void> {
        if(heartbeats.length > 25) {
            for(let i = 0; i < heartbeats.length; i += 25) {
                await this.sendHeartbeatsBulk(heartbeats.slice(i, i + 25));
            }
        }

        const payload = heartbeats.map(h => ({
            ...h,
            time: h.time ?? Date.now() / 1000,
            user_agent: this.userAgent // fallback for browsers that don't respect custom user agent
        }));

        await fetch(`${this.apiUrl}/users/current/heartbeats.bulk?api_key=${this.apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": this.userAgent
            },
            body: JSON.stringify(payload)
        });
    }
}