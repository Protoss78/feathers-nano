'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.isObject = isObject;
exports.mergeDeep = mergeDeep;
exports.filterByKeys = filterByKeys;
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
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

/**
 * Given an object, returns a new object containing only
 * allowed keys
 * @param {array} keys - Array of allowed keys
 * @param {object} obj - Original Object
 * @returns {object} Object containing only allowed keys
 */
function filterByKeys(keys, raw) {
  return keys.reduce((obj, key) => _extends({}, obj, { [key]: raw[key] }), {});
}