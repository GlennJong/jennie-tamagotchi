import { RoomWindow } from './RoomWindow';
import { RoomRecorder } from './RoomRecorder';
import { CustomDecroation } from './CustomDecroation';

const WINDOW_POSITION = { x: 44, y: -4 };
const RECORDER_POSITION = { x: 0, y: 31 }

export class Property extends Phaser.GameObjects.Container {
  private window: RoomWindow;
  private recorder: RoomRecorder;
  private decoration: CustomDecroation;
  
  constructor(scene: Phaser.Scene) {
    super(scene);
    
    // Window
    this.window = new RoomWindow(scene, WINDOW_POSITION);

    // Recorder
    this.recorder = new RoomRecorder(scene, RECORDER_POSITION);

    // Custom Decroation
    this.decoration = new CustomDecroation(scene);
  }

  create() {
  }


  public update() {
  }

  public destroy() {
    this.window.destroy();
    this.recorder.destroy();
    this.decoration.destroy();
  } 
}
