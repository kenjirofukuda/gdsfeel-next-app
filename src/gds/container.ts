import { GEO } from '../geometry/geo';
/// <reference path="./gds.ts" />
/// <reference path="./elements.ts" />

export namespace GDS {
  export class Structure extends GObject {
    _elements: Array<Element>;
    _dataExtent: GEO.Rectangle | null;
    hash: any;

    constructor() {
      super();
      this._elements = [];
      this._dataExtent = null;
    }

    get name() {
      return this.hash.name;
    }

    addElement(e: Element) {
      this._elements.push(e);
      e.parent = this as GObject;
    };

    elements(): Array<Element> {
      return this._elements;
    }

    dataExtent(): GEO.Rectangle {
      if (!this._dataExtent) {
        this._dataExtent = this._lookupDataExtent();
      }
      return this._dataExtent;
    }

    _lookupDataExtent(): GEO.Rectangle {
      if (this.elements().length === 0) {
        return GEO.MakeRect(0, 0, 0, 0);
      }
      let points: Coords = [];
      this.elements().forEach(function (e: Element) {
        const r = e.dataExtent();
        r.pointArray().forEach(function (p) {
          points.push(p);
        });
      });
      return GEO.calcExtentBounds(points);
    }

    loadFromJson(jsonMap: any) {
      this.hash = jsonMap;
      const self = this;
      jsonMap.elements.forEach(function (oElement: GDS.Element) {
        const element = GDS.Element.fromObject2(oElement);
        if (element) {
          self.addElement(element);
        }
      });
    }

  };


  export class Library extends GObject {
    _structures: Array<Structure>;
    _structureMap: Map<string, Structure>;
    hash: any;
    constructor() {
      super();
      this._structures = [];
      this._structureMap = new Map<string, Structure>;
    }

    addStructure(struct: Structure) {
      this._structures.push(struct);
      this._structureMap.set(struct.name, struct);
      struct.parent = this;
    }

    structureNamed(strucName: string): Structure | undefined {
      return this._structureMap.get(strucName);
    }

    structures(): Array<Structure> {
      return this._structures;
    }

    loadFromJson(jsonMap: any): void {
      this.hash = jsonMap;
      const self = this;
      Object.keys(jsonMap.structures).forEach(function (strucName) {
        const struct = new GDS.Structure();
        struct.loadFromJson(jsonMap.structures[strucName]);
        self.addStructure(struct);
      });
    }
  }

}
