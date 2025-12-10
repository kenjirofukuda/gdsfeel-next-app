export const BUTT_END = 0;
export const ROUND_END = 1;
export const EXTENDED_END = 2;
export const CUSTOMPLUS_END = 4;

export class GObject {
  public parent: GObject | undefined;
  sfAttr: Map<string, any>;

  constructor() {
    this.parent = undefined;
    this.sfAttr = new Map();
  }

  forgetParent() {
    this.parent = undefined;
  }

  recordParent() {
    // subclass mutst be implement
  }

  root(): GObject {
    let obj: GObject = this;
    while (true) {
      if (! obj.parent) {
        break;
      }
      else {
        obj = obj.parent;
      }
    }
    return obj;
  }
}
