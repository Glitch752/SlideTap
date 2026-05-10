import { Renderer } from "../Renderer";
import { GameNode, NodeID } from "../types";
import * as THREE from "three";
import { ColumnFlexContainer, MarginContainer, OffsetContainer, RowFlexContainer, StackContainer } from "./containerNodes";
import { AlignMode, UINode } from "./UINode";
import { Panel, PanelNode } from "./PanelNode";
import { TextNode } from "./TextNode";
import { ProgressBarNode } from "./ProgressBarNode";
import { ColorGradient, RGBAColor } from "../../lib/color";
import type { Timer } from "../Timer";
import type { GameScene } from "../Game";
import { TextEventDisplay } from "./TextEventDisplay";

export class LevelInterface extends GameNode {
    private get ui(): CanvasRenderingContext2D | null {
        return this.root.get<Renderer>(NodeID.Renderer)?.ui || null;
    }

    private getCSSVariable(varName: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    private panelColor = this.getCSSVariable('--panel');

    constructor(inEditor: boolean) {
        super(null);

        const textColor = this.getCSSVariable('--text');
        
        const surfaceColor = this.getCSSVariable('--surface');
        const sectionColor = this.getCSSVariable('--section');
        const panelColor = this.panelColor;

        const surfaceGreen = this.getCSSVariable('--surface-green');
        const surfaceRed = this.getCSSVariable('--surface-red');
        const surfaceBlue = this.getCSSVariable('--surface-blue');
        
        const panel = new Panel()
            .withBackgroundColor(panelColor)
            .withShadow(sectionColor, 0, 4, 4);
        
        const healthGradient = new ColorGradient()
            .addStop(0, surfaceRed)
            .addStop(0.5, surfaceGreen)
            .addStop(0.8, surfaceGreen)
            .addStop(1, surfaceBlue);
        
        let timer: Timer | undefined;

        this.addChildren(
           new MarginContainer(12).with(
                // Health bar
                inEditor ? null : new StackContainer().with(
                    new ProgressBarNode(surfaceColor, healthGradient)
                        .withTargetSize(400, 25)
                        .withUpdate((self, _) => {
                            self.setProgress(this.context?.score.health ? this.context.score.health / 100 : 0);
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
                        .withUpdate((self, _) => self.setText(`${this.context?.score.health ?? 0}%`))
                        .inside(new OffsetContainer(0, -6).withHorizontalAlign(AlignMode.End)),
                ),

                // Score
                inEditor ? null : new ColumnFlexContainer(18).withHorizontalAlign(AlignMode.End).with(
                    new StackContainer().withTargetSize(180, 0).withHorizontalAlign(AlignMode.End).with(
                        new TextNode("0", textColor)
                            .withOutline(sectionColor, 8)
                            .withFont("32px monospace")
                            .withHorizontalAlign(AlignMode.End)
                            .withMargin(16)
                            .withUpdate((self, _) => {
                                // Format like 000,000
                                const padded = (this.context?.score.score ?? 0).toString().padStart(6, "0");
                                self.setText(padded.slice(0, 3) + "," + padded.slice(3));
                            })
                            .inside(new MarginContainer(0, 0, 8, 2).withHorizontalAlign(AlignMode.Stretch))
                            .inside(new PanelNode(panel).withHorizontalAlign(AlignMode.Stretch)),
                        new TextNode("Score", textColor)
                            .withOutline(panelColor, 6)
                            .withFont("16px Helvetica")
                            .inside(new OffsetContainer(0, -12))
                    ),
                
                    // Combo
                    new StackContainer().withTargetSize(120, 0).withHorizontalAlign(AlignMode.End).with(
                        new PanelNode(panel).withHorizontalAlign(AlignMode.Stretch).with(
                            new ColumnFlexContainer().withHorizontalAlign(AlignMode.Stretch).with(
                                new TextNode("0", textColor)
                                    .withOutline(sectionColor, 8)
                                    .withFont("48px monospace")
                                    .withHorizontalAlign(AlignMode.Center)
                                    .withMargin(12)
                                    .withUpdate((self, _) => self.setText(`${this.context?.score.combo ?? 0}`))
                                    .inside(new MarginContainer(0, 0, 12, 8).withHorizontalAlign(AlignMode.Stretch)),
                                new TextNode("Max 0", textColor)
                                    .withFont("14px monospace")
                                    .withMargin(12)
                                    .withHorizontalAlign(AlignMode.Center)
                                    .withUpdate((self, _) => self.setText(`Max ${this.context?.score.maxCombo ?? 0}`))
                            )
                        ),

                        new TextNode("Combo", textColor)
                            .withOutline(panelColor, 6)
                            .withFont("16px Helvetica")
                            .inside(new OffsetContainer(0, -12))
                    ),
                ),

                // Hit notes
                new RowFlexContainer(12).withHorizontalAlign(AlignMode.Stretch).withVerticalAlign(AlignMode.End).with(
                    new PanelNode(panel).with(
                        new TextNode("0:00 / 0:00", textColor).withFont("14px monospace").withUpdate((self, _) => {
                            if(!timer) timer = this.root.get<Timer>(NodeID.Timer);
                            const formatTime = (t: number) => {
                                const minutes = Math.floor(t / 60);
                                const seconds = Math.floor(t % 60);
                                return `${minutes}:${seconds.toString().padStart(2, "0")}`;
                            }
                            if(timer) self.setText(`${formatTime(timer.getElapsed())} / ${this.context?.song ? formatTime(this.context.song.length) : "0:00"}`);
                        })
                    ),

                    // Level progress
                    new ProgressBarNode(
                        RGBAColor.parse(surfaceColor).withA(0.5).toRGBAString(),
                        new ColorGradient()
                            .addStop(0, RGBAColor.parse(surfaceBlue).withA(0.5))
                            .addStop(1, RGBAColor.parse(surfaceGreen).withA(0.5))
                    )
                        .withHorizontalAlign(AlignMode.Stretch)
                        .withVerticalAlign(AlignMode.End)
                        .withFlex(1)
                        .withTargetSize(0, 16)
                        .withProgress(0)
                        .withUpdate((self, _) => {
                            if(timer) self.setProgress(timer.getElapsed() / (this.context?.song?.length ?? 1));
                        }),
                    inEditor ? null : new PanelNode(panel).with(
                        new TextNode("0/0", textColor).withFont("14px monospace").withUpdate((self, _) => {
                            const game = this.context;
                            if(!game) return;
                            self.setText(`${game.score.hitNotes}/${game.score.totalScoringNotes} Notes`);
                        })
                    )
                ),

                // Text events
                new MarginContainer(0, 0, 80, 0)
                .withHorizontalAlign(AlignMode.Center)
                .withVerticalAlign(AlignMode.Start).with(
                    new ColumnFlexContainer(8).setId("textEventContainer")
                ),
                
                // Debug text
                new PanelNode(panel).withHorizontalAlign(AlignMode.End).withVerticalAlign(AlignMode.End).with(
                    new TextNode("Debug Text?", textColor).setId("debugText")
                ).setId("debugPanel").withHidden(true)
            ) //.inside(new DebugPanel())
        );
    }

    init(context: GameScene): void {
        context.onMapEvent.connect((event) => {
            if(event.type === "text") {
                this.get<ColumnFlexContainer>("textEventContainer")!.add(new TextEventDisplay(event, this.panelColor));
            }
        });
    }

    update(deltaTime: number): void {
        if(!this.ui) return;

        this.ui.clearRect(0, 0, this.ui.canvas.width, this.ui.canvas.height);

        const game = this.context;
        if(!game) return;
        
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
        textNode.setText(value);
    }
}