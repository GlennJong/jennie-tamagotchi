import { EventBus } from '../../EventBus';
import Phaser, { Scene } from 'phaser';
import { canvas } from '../../constants';
import { PrimaryDialogue } from '../../components/PrimaryDialogue';
import { Header } from './Header';
import { TamagotchiCharacter } from './TamagotchiCharacter';
import { RoomWindow } from './RoomWindow';
import { RoomRecorder } from './RoomRecorder';
import { sceneConverter, sceneStarter } from '../../components/CircleSceneTransition';
import { CustomDecroation } from './CustomDecroation';

type TInheritData = {
  hp: number;
  mp: number;
};

const WINDOW_POSITION = { x: 80, y: 32 };
const RECORDER_POSITION = { x: 26, y: 62 }
const DEFAULT_STATUS = {
  coin: 10,
  level: 1
}

const DEFAULT_TAMAGOTCHI = {
  x: 80,
  y: 84,
  edge: { from: 50, to: 120 }
}

export default class Room extends Scene {
  character: Phaser.GameObjects.Sprite | undefined;
  camera: Phaser.Cameras.Scene2D.Camera | undefined;
  header: Header | undefined;
  keyboardInputer?: Phaser.Types.Input.Keyboard.CursorKeys;

  storage: any;

  private property: {
    coin: number,
    level: number,
  } | undefined

  private tamagotchi: TamagotchiCharacter | undefined;

  constructor() {
    super('Room');
  }
  init(data: TInheritData) {
    this.handleRenderScene(this, data);
  }
  preload() {}
  create() {
    this.camera = this.cameras.main;
    this.camera.setBackgroundColor(0xff0000);

    sceneStarter(this);

    // interact from outside
    EventBus.on('message', this.handleCatchTwitchMessage);
  }

  private dialogue: PrimaryDialogue | undefined;
  private functionalActionQueue: { user: string; action: string }[] = [];

  private handleRenderScene(scene: Phaser.Scene, data: TInheritData) {
    this.storage = data || {};

    
    // Room Background
    const background = scene.make.image({
      key: 'tamagotchi_room',
      frame: 'room',
      x: canvas.width / 2,
      y: canvas.height / 2,
    });
    scene.add.existing(background);

    // Window
    new RoomWindow(scene, WINDOW_POSITION);

    // Recorder
    new RoomRecorder(scene, RECORDER_POSITION);

    // Custom Decroation
    new CustomDecroation(scene, 'front');

    // Dialogue
    const dialogue = new PrimaryDialogue(scene);
    this.dialogue = dialogue;

    // Header Block
    this.header = new Header(scene);

    // Build Tamagotchi Charactor
    this.tamagotchi = new TamagotchiCharacter(scene, {
      ...DEFAULT_TAMAGOTCHI,
      hp: this.storage?.tamagotchi?.hp || undefined, // get hp from storage or not
      callbackFunctions: {
        onHpChange: async (value: number) => {
          if (value === 0) {
            this.property.coin -= 10;
            this.header?.showHeader();
            this.header?.setValue({ coin: this.property.coin });
            await this.dialogue?.runDialog([
              { face: {
                  key: 'tamagotchi_character_afk',
                  frame: 'face_sad'
                },
                text: '啊我死了... 要記得幫我補充能量...'
              }
            ]);
            
          }
          this.header?.setValue({ hp: value })
        },
      },
    });

    // inherit room status
    const currentStatus = this.storage?.status || DEFAULT_STATUS;
    this.property = currentStatus;

    // apply hp
    this.header.setValue({ hp: this.tamagotchi.status.hp, coin: this.property?.coin });

    // get more money after win battle
    if (this.storage?.battle === 'win' && this.property) {
      this.property.coin += 100;
      this.header.setValue({ coin: this.property.coin });
    }

    if (this.storage?.queue) {
      this.functionalActionQueue = this.storage.queue;
    } 

    // Add keboard inputer
    this.keyboardInputer = scene.input.keyboard?.createCursorKeys();

    
    this.isFunctionalRunning = false; // TODO
  }

  private isFunctionalRunning: boolean = false;

  

  private handleFunctionalActionQueue = async () => {
    this.isFunctionalRunning = true;
    const currentActionQuene = this.functionalActionQueue[0];

    const _run = async () => {
      const { action, user} = currentActionQuene;

      let currentAction = action;
      
      if (
        action === 'battle' ||
        action === 'battle-shangshang' || 
        action === 'battle-beibei'
      ) {
        currentAction = 'battle';
      }
      
      const result = this.tamagotchi?.runFuntionalAction(currentAction);

      if (result) {
        const currentDialog = result.dialog.map((_item) => {
          return {
            ..._item,
            text: _item.text.replaceAll('{{user_name}}', user),
          };
        });
        this.header && this.header.showHeader(5000);

        await this.dialogue?.runDialog(currentDialog);

        // Special move for battle
        if (
          action === 'battle' ||
          action === 'battle-shangshang' || 
          action === 'battle-beibei'
        ) {
          let opponent;
          if (action === 'battle-shangshang') {
            opponent = Math.random() > 0.25 ? 'shangshang' : 'default';
          } else if (action === 'battle-beibei') {
            opponent = Math.random() > 0.25 ? 'beibei' : 'default';
          } else if (action === 'battle') {
            opponent = Math.random() > 0.25 ? 'jennie' : 'default';
          }

          if (user === 'curry_cat') {
            opponent = 'currycat';
          } else if (user === 'touching0212') {
            opponent = 'touching';
          } else if (user === 'bloloblolo') {
            opponent = 'bbb';
          }

          if (opponent) {
            this.isFunctionalRunning = false;
            sceneConverter(this, 'Battle', {
              opponent,
              queue: this.functionalActionQueue,
              tamagotchi: this.tamagotchi?.status,
              property: this.property
            });
          }
        }

        // Finish action and remove from queue
        this.functionalActionQueue.splice(0, 1);
        console.log('remove', this.functionalActionQueue)
        
      }
      this.isFunctionalRunning = false;
    };

    _run();
  };

  controller(input: string) {
    console.log(input);
    // this.tamagotchi.manualContolAction(input);
  }

  private keyboardflipFlop = { left: false, right: false, space: false };

  private async handleHeaderAction(action: string) {
    const user = 'jennie';
    this.functionalActionQueue.push({ user, action });
  }

  private handleCatchTwitchMessage = async ({ user, message } : { user: string, message: string }) => {
    console.log('catch_room')
    let action;
    if (message === '上上打招呼') {
      action = 'battle-shangshang'
    }
    if (message === '貝貝打招呼') {
      action = 'battle-beibei'
    }
    else if (message === '補充水分') {
      action = 'drink'
    }
    else if (message === '提醒大家存檔') {
      action = 'write'
    }

    if (action) {
      this.functionalActionQueue.push({ user, action });
    }

    if (message === 'dead') {
      if (this.tamagotchi) {
        console.log('work')
        this.tamagotchi.status.hp = 3
      }
    }
    else if (message === 'live') {
      if (this.tamagotchi) {
        console.log('work2')

        this.tamagotchi.status.hp = 100
      }
    }
  }

  update(time: number) {
    // if (this.functionalActionQueue.length !== 0 && !this.isFunctionalRunning) {
    // console.log(this.isFunctionalRunning);
    if (this.functionalActionQueue.length !== 0 && !this.isFunctionalRunning) {
      this.handleFunctionalActionQueue();
    }

    // movement controller
    this.header?.statusHandler();
    this.tamagotchi?.characterHandler(time);

    // temp Controller
    if (this.keyboardInputer) {
      // this.header.setAlpha(1);
      if (this.keyboardInputer.left.isDown) {
        if (this.keyboardflipFlop.left) return;
        this.header?.moveToPreviousSelector();
        this.keyboardflipFlop.left = true;
      } else if (
        this.keyboardflipFlop.left &&
        this.keyboardInputer['left'].isUp
      ) {
        this.keyboardflipFlop.left = false;
      }

      if (this.keyboardInputer['right'].isDown) {
        if (this.keyboardflipFlop.right) return;
        this.header?.moveToNextSelector();
        this.keyboardflipFlop.right = true;
      } else if (
        this.keyboardflipFlop.right &&
        this.keyboardInputer['right'].isUp
      ) {
        this.keyboardflipFlop.right = false;
      }

      if (this.keyboardInputer['space'].isDown) {
        if (this.keyboardflipFlop.space) return;
        if (this.header) {
          this.handleHeaderAction(this.header.currentSelector);
        }
        this.keyboardflipFlop.space = true;
      } else if (
        this.keyboardflipFlop.space &&
        this.keyboardInputer['space'].isUp
      ) {
        this.keyboardflipFlop.space = false;
      }
    }
  }
}
