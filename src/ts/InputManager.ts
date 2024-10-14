export default class InputManager {
  public keysPressed: any = {};
  public static instance: InputManager;

  constructor() {
    this.keysPressed = {};
    this.init();
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  init() {
    document.addEventListener("keydown", (e) => {
      this.keysPressed[e.code] = true;
    });

    document.addEventListener("keyup", (e) => {
      this.keysPressed[e.code] = false;
    });
  }

  isKeyPressed(keyCode: any) {
    return this.keysPressed[keyCode] || false;
  }

  update() {
    // You can use this method if you need to do something with the inputs each frame
  }
}
