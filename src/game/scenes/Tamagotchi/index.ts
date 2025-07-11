import Phaser, { Scene } from 'phaser';
import { EventBus, getGlobalData, setGlobalData } from '../../EventBus';

import { PrimaryDialogue } from '../../components/PrimaryDialogue';
import { sceneConverter, sceneStarter } from '../../components/CircleSceneTransition';

import { Header } from './Header';
import { Property } from './Property';
import { TamagotchiCharacter } from './TamagotchiCharacter';
import KeyboardHandler from './KeyboardHander';

const DEFAULT_TAMAGOTCHI_POSITION = {
  x: 80,
  y: 84,
  edge: { from: 50, to: 120 }
}

const WIN_COIN = 10;
const LOSE_COIN = -5;

const DEFAULT_USER = 'user';
const HEADER_DISPLAY_DURATION = 10000;

export default class Tamagotchi extends Scene {
  private background: Phaser.GameObjects.Image;
  private header: Header;
  private property: Property;
  private character: TamagotchiCharacter;
  private dialogue: PrimaryDialogue;
  private keyboardHandler: KeyboardHandler;

  private actionQueue: { user: string; action: string }[] = [];
  private isStart: boolean = false;
  private isActionRunning: boolean = false;
  
  constructor() {
    super('Tamagotchi');
  }
  create() {
    // Build Background
    this.background = this.make.image({
      key: 'tamagotchi_room',
      frame: 'room',
      x: 160 / 2,
      y: 144 / 2,
    });
    this.add.existing(this.background);
    
    // Inherit queue or create new queue
    this.actionQueue = getGlobalData('tamagotchi_queue') || [];

    // Convert queue from message queue
    EventBus.on('message_queue-updated', this.handleConvertActionQueue);

    // handle update coin and level
    EventBus.on('tamagotchi_coin-updated', this.handleBuyDecoration);
    
    // Build Tamagotchi Charactor
    this.character = new TamagotchiCharacter(this, DEFAULT_TAMAGOTCHI_POSITION);

    // Build Property
    this.property = new Property(this);
    this.add.existing(this.property);

    // Build Header
    this.header = new Header(this);
    this.add.existing(this.header);

    // Build Dialogue
    this.dialogue = new PrimaryDialogue(this);
    this.dialogue.initDialogue();
    // this.add.existing(this.dialogue);

    // Build Keyboard
    this.keyboardHandler = new KeyboardHandler(this, {
      onLeft: () => this.handleControlButton('left'),
      onRight: () => this.handleControlButton('right'),
      onSpace: () => this.handleControlButton('space')
    });

    // outside controller
    EventBus.on('trigger-button', this.handleControlButton);
    
    // Run opening scene and start tamagotchi
    (async() => {
      await sceneStarter(this);
      await this.handleBattleAward(); // handle battle reward
      this.character.startTamagotchi();
      this.isStart = true;
    })();

    this.events.on('shutdown', this.shutdown, this);
  }

  private handleControlButton = (key) => {
    if (key === 'left' ) {
      this.header.movePrev()
    } else if (key === 'right') {
      this.header.moveNext()
    } else if (key === 'space') {
      const action = this.header.select();
      this.actionQueue.push({ user: DEFAULT_USER, action });
    }
  }

  private handleBattleAward = async () => {
    const battleResult = getGlobalData('battle_result');
    if (battleResult === 'win') {
      const result = this.character.runFuntionalAction('win');
      if (result) {
        await this.dialogue.runDialogue(result.dialog);
      }
      setGlobalData('tamagotchi_coin', getGlobalData('tamagotchi_coin') + WIN_COIN);
      this.header.showHeader(HEADER_DISPLAY_DURATION);
    }
    else if (battleResult === 'lose') {
      const result = this.character.runFuntionalAction('lose');
      if (result) {
        await this.dialogue.runDialogue(result.dialog);
      }
      setGlobalData('tamagotchi_coin', getGlobalData('tamagotchi_coin') + LOSE_COIN);
      this.header.showHeader(HEADER_DISPLAY_DURATION);
    }
    setGlobalData('battle_result', 'null');
  }

  private handleConvertActionQueue = (queue) => {
    if (queue.length === 0) return;
    const mapping = this.cache.json.get('config').tamagotchi_action_mapping;

    for(let i = 0; i < queue.length; i++) {
      const { user, content } = queue[i];
      const result = mapping.find(_item => _item.matches.includes(content));
      if (result) {
        const action = result.action;
        const params = result.params;
        this.actionQueue.push({ user, action, params });
      }
    }
    setGlobalData('message_queue', []);
  }

  private handleBuyDecoration = async (coin) => {
    const decoration = this.cache.json.get('config').tamagotchi_room.decoration;

    for(let i = 0; i < decoration.length; i++) {
      const { cost, level } = decoration[i];
      if (coin >= cost && getGlobalData('tamagotchi_level') < level) {
        const result = this.character.runFuntionalAction('buy');
        if (result) {
          await this.dialogue.runDialogue(result.dialog);
          this.header.showHeader(HEADER_DISPLAY_DURATION);
          setGlobalData('tamagotchi_level', getGlobalData('tamagotchi_level') + 1);
          setGlobalData('tamagotchi_coin', getGlobalData('tamagotchi_coin') - cost);
          return;
        }
      }
    }
  }

  private handleActionQueue = async () => {
    this.isActionRunning = true;
    const { user, action, params } = this.actionQueue[0];

    const _run = async () => {
      const result = this.character.runFuntionalAction(action);
      this.header.showHeader(HEADER_DISPLAY_DURATION);

      if (result) {
        result.text = result.text.replaceAll('{{user_name}}', user);
        await this.dialogue.runDialogue([result]);
        console.log('finished');

        if (action === 'battle') {
          await this.handleSwitchToBattleScene(user, params);
        }
      }
      
      this.actionQueue.splice(0, 1);
      this.isActionRunning = false;
    };

    _run();
  };

  private handleSwitchToBattleScene = async(user, params) => {
    setGlobalData('battle_opponent', params?.opponent);
    await sceneConverter(this, 'Battle');
  }

  update(time: number) {
    // compoents
    this.character.update(time);
    this.header.update();
    this.property.update();
    this.keyboardHandler.update();

    // functions
    if (this.actionQueue.length !== 0 && !this.isActionRunning && this.isStart) {
      this.handleActionQueue();
    }
  }

  shutdown = () => {
    this.isActionRunning = false;
    this.character.destroy()
    this.background.destroy();
    this.header.destroy();
    this.property.destroy();

    // Event
    EventBus.off('message_queue-updated', this.handleConvertActionQueue);
    EventBus.off('tamagotchi_coin-updated', this.handleBuyDecoration);
    EventBus.off('trigger-button', this.handleControlButton);

    // store
    setGlobalData('tamagotchi_queue', this.actionQueue);
  }
}
