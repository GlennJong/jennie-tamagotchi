import Phaser from 'phaser';

const defaultWidth = 72;
const defaultHeight = 24;
const paddingX = 4;
const paddingY = 4;

const hpFrameWidth = 60;
const hpFrameHeight = 6;

const textFontFamily = 'BoutiqueBitmap';
const textFontSize = 10;
const textFontResolution = 4;

const playerNameY = -2;
const barY = 10;

export type TStatusBoardProps = {
  name: string;
  hp: {
    current: number;
    max: number;
  };
  // hp: number,
  // max_hp: number
};

export class StatusBoard extends Phaser.GameObjects.Container {
  private hp: { current: number; max: number };
  private hpBar: Phaser.GameObjects.Sprite;
  private hpBarWidth: number;
  private currentHpText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    data: TStatusBoardProps,
  ) {
    // step1. Inherite from scene & set hp value
    super(scene);
    this.hp = {
      current: data.hp.current,
      max: data.hp.current,
    };


    // step2. init background
    const background = scene.make
      .nineslice({
        key: 'battle_board',
        frame: 'background',
        width: defaultWidth,
        height: defaultHeight,
        leftWidth: 3,
        rightWidth: 3,
        topHeight: 3,
        bottomHeight: 3,
      })
      .setOrigin(0.5)
      .setPosition(x, y);
    this.add(background);

    // step3. init status board data
    const hpBarHead = scene.make.sprite({
      key: 'battle_board',
      frame: 'bar-head',
    });
    hpBarHead.setPosition(
      x - defaultWidth / 2 + paddingX + hpBarHead.width / 2,
      y - defaultHeight / 2 + paddingY + barY + hpBarHead.height / 2,
    );

    const hpFrame = scene.make
      .nineslice({
        key: 'battle_board',
        frame: 'bar-frame',
        width: defaultWidth - paddingX * 2 - hpBarHead.width,
        height: hpFrameHeight,
        leftWidth: 2,
        rightWidth: 2,
        topHeight: 2,
        bottomHeight: 2,
        x: x - defaultWidth / 2 + paddingX + hpBarHead.width,
        y: y - defaultHeight / 2 + paddingY + barY,
      })
      .setOrigin(0);

    // step4. init hp bar
    const hpBar = scene.make
      .sprite({
        key: 'battle_board',
        frame: 'bar',
        x: x - defaultWidth / 2 + paddingX + hpBarHead.width + 1,
        y: y - defaultHeight / 2 + paddingY + barY + 2,
      })
      .setOrigin(0);

    this.hpBarWidth = hpFrameWidth - hpBarHead.width / 2 - paddingX - 3;
    hpBar.displayWidth = (this.hp.current / this.hp.max) * this.hpBarWidth;
    this.hpBar = hpBar;

    this.add(hpFrame);
    this.add(hpBar);
    this.add(hpBarHead);

    // 5. player name
    const playerName = scene.make.text({
      x: x - defaultWidth / 2 + paddingX,
      y: y - defaultHeight / 2 + paddingY + playerNameY,
      style: {
        fontFamily: textFontFamily,
        fontSize: textFontSize,
        color: '#000',
      },
      text: data.name,
    });
    playerName.setResolution(textFontResolution);
    this.add(playerName);

    // 5. hp number
    // const currentHPText = scene.make.text({
    //     x: x - (defaultWidth/2) + paddingX,
    //     y: y - (defaultHeight/2) + paddingY + hpTextY,
    //     style: { fontFamily: numberFontFamily, fontSize: numberFontSize, color: '#000' },
    //     text: this.hp.toString(),
    // });
    // currentHPText.setResolution(numberFontResolution);
    // this.add(currentHPText);
    // this.currentHpText = currentHPText;

    // const slash = scene.make.text({
    //     x: x, // at center
    //     y: y - (defaultHeight/2) + paddingY + hpTextY,
    //     style: { fontFamily: numberFontFamily, fontSize: numberFontSize, color: '#000' },
    //     text: '/',
    // });
    // slash.setResolution(numberFontResolution);

    // this.add(slash);

    // const maxHPText = scene.make.text({
    //     x: x + (defaultWidth/2) - paddingX,
    //     y: y - (defaultHeight/2) + paddingY + hpTextY,
    //     style: { fontFamily: numberFontFamily, fontSize: numberFontSize, color: '#000' },
    //     text: this.hp.max.toString(),
    // }).setOrigin(1, 0);

    // maxHPText.setResolution(numberFontResolution);

    // this.add(maxHPText);

    scene.add.existing(this);
  }

  // define hp action for every frame animation
  private currentHpAction?: {
    from: { hp: number };
    to: { hp: number };
    callback: () => void;
  };

  private currentUpdateFrame = { total: 60, count: 0 };

  private handleSetHP(value: number, callbackFunc: () => void) {
    if (!this.currentHpAction) {
      const resultHp = value;
      this.currentHpAction = {
        from: { hp: this.hp.current },
        to: { hp: resultHp < 0 ? 0 : resultHp },
        callback: callbackFunc,
      };
    }
  }

  public setHP(value: number): Promise<void> {
    return new Promise((resolve) => {
      this.handleSetHP(value, () => {
        resolve();
      });
    });
  }

  public updateStatusBoard() {
    if (this.currentHpAction) {
      // Start count the frames
      this.currentUpdateFrame.count += 1;

      // movement
      const { from, to } = this.currentHpAction;
      const { total, count } = this.currentUpdateFrame;

      const point = from.hp + ((to.hp - from.hp) * count) / total;

      this.hp.current = Math.floor(point);
      this.hpBar.displayWidth =
        (this.hp.current / this.hp.max) * this.hpBarWidth;
      // if (this.currentHpText) {
      //     this.currentHpText.setText(this.hp.toString());
      // }

      if (total == count) {
        this.hp.current = to.hp;
        this.hpBar.displayWidth =
          (this.hp.current / this.hp.max) * this.hpBarWidth;
        // this.currentHpText.setText(this.hp.toString());

        // reset after moved
        this.currentHpAction.callback();
        this.currentHpAction = undefined;
        this.currentUpdateFrame.count = 0;
      }
    }
  }
}
