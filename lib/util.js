"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isObject = isObject;
exports.mergeDeep = mergeDeep;
/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        // Object.assign(target, { [key]: source[key] })
        source[key] === "" ? delete target[key] : Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}