import { RichText } from "../../lib/RichText";
import type { MapEvent } from "../../Map";
import { Tween } from "../Tween";
import { RichTextNode } from "./RichTextNode";

export class TextEventDisplay extends RichTextNode {
    private event: MapEvent;
    
    constructor(event: MapEvent, outlineColor: string) {
        if(event.type !== "text") throw new Error("Invalid event type for TextEventDisplay: " + event.type);
        
        const text = new RichText(event.text);
        text.setFont("32px Helvetica");
        text.align = "center";
        super(text);
        
        this.event = event;

        this.opacity = 0;
        this.withTargetSize(500, 150);
        this.withOutline(outlineColor, 8)
    }

    init(): void {
        const fadeInTime = Math.min(0.2, this.event.duration / 2);
        const fadeOutTime = Math.min(1.0, this.event.duration / 2);
        const beatDuration = this.context?.song?.beatDuration ?? 1;
        this.add(new Tween()
            .interpolate(this, "opacity", 1, fadeInTime)
            .wait(this.event.duration * beatDuration - fadeInTime - fadeOutTime)
            .interpolate(this, "opacity", 0, fadeOutTime)
            .runCallback(() => this.removeFromParent())
        );
    }
}