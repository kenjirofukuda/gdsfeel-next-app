/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* global GEO */

const GDS = {};

GDS.EPS = 1e-8;
GDS.BUT_END = 
GDS.BUTT_END = 0;
GDS.ROUND_END = 1;
GDS.EXTENDED_END = 2;
GDS.CUSTOMPLUS_END = 4;
GDS.PI_HALF = 0.5 * Math.PI;
GDS.PI_DOUBLE = 2.0 * Math.PI;

GDS.Object = class {
  constructor() {
    this.parent = null;
  }

  root() {
    let obj = this;
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
  
};

