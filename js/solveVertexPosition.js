/**
 * Finds a position X that forms another possible triangle vertex,
 * given fixed points V and O, a target angle at X, and distance from V to X.
 *
 * @param {{x: number, y: number}} fixedV - Fixed vertex V.
 * @param {{x: number, y: number}} fixedO - Fixed vertex O.
 * @param {number} targetAngle - Desired angle at X (radians).
 * @param {number} distVX - Desired distance from V to X.
 * @returns {{x: number, y: number}|null} One valid candidate position for X, or null if none.
 */
function solveVertexPosition(fixedV, fixedO, targetAngle, distVX) {
    const voDist = Math.hypot(fixedO.x - fixedV.x, fixedO.y - fixedV.y);
    if (voDist < 0.001 || targetAngle < 0.001 || targetAngle >= Math.PI) return null;

    const arcRadius = voDist / (2 * Math.sin(targetAngle));
    if (!isFinite(arcRadius) || arcRadius < 0.001) return null;

    const midX = (fixedV.x + fixedO.x) / 2;
    const midY = (fixedV.y + fixedO.y) / 2;
    const dx = fixedO.x - fixedV.x;
    const dy = fixedO.y - fixedV.y;
    const halfChord = voDist / 2;
    const perpDist = Math.sqrt(Math.max(0, arcRadius * arcRadius - halfChord * halfChord));

    const centers = [
        { x: midX - dy / voDist * perpDist, y: midY + dx / voDist * perpDist },
        { x: midX + dy / voDist * perpDist, y: midY - dx / voDist * perpDist }
    ];

    const candidates = [];
    centers.forEach(function (center) {
        const centerToVDist = Math.hypot(fixedV.x - center.x, fixedV.y - center.y);
        const cosAngle = 1 - (distVX * distVX) / (2 * arcRadius * arcRadius);
        if (cosAngle < -1 || cosAngle > 1) return;

        const angleVX = Math.acos(cosAngle);
        const angleToV = Math.atan2(fixedV.y - center.y, fixedV.x - center.x);

        candidates.push({
            x: center.x + arcRadius * Math.cos(angleToV + angleVX),
            y: center.y + arcRadius * Math.sin(angleToV + angleVX)
        });
        candidates.push({
            x: center.x + arcRadius * Math.cos(angleToV - angleVX),
            y: center.y + arcRadius * Math.sin(angleToV - angleVX)
        });
    });

    if (candidates.length === 0) return null;
    return candidates[0];
}

window.solveVertexPosition = solveVertexPosition;
