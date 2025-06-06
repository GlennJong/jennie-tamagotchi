import Phaser from "phaser";
import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
import { canvas } from "../constants";
import { runTween } from "../utils/runTween";

export type TDialogData = {
  face: { key: string; frame: string };
  text: string;
};

const defaultAlign: { text: "left" | "center" | "right" } = {
  text: "left",
};

const typingMode = "page";

const defaultSpeechSpeed = 50;
const defaultStaticDelay = 1000;
const defaultDialogTransitionSpeed = 150;

const defaultHeight = 40;

const textBoxWidth = 110;
const textBoxHeight = defaultHeight - 4;
const textBoxFontSize = 10;
const textBoxFontFamily = "BoutiqueBitmap";
const textBoxSpacing = 4;

const defaultIconSize = 32;
const defaultIconSpacing = 4;

//
const defaultX = canvas.width / 2;
const defaultY = canvas.height - defaultHeight / 2;
const defaultWidth = canvas.width;

const defaultSpacingConfig = {
  iconBottom: -1,
  left: textBoxSpacing,
  right: textBoxSpacing,
  top: textBoxSpacing,
  bottom: textBoxSpacing,
  icon: defaultIconSpacing,
};

const maxChineseAmount = 8;

function converterFromai4vupwjp(input: string) {
  const result = [];
  let buffer = "";
  let chineseCount = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char.match(/[a-zA-Z\d]/)) {
      if (chineseCount > 0) {
        result.push(buffer);
        buffer = "";
        chineseCount = 0;
      }
      buffer += char;
    } else if (char.match(/[\u4e00-\uff1f]/)) {
      if (buffer.length > 0 && chineseCount === 0) {
        result.push(buffer);
        buffer = "";
      }
      buffer += char;
      chineseCount++;
      if (chineseCount === maxChineseAmount) {
        result.push(buffer);
        buffer = "";
        chineseCount = 0;
      }
    } else {
      if (buffer.length > 0) {
        result.push(buffer);
        buffer = "";
        chineseCount = 0;
      }
    }
  }

  if (buffer.length > 0) {
    result.push(buffer);
  }

  return result.join(" ");
}

export class PrimaryDialogue extends Phaser.GameObjects.Container {
  private _textBox: RexUIPlugin.TextBox;

  constructor(scene: Phaser.Scene) {
    // 1. Inherite from scene
    super(scene);
    this.scene = scene;

    // 2. Create others visual game objects
    const background = scene.make.nineslice({
      key: "dialogue_frame",
      frame: "frame",
      leftWidth: 8,
      rightWidth: 8,
      topHeight: 8,
      bottomHeight: 8,
    });

    const face = scene.make.sprite({
      key: "tamagotchi_character_afk",
      frame: "face_normal",
    });

    // 3. Create textBox
    const innerDialogue = scene.rexUI.add.BBCodeText(0, 0, "", {
      fixedWidth: textBoxWidth - textBoxSpacing * 2,
      fixedHeight: textBoxHeight - textBoxSpacing * 2,
      color: "#000",
      fontSize: `${textBoxFontSize}px`,
      fontFamily: textBoxFontFamily,
      padding: {
        top: textBoxSpacing,
        bottom: textBoxSpacing,
      },
      resolution: 3,
      wrap: {
        mode: "word",
        width: textBoxWidth - textBoxSpacing * 2,
      },
      maxLines: 2,
    });

    // high resolition would get bad performance on dialog animation.
    // innerDialogue.setResolution(2);

    const textBox = scene.rexUI.add
      .textBox({
        x: defaultX,
        y: defaultY,
        width: defaultWidth,
        height: defaultHeight,
        typingMode: typingMode,
        icon: face,
        iconSize: defaultIconSize,
        background,
        text: innerDialogue,
        expandTextWidth: false,
        expandTextHeight: false,
        space: defaultSpacingConfig,
        align: defaultAlign,
      })
      .setOrigin(0.5)
      .layout();

    // defined text box interaction
    textBox.setInteractive();

    // 4. Add all board element to scene.
    this.add(textBox); // container
    this._textBox = textBox; // dialog
    this._textBox.setScale(0);
    scene.add.existing(this); // board
  }
  private _runTextBox(data: TDialogData): Promise<void> {
    const { face, text } = data;
    return new Promise((resolve) => {
      this._textBox
        .on(
          "pointerdown",
          () => {
            if (this._textBox.isTyping) {
              this._textBox.stop(true);
            } else {
              if (this._textBox.isLastPage) {
                this._textBox.off("pointerdown");
                this._textBox.off("pageend");
                resolve();
              } else {
                this._textBox.typeNextPage();
              }
            }
          },
          this._textBox,
        )
        .on("pageend", () => {
          if (this._textBox.isLastPage) {
            this._textBox.off("pointerdown");
            this._textBox.off("pageend");
            setTimeout(() => {
              this._textBox.setText(""); // Clear content after dialog finish
              resolve();
            }, defaultStaticDelay);
          } else {
            setTimeout(() => {
              this._textBox.typeNextPage();
            }, defaultStaticDelay);
          }
        });
      this._textBox.start(converterFromai4vupwjp(text), defaultSpeechSpeed);
      if (face) {
        this._textBox.setIconTexture(face.key, face.frame);
      }
    });
  }

  private _startDialogs(data: TDialogData[]): Promise<void> {
    return new Promise((resolve) => {
      (async () => {
        for (let i = 0; i < data.length; i++) {
          await this._runTextBox(data[i]);
        }
        resolve();
      })();
    });
  }

  public async hide() {
    await runTween<RexUIPlugin.TextBox>(
      this._textBox,
      { scale: 0 },
      defaultDialogTransitionSpeed,
    );
    this.setVisible(false);
  }

  public async runDialog(contents: TDialogData[], alive?: boolean) {
    // 1. show dialogue container
    this.setVisible(true);

    // 2. run transition for opening dialog
    await runTween<RexUIPlugin.TextBox>(
      this._textBox,
      { scale: 1 },
      defaultDialogTransitionSpeed,
    );

    // 3. start dialogs
    await this._startDialogs(contents);

    if (!alive) {
      // 4. run transition for closing dialog
      this._textBox.stop();
      await runTween<RexUIPlugin.TextBox>(
        this._textBox,
        { scale: 0 },
        defaultDialogTransitionSpeed,
      );

      // 5. hide dialugue container
      this.setVisible(false);
    }

    return;
  }
}
