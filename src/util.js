/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */

export function isObject(item) {
  return (item && typeof item === 'object' && !Array.isArray(item))
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function mergeDeep(target, ...sources) {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeep(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return mergeDeep(target, ...sources)
}

/**
 * Given an object, returns a new object containing only
 * allowed keys
 * @param {array} keys - Array of allowed keys
 * @param {object} obj - Original Object
 * @returns {object} Object containing only allowed keys
 */
export function filterByKeys(keys, obj) {
  return keys.reduce((obj, key) => ({ ...obj, [key]: raw[key] }), {})
}
