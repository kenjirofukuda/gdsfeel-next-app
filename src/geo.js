/* global createjs */

"use strict";

const GEO = {};

GEO.EPS = 1e-8;

GEO.sameValue = function(v1, v2, eps = GEO.EPS) {
  return Math.abs(v1 - v2) < eps;
}


GEO.Viewport = class {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.scale = 1.0;
    this.centerX = 0.0;
    this.centerY = 0.0;
    this._resetPortCenter();
    this.portCenterY = height / 2.0;
    this._transform = null;
    this._invertTransform = null;
    this._basicTransform = null;
    this.transformStack = [];
    this.portDamageFunction = null;
    this.transformFunction = null;
  }

  get transformDepth() {
    return this.transformStack.length;
  }
  
  wheelZoom(h, v, x, y, direction) {
    this.portCenterX = h;
    this.portCenterY = this.height - v;
    this.centerX = x;
    this.centerY = y;
    this.scale = this.scale * (1.0 + (0.125 * direction));
    this._damageTransform();
  }

  zoomDouble() {
    this.setScale(this.scale * 2.0);
  }

  zoomHalf() {
    this.setScale(this.scale * 0.5);
  }

  setScale(scale) {
    this.scale = scale;
    this._damageTransform();
  }

  setCenter(x, y) {
    this.centerX = x;
    this.centerY = y;
    this._damageTransform();
  }

  setSize(width, height) {
    this.width = width;
    this.height = height;
    this._damageTransform();
  }

  reset() {
    this.scale = 1.0;
    this.centerX = 0;
    this.centerY = 0;
    this._damageTransform();
  }

  transform() {
    if (typeof(this.transformFunction) === 'function') {
      return this.transformFunction();
    }
    if (this._transform === null) {
      this._transform = this._lookupTransform();
    }
    return this._transform;
  }

  invertTransform() {
    if (this._invertTransform === null) {
      this._invertTransform = this.transform().clone().invert();
    }
    return this._invertTransform;
  }

  deviceToWorld(h, v) {
    const result = GEO.MakePoint();
    return this.invertTransform().transformPoint(h, v, result);
  }

  worldToDevice(x, y) {
    const result = GEO.MakePoint();
    return this.transform().transformPoint(x, y);
  }

  pushTransform(transform) {
    this.transformStack.push(transform);
    this._damageTransform();
  }

  popTransform() {
    if (this.transformStack.length === 0) {
      return null;
    }
    const result = this.transformStack.pop();
    this._damageTransform();
    return result;
  }

  _lookupTransform() {
    const newTransform = new createjs.Matrix2D();
    newTransform.prependMatrix(this.basicTransform());
    this.transformStack.map(function (item) {
      newTransform.prependMatrix(item);
    });
    return newTransform;
  }

  basicTransform() {
    if (this._basicTransform === null) {
      this._basicTransform = this._lookupBasicTransform();
    }
    return this._basicTransform;
  }

  _lookupBasicTransform() {
    const tx = new createjs.Matrix2D();
    tx.translate(this.portCenterX, this.height - this.portCenterY);
    tx.scale(this.scale, -this.scale);
    tx.translate(-this.centerX, -this.centerY);
    return tx;
  }

  _fittingRatio(width, height) {
    const margin = 20;
    const xRatio = (this.width - margin) / width;
    const yRatio = (this.height - margin) / height;
    return Math.min(xRatio, yRatio);
  }

  setRectangle(r) {
    this._resetPortCenter();
    const center = r.center();
    this.setCenter(center.x, center.y);
    this.setScale(this._fittingRatio(r.width, r.height));
  }

  _resetPortCenter() {
    this.portCenterX = this.width / 2.0;
    this.portCenterY = this.height / 2.0;
  }

  _damageTransform() {
    this._basicTransform = null;
    this._transform = null;
    this._invertTransform = null;
    if (this.portDamageFunction !== null) {
      const self = this;
      this.portDamageFunction(self);
    }
  }  
};


GEO.point_x = function (obj){
  if ('x' in obj) {
    return obj['x'];
  }
  else {
    return obj[0];
  }
};

GEO.point_y = function (obj){
  if ('y' in obj) {
    return obj['y'];
  }
  else {
    return obj[1];
  }
};


GEO.calcExtentBounds = function (points) {
  let minX = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let minY = Number.MAX_VALUE;
  let maxY = Number.MIN_VALUE;

  points.forEach(function (p) {
    minX = Math.min(GEO.point_x(p), minX);
    maxX = Math.max(GEO.point_x(p), maxX);
    minY = Math.min(GEO.point_y(p), minY);
    maxY = Math.max(GEO.point_y(p), maxY);
  });
  return GEO.MakeRect(
          minX, minY, Math.abs(maxX - minX), Math.abs(maxY - minY));
};


GEO.MakeRect = function (x, y, width, height) {
  return new createjs.Rectangle(x, y, width, height);
};

GEO.MakePoint = function (x, y) {
  return new createjs.Point(x, y);
};

createjs.Point.prototype.equals = function (other) {
  return this.x === other.x && this.y === other.y;
};


createjs.Point.prototype.minus = function (other) {
  return new createjs.Point(this.x - other.x, this.y - other.y);
};


createjs.Rectangle.prototype.center = function () {
  return new createjs.Point(
          this.x + this.width / 2.0,
          this.y + this.height / 2.0);
};

createjs.Rectangle.prototype.pointArray = function () {
  const points = [];
  points.push(new createjs.Point(this.x, this.y));
  points.push(new createjs.Point(this.x, this.y + this.height));
  points.push(new createjs.Point(this.x + this.width, this.y + this.height));
  points.push(new createjs.Point(this.x + this.width, this.y));
  return points;
};


function floatConvertSyncer(num, dig) {
  const p = Math.pow(10, dig);
  return Math.round(num * p) / p;
}

Number.prototype.roundDigits = function (dig) {
  return floatConvertSyncer(this, dig);
};
