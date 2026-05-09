type RichTextTextPart = {
    type: "text";
    text: string;
    props: Record<string, string | boolean>;
};
type RichTextPart = RichTextTextPart | {
    type: "newline";
};

/**
 * Rich text formatted with bracket tags, e.g. "[b][color=acred]Hello[/color] world[/b]"
 * Currently supports the following tags:
 * - [b]...[/b]: bold
 * - [i]...[/i]: italic
 * - [color=...]...[/color]: color, e.g. [color=red] or [color=#ff0000]
 * Font family and size are fixed for now. Newlines are supported.
 */
export class RichText {
    private text: string;
    private font: string = "20px Helvetica";
    public align: "left" | "center" | "right" = "left";

    private parts: RichTextPart[] = [];

    private cachedLines?: { parts: RichTextTextPart[], width: number }[];
    private cachedLineHeight?: number;

    public setAlign(align: "left" | "center" | "right"): this {
        this.align = align;
        return this;
    }
    public setFont(font: string): this {
        this.font = font;
        this.cachedLines = undefined; // Invalidate cache
        return this;
    }
    public setText(text: string): this {
        this.text = text;
        this.parse();
        this.cachedLines = undefined; // Invalidate cache
        return this;
    }

    constructor(text: string, font?: string) {
        this.text = text;
        this.font = font || "20px Helvetica";
        this.parse();
    }

    private pushText(text: string, props: Record<string, string | boolean>) {
        if(text.length === 0) return;

        // Split by newlines
        const lines = text.split(/(\n)/);
        for(const line of lines) {
            if(line === '\n') {
                this.parts.push({ type: "newline" });
            } else if(line.length > 0) {
                this.parts.push({ type: "text", text: line, props });
            }
        }
    }

    private static COLOR_SUBSTITUTIONS: Record<string, string> = {
        // Accent colors
        acred:   getComputedStyle(document.documentElement).getPropertyValue('--accent-red').trim(),
        acgreen: getComputedStyle(document.documentElement).getPropertyValue('--accent-green').trim(),
        acblue:  getComputedStyle(document.documentElement).getPropertyValue('--accent-blue').trim(),
        text:    getComputedStyle(document.documentElement).getPropertyValue('--text').trim()
    };
    private parseColor(value: string): string {
        value = value.toLowerCase();
        if(RichText.COLOR_SUBSTITUTIONS[value]) {
            return RichText.COLOR_SUBSTITUTIONS[value];
        }
        return value;
    }

    private parse() {
        const tagRegex = /\[(\/)?([a-z]+)(=([^\]]+))?\]/ig;
        const stack: { tag: string, props: Record<string, string | boolean> }[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        const applyProps = () => {
            // Merge props on stack
            const props: Record<string, string | boolean> = {};
            for(const s of stack) {
                Object.assign(props, s.props);
            }
            return props;
        };

        this.parts = [];
        
        while((match = tagRegex.exec(this.text))) {
            if(match.index > lastIndex) {
                this.pushText(this.text.substring(lastIndex, match.index), applyProps());
            }

            const closing = !!match[1];
            const tag = match[2].toLowerCase();
            const value = match[4];
            if(!closing) {
                // Opening tag
                let props: Record<string, string | boolean> = {};

                if(tag === "b") props.bold = true;
                else if(tag === "i") props.italic = true;
                else if(tag === "color" && value) props.color = this.parseColor(value);

                stack.push({ tag, props });
            } else {
                // Closing tag
                for(let i = stack.length - 1; i >= 0; --i) {
                    if(stack[i].tag === tag) {
                        stack.splice(i, 1);
                        break;
                    }
                }
            }

            lastIndex = tagRegex.lastIndex;
        }

        if(lastIndex < this.text.length) {
            this.pushText(this.text.substring(lastIndex), applyProps());
        }
    }

    private getFont(ctx: CanvasRenderingContext2D, props: Record<string, string | boolean>): string {
        let font = this.font;
        if(props.bold && props.italic) {
            font = font.replace(/^(\d+px )?/, "italic bold $1");
        } else if(props.bold) {
            font = font.replace(/^(\d+px )?/, "bold $1");
        } else if(props.italic) {
            font = font.replace(/^(\d+px )?/, "italic $1");
        }
        return font;
    }
    
    private computeLines(ctx: CanvasRenderingContext2D) {
        this.cachedLines = [];
        let currentLine: RichTextTextPart[] = [];
        let currentWidth = 0;
        let tempFont = ctx.font;
        const lineHeight = parseInt(this.font) * 1.2 || 24;
        const lines: { parts: RichTextTextPart[], width: number }[] = [];

        const measurePart = (part: RichTextTextPart) => {
            ctx.save();
            ctx.font = tempFont;
            if(part.props) {
                ctx.font = this.getFont(ctx, part.props);
            }
            const width = ctx.measureText(part.text ?? "").width;
            ctx.restore();
            return width;
        };

        for(const part of this.parts) {
            if(part.type === "newline") {
                lines.push({ parts: currentLine, width: currentWidth });
                currentLine = [];
                currentWidth = 0;
            } else {
                const w = measurePart(part);
                currentLine.push(part);
                currentWidth += w;
            }
        }
        if(currentLine.length > 0) {
            lines.push({ parts: currentLine, width: currentWidth });
        }

        this.cachedLines = lines;
        this.cachedLineHeight = lineHeight;
    }

    public measure(ctx: CanvasRenderingContext2D): { width: number, height: number } {
        ctx.font = this.font;

        if(!this.cachedLines) this.computeLines(ctx);
        const width = Math.max(...this.cachedLines!.map(l => l.width), 0);
        const height = (this.cachedLineHeight ?? 24) * this.cachedLines!.length;
        return { width, height };
    }

    public draw(ctx: CanvasRenderingContext2D, x: number, y: number, stroke: boolean = false): void {
        ctx.save();
        ctx.font = this.font;

        // Use cached lines if available, otherwise compute and cache them
        if(!this.cachedLines) this.computeLines(ctx);
        const lines = this.cachedLines!, lineHeight = this.cachedLineHeight!;

        let cursorY = y;
        for(const line of lines) {
            let cursorX = x;

            if(this.align === "center") {
                cursorX = x - line.width / 2;
            } else if(this.align === "right") {
                cursorX = x - line.width;
            }

            for(const part of line.parts) {
                const { text, props } = part;

                ctx.font = this.getFont(ctx, props);

                if(stroke) {
                    ctx.strokeText(text, cursorX, cursorY);
                } else {
                    if(props.color) {
                        ctx.fillStyle = props.color as string;
                    } else {
                        ctx.fillStyle = "#fff";
                    }
                    ctx.fillText(text, cursorX, cursorY);
                }

                const metrics = ctx.measureText(text);
                cursorX += metrics.width;
            }
            
            cursorY += lineHeight;
        }

        ctx.restore();
    }

    public toString(): string {
        return this.text;
    }

    public toHTMLString(): string {
        let html = "";
        for(const part of this.parts) {
            if(part.type === "newline") {
                html += "<br>";
            } else {
                let text = part.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                if(part.props.bold) text = `<b>${text}</b>`;
                if(part.props.italic) text = `<i>${text}</i>`;
                if(part.props.color) text = `<span style="color: ${part.props.color}">${text}</span>`;
                html += text;
            }
        }
        return html;
    }
}