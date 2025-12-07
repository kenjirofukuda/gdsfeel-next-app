"use strict";
exports.__esModule = true;
function floatConvertSyncer(num, dig) {
    var p = Math.pow(10, dig);
    return Math.round(num * p) / p;
}
Number.prototype.roundDigits = function (dig) {
    return floatConvertSyncer(this, dig);
};
