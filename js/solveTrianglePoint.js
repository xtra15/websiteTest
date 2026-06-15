/**
 * Solves for the coordinates of point C in triangle ABC,
 * given fixed positions for A and B, and desired interior angles at A and B.
 *
 * @param {{x: number, y: number}} fixedA - Fixed position of vertex A.
 * @param {{x: number, y: number}} fixedB - Fixed position of vertex B.
 * @param {number} angleAtA - Desired interior angle at vertex A (radians).
 * @param {number} angleAtB - Desired interior angle at vertex B (radians).
 * @returns {{x: number, y: number}|null} The solved position for C, or null if invalid.
 */
function solveTrianglePoint(fixedA, fixedB, angleAtA, angleAtB) {
    const a = Math.hypot(fixedB.x - fixedA.x, fixedB.y - fixedA.y);
    const angleAtC = Math.PI - angleAtA - angleAtB;
    if (angleAtC <= 0.001) return null;

    const b = a * Math.sin(angleAtB) / Math.sin(angleAtC);
    const c = a * Math.sin(angleAtA) / Math.sin(angleAtC);

    let cx = c * Math.cos(angleAtA);
    let cy = c * Math.sin(angleAtA);

    const abAngle = Math.atan2(fixedB.y - fixedA.y, fixedB.x - fixedA.x);
    const newX = fixedA.x + cx * Math.cos(abAngle) - cy * Math.sin(abAngle);
    const newY = fixedA.y + cx * Math.sin(abAngle) + cy * Math.cos(abAngle);

    return { x: newX, y: newY };
}

window.solveTrianglePoint = solveTrianglePoint;
