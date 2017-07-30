"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function fromCamelToHuman(camel) {
    return camel.match(/^[_a-z]+|[_A-Z][_a-z]*/g).map(function (x) {
        return x[0].toUpperCase() + x.substr(1).toLowerCase();
    }).join(' ');
}
exports.fromCamelToHuman = fromCamelToHuman;
//# sourceMappingURL=utils.js.map