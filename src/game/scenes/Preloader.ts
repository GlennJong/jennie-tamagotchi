import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    //  We loaded this image in our Boot Scene, so we can display it here
    this.add.image(512, 384, 'background');

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress;
    });
  }

  private config = undefined;

  preload() {
    this.load.setPath('assets');
    this.load.json('config', 'config.json');
    this.load.font('BoutiqueBitmap', 'fonts/BoutiqueBitmap9x9.ttf', 'truetype');
    this.load.font('Tiny5', 'fonts/Tiny5-Regular.ttf', 'truetype');
    this.load.font('Cubic_11', 'fonts/Cubic_11.ttf', 'truetype');
    this.load.on('filecomplete-json-config', (_key: unknown, _type: unknown, data) => {
      const {
        battle_default_opponent,
        battle_beibei_opponent,
        battle_shangshang_opponent,
        battle_jennie_opponent,
        battle_bbb_opponent,
        battle_touching_opponent,
        battle_currycat_opponent,
        battle_afk_self,
        tamagotchi_room,
        tamagotchi_afk,
      } = data;
      this.config = data;

      // Battle Character
      this.load.atlas(
        battle_default_opponent.key,
        battle_default_opponent.preload.png,
        battle_default_opponent.preload.json,
      );
      this.load.atlas(
        battle_beibei_opponent.key,
        battle_beibei_opponent.preload.png,
        battle_beibei_opponent.preload.json,
      );
      this.load.atlas(
        battle_shangshang_opponent.key,
        battle_shangshang_opponent.preload.png,
        battle_shangshang_opponent.preload.json,
      );
      this.load.atlas(
        battle_jennie_opponent.key,
        battle_jennie_opponent.preload.png,
        battle_jennie_opponent.preload.json,
      );
      this.load.atlas(
        battle_bbb_opponent.key,
        battle_bbb_opponent.preload.png,
        battle_bbb_opponent.preload.json,
      );
      this.load.atlas(
        battle_touching_opponent.key,
        battle_touching_opponent.preload.png,
        battle_touching_opponent.preload.json,
      );
      this.load.atlas(
        battle_currycat_opponent.key,
        battle_currycat_opponent.preload.png,
        battle_currycat_opponent.preload.json,
      );
      this.load.atlas(
        battle_afk_self.key,
        battle_afk_self.preload.png,
        battle_afk_self.preload.json,
      );

      // Tamagotchi Character
      this.load.atlas(
        tamagotchi_room.key,
        tamagotchi_room.preload.png,
        tamagotchi_room.preload.json,
      );
      this.load.atlas(
        tamagotchi_afk.key,
        tamagotchi_afk.preload.png,
        tamagotchi_afk.preload.json,
      );

      // Tamagotchi
      // this.load.image('tamagotchi_header_frame', 'tamagotchi/header-frame.png');
      this.load.atlas(
        'tamagotchi_header_frame',
        'tamagotchi/header/frame.png',
        'tamagotchi/header/frame.json',
      );
      this.load.atlas(
        'tamagotchi_header_icons',
        'tamagotchi/header/icons.png',
        'tamagotchi/header/icons.json',
      );
      this.load.image('tamagotchi_room', 'tamagotchi/room.png');
      this.load.image('tamagotchi_room_desk', 'tamagotchi/desk.png');
      this.load.atlas(
        'tamagotchi_room_window',
        'tamagotchi/window/spritesheet.png',
        'tamagotchi/window/spritesheet.json',
      );
      this.load.atlas(
        'tamagotchi_room_recorder',
        'tamagotchi/recorder/spritesheet.png',
        'tamagotchi/recorder/spritesheet.json',
      );
      this.load.atlas(
        'tamagotchi_character_afk',
        'tamagotchi/character/spritesheet.png',
        'tamagotchi/character/spritesheet.json',
      );

      // Battle
      this.load.image('battle_background', 'battle/background.png');
      this.load.atlas('battle_board', 'battle/board.png', 'battle/board.json');
      this.load.atlas('battle_afk', 'battle/afk.png', 'battle/afk.json');

      // Dialogue
      this.load.atlas(
        'dialogue_frame',
        'dialogue/frame.png',
        'dialogue/frame.json',
      );

      this.load.image('background-room', 'background-room.png');
      this.load.image('transition-cover', 'transition-cover.png');
      this.load.atlas('frame', 'ui/frame.png', 'ui/frame.json');

    });
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start('Tamagotchi', this.config);
  }
}
