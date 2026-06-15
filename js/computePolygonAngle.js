/**
 * Computes the internal angle (in radians) at a vertex in a polygon,
 * given its previous and next consecutive vertices.
 *
 * @param {{x: number, y: number}} prevPos - Position of the previous vertex.
 * @param {{x: number, y: number}} vPos - Position of the current vertex.
 * @param {{x: number, y: number}} nextPos - Position of the next vertex.
 * @returns {number} The internal angle at the vertex in radians.
 */
function computePolygonAngle(prevPos, vPos, nextPos) {
    const v1 = { x: prevPos.x - vPos.x, y: prevPos.y - vPos.y };
    const v2 = { x: nextPos.x - vPos.x, y: nextPos.y - vPos.y };
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.hypot(v1.x, v1.y);
    const mag2 = Math.hypot(v2.x, v2.y);
    if (mag1 < 0.001 || mag2 < 0.001) return 0;

    let ang = Math.acos(clamp(dot / (mag1 * mag2), -1, 1));
    const cross = v1.x * v2.y - v1.y * v2.x;
    if (cross < 0) ang = 2 * Math.PI - ang;
    return ang;
}

window.computePolygonAngle = computePolygonAngle;
