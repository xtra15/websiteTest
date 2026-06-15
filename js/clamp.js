/**
 * Clamps a numeric value between a minimum and maximum bound.
 *
 * @param {number} v - The value to clamp.
 * @param {number} a - The minimum allowed value (inclusive).
 * @param {number} b - The maximum allowed value (inclusive).
 * @returns {number} The clamped value within [a, b].
 */
function clamp(v, a, b) {
    return Math.min(b, Math.max(a, v));
}

window.clamp = clamp;
