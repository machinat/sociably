class ClientEmitter<T> {
  private _eventListeners: ((ctx: T) => void)[];
  private _errorListeners: ((err: Error) => void)[];

  constructor() {
    this._eventListeners = [];
    this._errorListeners = [];
  }

  onEvent(listener: (ctx: T) => void): void {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._eventListeners.push(listener);
  }

  removeEventListener(listener: (ctx: T) => void): boolean {
    const idx = this._eventListeners.findIndex((fn) => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._eventListeners.splice(idx, 1);
    return true;
  }

  onError(listener: (err: Error) => void): void {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }
    this._errorListeners.push(listener);
  }

  removeErrorListener(listener: (err: Error) => void): boolean {
    const idx = this._errorListeners.findIndex((fn) => fn === listener);
    if (idx === -1) {
      return false;
    }

    this._errorListeners.splice(idx, 1);
    return true;
  }

  protected _emitEvent(ctx: T): void {
    for (const listener of this._eventListeners) {
      listener.call(this, ctx);
    }
  }

  protected _emitError(err: Error): void {
    if (this._errorListeners.length === 0) {
      throw err;
    }

    for (const listener of this._errorListeners) {
      listener(err);
    }
  }
}

export default ClientEmitter;
