// @see https://github.com/CreateJS/EaselJS/blob/master/src/easeljs/geom/Rectangle.js

import { Point } from './Point.js';

export class Rectangle {
  /**
   * X position.
   * @property x
   * @type Number
   **/
  x: number;

  /**
   * Y position.
   * @property y
   * @type Number
   **/
  y: number;

  /**
   * Width.
   * @property width
   * @type Number
   **/
  width: number;

  /**
   * Height.
   * @property height
   * @type Number
   **/
  height: number;

  /**
   * Represents a rectangle as defined by the points (x, y) and (x+width, y+height).
   *
   * <h4>Example</h4>
   *
   *      var rect = new createjs.Rectangle(0, 0, 100, 100);
   *
   * @class Rectangle
   * @param {Number} [x=0] X position.
   * @param {Number} [y=0] Y position.
   * @param {Number} [width=0] The width of the Rectangle.
   * @param {Number} [height=0] The height of the Rectangle.
   * @constructor
   **/
  constructor(x?: number, y?: number, width?: number, height?: number) {
    this.setValues(x, y, width, height);
  }


  /**
   * Sets the specified values on this instance.
   * @method setValues
   * @param {Number} [x=0] X position.
   * @param {Number} [y=0] Y position.
   * @param {Number} [width=0] The width of the Rectangle.
   * @param {Number} [height=0] The height of the Rectangle.
   * @return {Rectangle} This instance. Useful for chaining method calls.
   * @chainable
   */
  setValues(x?: number, y?: number, width?: number, height?: number): Rectangle {
    // don't forget to update docs in the constructor if these change:
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;
    return this;
  }

  /**
   * Extends the rectangle's bounds to include the described point or rectangle.
   * @method extend
   * @param {Number} x X position of the point or rectangle.
   * @param {Number} y Y position of the point or rectangle.
   * @param {Number} [width=0] The width of the rectangle.
   * @param {Number} [height=0] The height of the rectangle.
   * @return {Rectangle} This instance. Useful for chaining method calls.
   * @chainable
   */
  extend(x: number, y: number, width?: number, height?: number): Rectangle {
    width = width || 0;
    height = height || 0;
    if (x+width > this.x+this.width) { this.width = x+width-this.x; }
    if (y+height > this.y+this.height) { this.height = y+height-this.y; }
    if (x < this.x) { this.width += this.x-x; this.x = x; }
    if (y < this.y) { this.height += this.y-y; this.y = y; }
    return this;
  }

  /**
   * Adds the specified padding to the rectangle's bounds.
   * @method pad
   * @param {Number} top
   * @param {Number} left
   * @param {Number} bottom
   * @param {Number} right
   * @return {Rectangle} This instance. Useful for chaining method calls.
   * @chainable
   */
  pad(top: number, left: number, bottom: number, right: number): Rectangle {
    this.x -= left;
    this.y -= top;
    this.width += left+right;
    this.height += top+bottom;
    return this;
  }

  /**
   * Copies all properties from the specified rectangle to this rectangle.
   * @method copy
   * @param {Rectangle} rectangle The rectangle to copy properties from.
   * @return {Rectangle} This rectangle. Useful for chaining method calls.
   * @chainable
   */
  copy(rectangle: Rectangle): Rectangle {
    return this.setValues(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
  }

  /**
   * Returns true if this rectangle fully encloses the described point or rectangle.
   * @method contains
   * @param {Number} x X position of the point or rectangle.
   * @param {Number} y Y position of the point or rectangle.
   * @param {Number} [width=0] The width of the rectangle.
   * @param {Number} [height=0] The height of the rectangle.
   * @return {Boolean} True if the described point or rectangle is contained within this rectangle.
   */
  contains(x: number, y: number, width: number, height: number): boolean {
    width = width||0;
    height = height||0;
    return (x >= this.x && x+width <= this.x+this.width && y >= this.y && y+height <= this.y+this.height);
  }

  /**
   * Returns a new rectangle which contains this rectangle and the specified rectangle.
   * @method union
   * @param {Rectangle} rect The rectangle to calculate a union with.
   * @return {Rectangle} A new rectangle describing the union.
   */
  union(rect: Rectangle): Rectangle {
    return this.clone().extend(rect.x, rect.y, rect.width, rect.height);
  }

  /**
   * Returns a new rectangle which describes the intersection (overlap) of this rectangle and the specified rectangle,
   * or null if they do not intersect.
   * @method intersection
   * @param {Rectangle} rect The rectangle to calculate an intersection with.
   * @return {Rectangle} A new rectangle describing the intersection or null.
   */
  intersection(rect: Rectangle): Rectangle {
    var x1 = rect.x, y1 = rect.y, x2 = x1+rect.width, y2 = y1+rect.height;
    if (this.x > x1) { x1 = this.x; }
    if (this.y > y1) { y1 = this.y; }
    if (this.x + this.width < x2) { x2 = this.x + this.width; }
    if (this.y + this.height < y2) { y2 = this.y + this.height; }
    return (x2 <= x1 || y2 <= y1) ? null : new Rectangle(x1, y1, x2-x1, y2-y1);
  }

  /**
   * Returns true if the specified rectangle intersects (has any overlap) with this rectangle.
   * @method intersects
   * @param {Rectangle} rect The rectangle to compare.
   * @return {Boolean} True if the rectangles intersect.
   */
  intersects(rect: Rectangle): boolean {
    return (rect.x <= this.x+this.width && this.x <= rect.x+rect.width && rect.y <= this.y+this.height && this.y <= rect.y + rect.height);
  }

  /**
   * Returns true if the width or height are equal or less than 0.
   * @method isEmpty
   * @return {Boolean} True if the rectangle is empty.
   */
  isEmpty(): boolean {
    return this.width <= 0 || this.height <= 0;
  }

  /**
   * Returns a clone of the Rectangle instance.
   * @method clone
   * @return {Rectangle} a clone of the Rectangle instance.
   **/
  clone(): Rectangle {
    return new Rectangle(this.x, this.y, this.width, this.height);
  }

  /**
   * Returns a string representation of this object.
   * @method toString
   * @return {String} a string representation of the instance.
   **/
  toString(): string {
    return "[Rectangle (x="+this.x+" y="+this.y+" width="+this.width+" height="+this.height+")]";
  }

  center(): Point {
    return new Point(
      this.x + this.width / 2.0,
      this.y + this.height / 2.0);
  }

  pointArray(): Point[] {
    const points = [];
    points.push(new Point(this.x, this.y));
    points.push(new Point(this.x, this.y + this.height));
    points.push(new Point(this.x + this.width, this.y + this.height));
    points.push(new Point(this.x + this.width, this.y));
    return points;
  }

}
