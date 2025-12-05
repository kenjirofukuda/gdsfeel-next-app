export const BUTT_END = 0;
export const ROUND_END = 1;
export const EXTENDED_END = 2;
export const CUSTOMPLUS_END = 4;

export class GObject {
  parent: GObject | null;

  constructor() {
    this.parent = null;
  }

  root(): GObject {
    let obj: GObject = this;
    while (true) {
      if (obj.parent === null) {
        break;
      }
      else {
        obj = obj.parent;
      }
    }
    return obj;
  }
}