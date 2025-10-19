"use strict";

/* global GEO, GDS */


GDS.Structure = class extends GDS.Object {
  constructor() {    
    super();
    this._elements = [];
  }

  get name() {
    return this.hash.name;
  }
  
  addElement(e) {
    this._elements.push(e);
    e.parent = this;
  };

  elements() {
    return this._elements;
  }

  dataExtent () {
    if (! this._dataExtent) {
      this._dataExtent = this._lookupDataExtent();
    }
    return this._dataExtent;
  }
  
  _lookupDataExtent() {
    if (this.elements().length === 0) {
      return GEO.MakeRect(0, 0, 0, 0);
    }
    let points = [];
    this.elements().forEach(function (e) {
      var r = e.dataExtent();
      r.pointArray().forEach(function (p) {
        points.push(p);
      });
    });
    return GEO.calcExtentBounds(points);
  }

  loadFromJson(jsonMap) {
    this.hash = jsonMap;
    const self = this;
    jsonMap.elements.forEach(function(oElement) {
      const element = GDS.Element.fromObject2(oElement);
      if (element) {
       self.addElement(element);
      }
    });
  }
  
};


GDS.Library = class extends GDS.Object {
  constructor() {
    super();
    this._structures = [];
    this._structureMap = [];
  }

  addStructure(struct) {
    this._structures.push(struct);
    this._structureMap[struct.name] = struct;
    struct.parent = this;
  }

  structureNamed(strucName) {
    return this._structureMap[strucName];
  }

  structures() {
    return this._structures;
  }

  loadFromJson(jsonMap) {
    this.hash = jsonMap;
    const self = this;
    Object.keys(jsonMap.structures).forEach(function (strucName) {
      const struct = new GDS.Structure();
      struct.loadFromJson(jsonMap.structures[strucName]);
      self.addStructure(struct);
    });
  }
  
};
