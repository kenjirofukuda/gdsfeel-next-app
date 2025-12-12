// @see https://github.com/CreateJS/EaselJS/blob/master/src/easeljs/geom/Point.js

export type IndexedPoint2D = Array<0 | 1>;
export type IndexedPoint3D = Array<0 | 1 | 2>;

export interface Point2DInit {
  x: number;
  y: number;
};

export type PointLike = Point2DInit | IndexedPoint2D;

export class Point implements Point2DInit {
  x: number;
  y: number;

  constructor(x?: number, y?: number) {
    this.setValues(x, y);
  }

  equals(other: Point): boolean {
    return this.x === other.x && this.y === other.y;
  }

  minus(other: Point): Point {
    return new Point(this.x - other.x, this.y - other.y);
  }

  /**
   * Sets the specified values on this instance.
   * @method setValues
   * @param {number} [x=0] X position.
   * @param {number} [y=0] Y position.
   * @return {Point} This instance. Useful for chaining method calls.
   * @chainable
   */
  setValues(x?: number, y?: number): Point {
    this.x = x || 0;
    this.y = y || 0;
    return this;
  }

  /**
   * Offsets the Point object by the specified amount.
   * <ul>
   *     <li>The value of `dx` is added to the original value of `x` to create the new `x` value</li>
   *     <li>The value of `dy` is added to the original value of `y` to create the new `y` value</li>
   * </ul>
   * @method offset
   * @param {number} dx The amount by which to offset the horizontal coordinate, `x`.
   * @param {number} dy The amount by which to offset the vertical coordinate, `y`.
   * @return {Point} This instance. Useful for chaining method calls.
   * @chainable
   */
  offset(dx: number, dy: number): Point {
    this.x += dx;
    this.y += dy;
    return this;
  }

  /**
   * Converts a pair of polar coordinates to a Cartesian point coordinate.
   * @method polar
   * @param {Number} len The length coordinate of the polar pair.
   * @param {Number} angle The angle, in radians, of the polar pair.
   * @param {Point | PointLike} [pt] An object to copy the result into. If omitted a new {{#crossLink "Point"}}{{/crossLink}}
   * will be returned.
   * @return {PointLike} The new, interpolated point.
   * @static
   */
  static polar(len: number, angle: number, pt: Point | PointLike ): PointLike {
    pt = pt || new Point();
    pt.x = len * Math.cos(angle);
    pt.y = len * Math.sin(angle);
    return pt;
  }

  /**
   * Determine a point between two specified points.
   *
   * The parameter `f` determines where the new interpolated point is located relative to the two end points specified
   * by parameters `pt1` and `pt2`:
   * <ul>
   *     <li>The closer the value of the parameter `f` is to 1.0, the closer the interpolated point is to the first
   *     point (parameter `pt1`).</li>
   *     <li>The closer the value of the parameter `f` is to 0, the closer the interpolated point is to the second
   *     point (parameter `pt2`).</li>
   * </ul>
   * @method interpolate
   * @param {Point | Object} pt1 The first point as a Point or generic object.
   * @param {Point | Object} pt2 The second point as a Point or generic object.
   * @param {number} f The level of interpolation between the two points. Indicates where the new point will be, along
   * the line between `pt1` and `pt2`. If `f=1`, `pt1` is returned; if `f=0`, `pt2` is returned.
   * @param {Point | Object} [pt] An object to copy the result into. If omitted, a new {{#crossLink "Point"}}{{/crossLink}}
   * will be returned.
   * @return {Point} A new interpolated Point, or the `pt` passed in the 4th parameter with the interpolated values.
   * @static
   */
  static interpolate(pt1: PointLike, pt2: PointLike, f: number, pt: Point | PointLike): PointLike {
    pt = pt || new Point();
    pt.x = pt2.x + f * (pt1.x - pt2.x);
    pt.y = pt2.y + f * (pt1.y - pt2.y);
    return pt;
  }

  /**
   * Copies all properties from the specified point to this point.
   * @method copy
   * @param {PointLike} point The point to copy properties from.
   * @return {Point} This point. Useful for chaining method calls.
   * @chainable
   */
  copy (point: PointLike): Point {
    this.x = point.x;
    this.y = point.y;
    return this;
  }

  /**
   * Returns a clone of the Point instance.
   * @method clone
   * @return {Point} a clone of the Point instance.
   **/
  clone(): Point {
    return new Point(this.x, this.y);
  }

  /**
   * Returns a string representation of this object.
   * @method toString
   * @return {string} a string representation of the instance.
   **/
  toString(): string {
    return "[Point (x="+this.x+" y="+this.y+")]";
  }
}

export function point_x(obj: PointLike): number {
  if ('x' in obj) {
    return obj['x'];
  }
  else {
    return obj[0];
  }
};

export function point_y(obj: PointLike): number {
  if ('y' in obj) {
    return obj['y'];
  }
  else {
    return obj[1];
  }
};
