/**
 * Determines whether a point lies inside a polygon using the ray casting algorithm.
 *
 * @param {{x: number, y: number}} point - The point to test, with x and y coordinates.
 * @param {{x: number, y: number}[]} polygon - Array of vertex objects defining the polygon.
 * @returns {boolean} True if the point is inside the polygon; otherwise false.
 */
function pointInPolygon(point, polygon) {
    if (polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        const intersect = ((yi > point.y) !== (yj > point.y)) &&
                          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

window.pointInPolygon = pointInPolygon;
