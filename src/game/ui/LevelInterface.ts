import { Renderer } from "../Renderer";
import { GameNode, NodeID } from "../types";
import * as THREE from "three";
import { ColumnFlexContainer, ContainerNode, MarginContainer, OffsetContainer, RowFlexContainer, StackContainer } from "./containerNodes";
import { AlignMode, EmptyNode, UINode } from "./UINode";
import { Panel, PanelNode } from "./PanelNode";
import { TextNode } from "./TextNode";
import { DebugPanel } from "./DebugPanel";
import { ProgressBarNode } from "./ProgressBarNode";
import { ColorGradient } from "./color";
import type { Timer } from "../Timer";

export class LevelInterface extends GameNode {
    private get ui(): CanvasRenderingContext2D | null {
        return this.root.get<Renderer>(NodeID.Renderer)?.ui || null;
    }

    private getCSSVariable(varName: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    constructor() {
        super(null);

        const textColor = this.getCSSVariable('--text');
        
        const surfaceColor = this.getCSSVariable('--surface');
        const sectionColor = this.getCSSVariable('--section');
        const panelColor = this.getCSSVariable('--panel');

        const surfaceGreen = this.getCSSVariable('--surface-green');
        const surfaceRed = this.getCSSVariable('--surface-red');
        const surfaceBlue = this.getCSSVariable('--surface-blue');
        
        const panel = new Panel()
            .withBackgroundColor(panelColor)
            .withShadow(sectionColor, 0, 6, 6);
        
        const healthGradient = new ColorGradient()
            .addStop(0, surfaceRed)
            .addStop(0.5, surfaceGreen)
            .addStop(0.8, surfaceGreen)
            .addStop(1, surfaceBlue);

        this.addChildren(
            new MarginContainer(12).with(
                // Health bar
                new StackContainer().with(
                    new ProgressBarNode(surfaceColor, healthGradient)
                        .withTargetSize(400, 25)
                        .withUpdate((self, _) => {
                            self.setProgress(this.context?.health ? this.context.health / 100 : 0);
                        })
                        .inside(new MarginContainer(4))
                        .inside(new PanelNode(panel)),
                    new TextNode("Health", textColor)
                        .withOutline(panelColor, 6)
                        .withFont("16px Helvetica")
                        .inside(new OffsetContainer(0, -12)),
                    new TextNode("100%")
                        .withFont("24px monospace")
                        .withOutline(panelColor, 6)
                        .withHorizontalAlign(AlignMode.End)
                        .withUpdate((self, _) => self.text = `${this.context?.health ?? 0}%`)
                        .inside(new OffsetContainer(0, -6).withHorizontalAlign(AlignMode.End)),
                ),

                // Score
                new ColumnFlexContainer().withHorizontalAlign(AlignMode.End).with(
                    new StackContainer().withTargetSize(180, 0).withHorizontalAlign(AlignMode.End).with(
                        new TextNode("0", textColor)
                            .withOutline(sectionColor, 8)
                            .withFont("32px monospace")
                            .withHorizontalAlign(AlignMode.End)
                            .withMargin(12)
                            .withUpdate((self, _) => {
                                // Format like 000,000
                                const padded = (this.context?.score ?? 0).toString().padStart(6, "0");
                                self.text = padded.slice(0, 3) + "," + padded.slice(3);
                            })
                            .inside(new MarginContainer(0, 0, 12, 4).withHorizontalAlign(AlignMode.Stretch))
                            .inside(new PanelNode(panel).withHorizontalAlign(AlignMode.Stretch)),
                        new TextNode("Score", textColor)
                            .withOutline(panelColor, 6)
                            .withFont("16px Helvetica")
                            .inside(new OffsetContainer(0, -12))
                    ),

                    new EmptyNode().withTargetSize(0, 18), // Spacer
                
                    // Combo
                    new StackContainer().withTargetSize(160, 0).withHorizontalAlign(AlignMode.End).with(
                        new PanelNode(panel).withHorizontalAlign(AlignMode.Stretch).with(
                            new ColumnFlexContainer().withHorizontalAlign(AlignMode.Stretch).with(
                                new TextNode("0", textColor)
                                    .withOutline(sectionColor, 8)
                                    .withFont("28px monospace")
                                    .withHorizontalAlign(AlignMode.Center)
                                    .withMargin(12)
                                    .withUpdate((self, _) => self.text = `${this.context?.combo ?? 0}`)
                                    .inside(new MarginContainer(0, 0, 12, 0).withHorizontalAlign(AlignMode.Stretch)),
                                new TextNode("Max 0", textColor)
                                    .withFont("14px monospace")
                                    .withMargin(12)
                                    .withHorizontalAlign(AlignMode.Start)
                                    .withUpdate((self, _) => self.text = `Max ${this.context?.maxCombo ?? 0}`)
                            )
                        ),

                        new TextNode("Combo", textColor)
                            .withOutline(panelColor, 6)
                            .withFont("16px Helvetica")
                            .inside(new OffsetContainer(0, -12))
                    ),
                ),

                // Hit notes
                new RowFlexContainer().withHorizontalAlign(AlignMode.Stretch).withVerticalAlign(AlignMode.End).with(
                    // Level progress
                    new PanelNode(panel).withHorizontalAlign(AlignMode.Stretch).withFlex(1).with(
                        new ProgressBarNode(surfaceColor, new ColorGradient().addStop(0, surfaceBlue).addStop(1, surfaceGreen))
                            .withUpdate((self, _) => {
                                self.setProgress((this.get<Timer>(NodeID.Timer)?.getElapsed() ?? 0) / (this.context?.song?.length ?? 1));
                            })
                    ),
                    new PanelNode(panel).with(
                        new TextNode("0/0", textColor).withFont("14px monospace").withMargin(16).withUpdate((self, _) => {
                            const game = this.context;
                            if(!game) return;
                            self.text = `${game.hitNotes}/${game.totalNotes} Notes`;
                        })
                    )
                ),
                
                // Debug text
                new PanelNode(panel).withHorizontalAlign(AlignMode.End).withVerticalAlign(AlignMode.End).with(
                    new TextNode("Debug Text?", textColor).setId("debugText")
                ).setId("debugPanel").withHidden(true)
            )//.inside(new DebugPanel())
        );
    }

    update(deltaTime: number): void {
        if(!this.ui) return;

        // TODO: Node-based UI

        this.ui.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

        const game = this.context;
        if(!game) return;
        if(game.controlledByEditor) return;
        
        const screenWidth = this.ui.canvas.width / devicePixelRatio, screenHeight = this.ui.canvas.height / devicePixelRatio;
        for(const child of this.children) {
            if(child instanceof UINode) {
                if(child.width != screenWidth || child.height != screenHeight) child.setNeedsRelayout();
                child.width = screenWidth;
                child.height = screenHeight;
                child.layout();
                child.render(this.ui);
            }
        }
        
        // // Health bar
        // const barWidth = 300, barHeight = 24;
        // const healthX = 20, healthY = 20;
        // this.ui.save();
        // this.ui.globalAlpha = 0.8;
        // this.ui.fillStyle = surfaceColor;
        // this.ui.fillRect(healthX, healthY, barWidth, barHeight);
        // this.ui.fillStyle = game.health > 30 ? surfaceGreen : surfaceRed;
        // this.ui.fillRect(healthX, healthY, (game.health / 100) * barWidth, barHeight);
        // this.ui.strokeStyle = textColor;
        // this.ui.lineWidth = 2;
        // this.ui.strokeRect(healthX, healthY, barWidth, barHeight);
        // this.ui.globalAlpha = 1;
        // this.ui.restore();

        // // Score and combo
        // this.ui.font = "16px Inter, Avenir, Helvetica, Arial, sans-serif";
        // this.ui.fillStyle = textColor;
        // this.ui.textBaseline = "top";
        // this.ui.fillText(`Score: ${game.score}%`, healthX, healthY + barHeight + 10);
        // this.ui.fillText(`Combo: ${game.combo}`, healthX, healthY + barHeight + 32);

        // // Debug text
        // if(this.debugTextValue !== null) {
        //     this.ui.font = "12px Inter, Avenir, Helvetica, Arial, sans-serif";
        //     this.ui.fillStyle = this.getCSSVariable('--text-dim');
        //     this.ui.textBaseline = "top";
        //     this.ui.fillText(this.debugTextValue, 10, this.ui.canvas.height - 30);
        // }
    }

    public debugText(value: string | number | THREE.Vector3 | null) {
        if(value instanceof THREE.Vector3) {
            value = `(${value.x.toFixed(2)}, ${value.y.toFixed(2)}, ${value.z.toFixed(2)})`;
        }
        if(typeof value === "number") {
            value = value.toFixed(3);
        }

        const panelNode = this.get<PanelNode>("debugPanel")!;
        panelNode.hidden = value === null;
        if(value === null) return;

        const textNode = this.get<TextNode>("debugText")!;
        textNode.text = value;
        textNode.setNeedsRelayout();
    }
}