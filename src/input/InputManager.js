export class InputManager {
  constructor() {
    this.keys = new Set();
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  get forward() {
    let f = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) f += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) f -= 1;
    return f;
  }

  get turn() {
    let t = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) t -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) t += 1;
    return t;
  }

  // Edge-triggered: consumes the keypress so holding E doesn't re-fire every frame.
  consumeInteract() {
    if (this.keys.has('KeyE')) {
      this.keys.delete('KeyE');
      return true;
    }
    return false;
  }

  consumeJump() {
    if (this.keys.has('Space')) {
      this.keys.delete('Space');
      return true;
    }
    return false;
  }

  consumeMapToggle() {
    if (this.keys.has('KeyM')) {
      this.keys.delete('KeyM');
      return true;
    }
    return false;
  }
}
