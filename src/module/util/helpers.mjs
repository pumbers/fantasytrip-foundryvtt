/**
 * Handlebars Helpers
 * @module helpers
 */

/**
 * Send an object to the console log for debugging
 */
export function log(obj) {
  console.log(obj);
}

/**
 * Stringify an object for direct display
 */
export function stringify(obj) {
  return JSON.stringify(obj, null, 2);
}

/**
 * Search through an object to retrieve a value by a string key
 */
export function property(obj, key) {
  return foundry.utils.getProperty(obj, key);
}

/**
 * Abbreviate a string to the first n characters (default 3)
 */
export function abbrev(str, options) {
  return (
    str?.substring(0, options.hash.len ?? 3) +
    (str.length > (options.hash.len ?? 3) && options.hash.ellipsis ? "..." : "")
  );
}

/**
 * Offset (+/-) a value by a given amount
 */
export function offset(value, offset) {
  return Number(value) + Number(offset);
}

/**
 * Create an object from a series of hash arguments
 * @param {*} object hash
 */
export function object({ hash }) {
  return hash;
}

/**
 * Create an array from an arguments list
 */
export function array() {
  return Array.from(arguments)
    .slice(0, arguments.length - 1)
    .flat(1);
}

/**
 * Create an array from a range
 */
export function range(...args) {
  args.pop();
  let low = args.length === 1 ? 1 : Math.min(args[0], args[1]);
  let high = Math.max(args[0], args[1] ?? 0);
  let list = [];
  for (var i = low; i <= high; i++) {
    list.push(i);
  }
  return list;
}

/**
 * Return the absolute value of a number
 */
export function abs(num) {
  return typeof num == "number" ? Math.abs(num) : num;
}

/**
 * Sort an array by a specified entry property
 */
export function sort(collection, property, direction = "asc") {
  return collection.sort((a, b) =>
    direction === "asc"
      ? foundry.utils.getProperty(a, property) <= foundry.utils.getProperty(b, property)
      : foundry.utils.getProperty(a, property) >= foundry.utils.getProperty(b, property)
  );
}

/**
 * Check if a list includes a specific item
 */
export function includes(list, item) {
  return list.includes(item);
}

/**
 * Determine if a number if between two values (inclusive)
 */
export function between(value, min, max) {
  return value >= min && value <= max;
}

/**
 * Check if a string starts with a value
 */
export function startsWith(text, value) {
  return text?.startsWith(value);
}

/**
 * Find details of a status effect based on its symbolic id
 */
export function statusEffect(id) {
  return CONFIG.statusEffects.find((s) => s.id === id);
}
