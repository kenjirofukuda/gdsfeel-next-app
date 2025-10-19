export namespace GDS {

  export const EPS = 1e-8;
  export const BUTT_END = 0;
  export const ROUND_END = 1;
  export const EXTENDED_END = 2;
  export const CUSTOMPLUS_END = 4;
  export const PI_HALF = 0.5 * Math.PI;
  export const PI_DOUBLE = 2.0 * Math.PI;

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
}