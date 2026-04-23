import { Lanes } from "../Lanes";
import { BaseNote } from "./BaseNote";

export class TapNote extends BaseNote {
    private didTap = false;

    protected handleHitLogic(elapsed: number): void {
        // N/A update logic
    }

    public handleCursorTap(): void {
        if(this.cursorWithinNote() && this.noteWithinDistance(5)) {
            this.didTap = true;
            this.context?.onNoteHit();
        }
    }

    protected noteEndLogic(): void {
        if(!this.didTap) {
            this.context?.onNoteMiss();
        }
    }
}

export class HoldNote extends BaseNote {
    private missed = false;

    protected handleHitLogic(elapsed: number): void {
        if(this.missed) return;

        if(this.noteWithinDistance(2)) {
            const cursorWithin = this.cursorWithinNote();
            if(!cursorWithin) {
                this.context?.onNoteMiss();
                this.missed = true;
            }
        }
    }

    protected noteEndLogic(): void {
        if(!this.missed) {
            this.context?.onNoteHit();
        }
    }
}

export class DamageNote extends BaseNote {
    private damaged: boolean = false;

    protected handleHitLogic(elapsed: number): void {
        if(this.damaged) return;

        if(this.noteWithinDistance(-2) && this.cursorWithinNote()) {
            this.context?.onNoteMiss();
            this.damaged = true;
        }
    }
}