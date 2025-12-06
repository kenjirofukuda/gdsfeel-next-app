/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import { Library, Structure } from '/dist/onejs/src/gds/container.js';
import { StructureView } from '/dist/onejs/src/gds/browser/canvas.js';

let gLibrary = null;
let gStructure = null;
let gStructureView = null;
let gQueue = null;
let gWaitMSecs = 300;

/* export */ function loadIt() {
//  $("#canvas-wrapper").css("display", "flex");
  window.addEventListener("resize", function () {
    clearTimeout(gQueue);
    gQueue = setTimeout(function () {
      adjustPortSize();
      adjustRowCenter();
    }, gWaitMSecs);
  }, false);

  adjustPortSize();
  const obj = jsonData();
  gLibrary = new Library();
  gLibrary.loadFromJson(obj);
  gStructure = new Structure();
//  const strucName = $("#struc_name").html();
  const strucName = "Bandgap";
  if (strucName) {
    gStructure = gLibrary.structureNamed(strucName);
    const domElements = $('#elementlist').find('.gelement .selected');
    console.log(domElements);
    const elKey = $(domElements[0]).data('elKey');
    const element = gStructure.elements().find((el) => el.hash.elkey == elKey);
    if (element) {
      console.log(element);
      let stream = {};
      element.attrOn(stream);
      console.log(stream);
      // console.log(JSON.stringify(stream, null, 2));
    }
  }

  gStructureView = new StructureView("canvas", gStructure);
  gStructureView.addMouseMoveListener(function (e) {
    $("#deviceX").html(sprintf("%5d", e.offsetX));
    $("#deviceY").html(sprintf("%5d", e.offsetY));
    const worldPoint = gStructureView.port.deviceToWorld(e.offsetX, e.offsetY);
    $("#worldX").html(sprintf("%+20.4f", worldPoint.x.roundDigits(4)));
    $("#worldY").html(sprintf("%+20.4f", worldPoint.y.roundDigits(4)));
  });

  gStructureView.fit();
  setInterval(function(){
    gStructureView.redraw();
  },100);
}

function adjustRowCenter() {
  let container_height = $("#container").height();
  let row1_height = $("#row1").height();
  let row3_height = $("#row3").height();
//  $("#row2").height(window.innerHeight - (row1_height + row3_height));
  $("#row2").height(0);
  $("#canvas-wrapper").height(0);
}


function adjustPortSize() {
  let w = $("#canvas-wrapper").width();
  let h = $("#canvas-wrapper").height();
  $("#canvas").attr("width", w);
  $("#canvas").attr("height", h);
  if (gStructureView) {
    gStructureView.port.setSize(w, h);
  }
  $("#canvas-wrapper").css("display", "flex");
}

function msg(s) {
  let msgTag = $("#msg")[0];
  if (msgTag) {
    msgTag.innerHTML = s;
  }
  console.log(s);
}

function floatConvertSyncer(num, dig) {
  const p = Math.pow(10, dig);
  return Math.round(num * p) / p;
}

Number.prototype.roundDigits = function (dig) {
  return floatConvertSyncer(this, dig);
};

window.loadIt = loadIt;
