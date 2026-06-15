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

/**
 * Gets position for a pin/vertex by ID.
 *
 * @param {number} id - The vertex/pin identifier.
 * @param {object} context - Context object containing vertices data.
 * @param {number} [context.CENTER_ID] - The center vertex ID.
 * @param {number} [context.centerX] - Center X coordinate.
 * @param {number} [context.centerY] - Center Y coordinate.
 * @param {number} [context.centerProtractorRadius] - Radius of center protractor.
 * @param {Array} [context.protractors] - Array of protractor objects with pivotX, pivotY, r properties.
 * @param {Array} [context.freePoints] - Array of free point objects with x, y properties.
 * @returns {{x: number, y: number, r: number, angle: number}} The position object.
 */
function getPinPos(id, context) {
    const ctx = context || {};
    const centerId = ctx.CENTER_ID !== undefined ? ctx.CENTER_ID : CENTER_ID;
    const centerXVal = ctx.centerX !== undefined ? ctx.centerX : window.centerX;
    const centerYVal = ctx.centerY !== undefined ? ctx.centerY : window.centerY;
    const centerProtractorRadiusVal = ctx.centerProtractorRadius !== undefined ? ctx.centerProtractorRadius : window.centerProtractorRadius;
    const protractorsVal = ctx.protractors !== undefined ? ctx.protractors : window.protractors;
    const freePointsVal = ctx.freePoints !== undefined ? ctx.freePoints : window.freePoints;
    
    if (id === centerId) {
        return { x: centerXVal || 0, y: centerYVal || 0, r: centerProtractorRadiusVal || 0, angle: 0 };
    }
    if (id < 100 && protractorsVal) {
        const p = protractorsVal[id];
        return p ? { x: p.pivotX, y: p.pivotY, r: p.r, angle: 0 } : { x: 0, y: 0, r: 0, angle: 0 };
    }
    if (freePointsVal) {
        const fp = freePointsVal.find(p => p.id === id);
        return fp ? { x: fp.x, y: fp.y, r: 0, angle: 0 } : { x: 0, y: 0, r: 0, angle: 0 };
    }
    return { x: 0, y: 0, r: 0, angle: 0 };
}

function getCurrentAngleAtVertex(vID, p1ID, p2ID, context) {
    const vPos = getPinPos(vID, context);
    const p1Pos = getPinPos(p1ID, context);
    const p2Pos = getPinPos(p2ID, context);
    const a1 = Math.atan2(p1Pos.y - vPos.y, p1Pos.x - vPos.x);
    const a2 = Math.atan2(p2Pos.y - vPos.y, p2Pos.x - vPos.x);
    let diff = a2 - a1;
    if (diff < 0) diff += 2 * Math.PI;
    return diff * 180 / Math.PI;
}

function getConnectedNeighbors(vID, edges) {
    const sourceEdges = edges || window.strings || [];
    const neighbors = [];
    sourceEdges.forEach(s => {
        if (s.start === vID && !neighbors.includes(s.end)) neighbors.push(s.end);
        if (s.end === vID && !neighbors.includes(s.start)) neighbors.push(s.start);
    });
    return neighbors;
}

function getPolygonFromVertex(vID, aID, bID, edges) {
    const sourceEdges = edges || window.strings || [];
    const edgeKey = (u, v) => u < v ? u + '-' + v : v + '-' + u;
    const visitedEdges = new Set();

    const adj = {};
    sourceEdges.forEach(s => {
        if (!adj[s.start]) adj[s.start] = [];
        if (!adj[s.end]) adj[s.end] = [];
        adj[s.start].push(s.end);
        adj[s.end].push(s.start);
    });

    function dfsPath(current, target, path, edgesUsed) {
        if (current === target) {
            return path.slice();
        }
        const nexts = adj[current] || [];
        for (const next of nexts) {
            const e = edgeKey(current, next);
            if (edgesUsed.has(e)) continue;
            if (next === vID) continue;

            edgesUsed.add(e);
            path.push(next);
            const result = dfsPath(next, target, path, edgesUsed);
            if (result) return result;
            path.pop();
            edgesUsed.delete(e);
        }
        return null;
    }

    const pathFromAToB = dfsPath(aID, bID, [aID], new Set());
    if (!pathFromAToB) return null;

    const polygon = [vID, ...pathFromAToB];
    if (polygon.length < 3) return null;

    return polygon;
}

class HalfProtractor {
    constructor(id, ang, orbitAng) {
        this.id = id;
        this.angle = ang;
        this.orbitAngle = orbitAng;
        this.gradient = null;
        this.slideLocked = false;
        this.minOrbit = null;
        this.maxOrbit = null;
    }
    draw(ctx, t) {
        this.pivotX = centerX + boardRadius * Math.cos(this.orbitAngle);
        this.pivotY = centerY + boardRadius * Math.sin(this.orbitAngle);
        this.r = protractorRadius;

        if (appSettings.showRingBody) {
            ctx.save();
            ctx.translate(this.pivotX, this.pivotY);
            ctx.rotate(this.angle);
            ctx.beginPath();
            ctx.arc(0, 0, this.r, 0, Math.PI, false);
            ctx.closePath();

            if (!this.gradient) {
                const g = ctx.createLinearGradient(0, -this.r, 0, 0);
                if (t.transparentCanvas) {
                    g.addColorStop(0, 'rgba(255,255,255,0.1)');
                    g.addColorStop(1, 'rgba(255,255,255,0.4)');
                } else {
                    g.addColorStop(0, t.c_bg);
                    g.addColorStop(1, t.surface);
                }
                this.gradient = g;
            }
            ctx.fillStyle = this.gradient;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = t.c_line;
            ctx.stroke();

            if (selectedObj && selectedObj.type === 'ring' && selectedObj.id === this.id) {
                ctx.shadowColor = "#FFD700";
                ctx.shadowBlur = 15;
                ctx.strokeStyle = "#FFD700";
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.moveTo(-this.r, 0);
            ctx.lineTo(this.r, 0);
            ctx.stroke();
            this.drawScale(ctx, this.r, t);
            ctx.restore();
        }
        if (appSettings.showHitboxes || debugMode) {
            ctx.beginPath();
            ctx.arc(this.pivotX, this.pivotY, this.r, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,0,0,0.1)";
            ctx.fill();
            ctx.strokeStyle = "rgba(255,0,0,0.5)";
            ctx.stroke();
        }

        if (appSettings.showRingPin) this.drawPin(ctx, t);

        if (appSettings.showOrbit && !appSettings.showRingPin && !appSettings.showRingBody) {
            ctx.beginPath();
            ctx.arc(this.pivotX, this.pivotY, 6, 0, Math.PI * 2);
            ctx.fillStyle = t.primary;
            ctx.globalAlpha = 0.5;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
    drawScale(ctx, r, t) {
        if (appSettings.lowPower) {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `600 ${r * 0.13}px ${t.cachedFontFamily}`;
            ctx.fillStyle = t.c_text;
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(-r, 0);
            ctx.stroke();
            return;
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const scale = appSettings.textScale || 1.0;
        const fs = Math.max(9, r * 0.13) * scale;
        ctx.font = `600 ${fs}px ${t.cachedFontFamily}`;
        ctx.fillStyle = t.c_text;

        ctx.beginPath();
        for (let i = 0; i <= 180; i++) {
            const rad = (i * Math.PI) / 180;
            const c = Math.cos(rad);
            const s = Math.sin(rad);
            let l = 0;
            if (i % 30 === 0) l = r * 0.15;
            else if (i % 10 === 0) l = r * 0.10;
            if (l > 0) {
                ctx.moveTo(r * c, r * s);
                ctx.lineTo((r - l) * c, (r - l) * s);
            }
        }
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = t.c_line;
        ctx.stroke();

        for (let i = 0; i <= 180; i += 45) {
            const rad = (i * Math.PI) / 180;
            const c = Math.cos(rad);
            const s = Math.sin(rad);
            const td = r * 0.65;
            ctx.save();
            ctx.translate(td * c, td * s);
            ctx.rotate(rad + Math.PI / 2);
            ctx.fillText(i, 0, 0);
            ctx.restore();
        }
    }
    drawPin(ctx, t) {
        ctx.beginPath();
        ctx.arc(this.pivotX, this.pivotY, this.r * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = t.c_pin;
        ctx.fill();
        ctx.strokeStyle = t.c_bg;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (hoveredPinID === this.id || activeStringStartID === this.id) {
            ctx.beginPath();
            ctx.arc(this.pivotX, this.pivotY, this.r * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = t.primary;
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        if (this.slideLocked && appSettings.showOrbit) {
            ctx.fillStyle = "#ff3b30";
            ctx.beginPath();
            ctx.arc(this.pivotX + 8, this.pivotY - 8, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function initProtractors() {
    protractors = [];
    for (let i = 0; i < appSettings.protractorCount; i++) {
        const theta = (i / appSettings.protractorCount) * Math.PI * 2 - (Math.PI / 2);
        protractors.push(new HalfProtractor(i, theta + Math.PI / 2, theta));
    }
}

function drawCenterProtractor(ctx, t) {
    ctx.save();
    ctx.translate(centerX, centerY);
    const r = centerProtractorRadius;

    if (appSettings.showCenterBody) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = t.transparentCanvas ? 'rgba(255,255,255,0.1)' : t.c_bg;
        ctx.fill();
        ctx.strokeStyle = t.c_line;
        ctx.lineWidth = 2;
        ctx.stroke();
        if (!appSettings.lowPower) {
            const scale = appSettings.textScale || 1.0;
            ctx.font = `600 ${Math.max(9, r * 0.09) * scale}px ${t.cachedFontFamily}`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = t.c_text;

            ctx.beginPath();
            for (let i = 0; i < 360; i += 15) {
                const rad = (i * Math.PI) / 180;
                const c = Math.cos(rad);
                const s = Math.sin(rad);
                const l = (i % 30 === 0) ? r * 0.12 : r * 0.06;
                ctx.moveTo(r * c, r * s);
                ctx.lineTo((r - l) * c, (r - l) * s);
            }
            ctx.strokeStyle = t.c_text;
            ctx.stroke();

            for (let i = 0; i < 360; i += 45) {
                const rad = (i * Math.PI) / 180;
                const c = Math.cos(rad);
                const s = Math.sin(rad);
                const tr = r * 0.70;
                ctx.fillText(i, tr * c, tr * s);
            }
        }
    }
    if (appSettings.showHitboxes || debugMode) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,255,0.1)";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,0,0,255)";
        ctx.stroke();
    }

    if (appSettings.showCenterPin) {
        const isHover = (hoveredPinID === CENTER_ID || activeStringStartID === CENTER_ID);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = isHover ? t.primary : t.c_pin;
        ctx.fill();
        ctx.strokeStyle = t.c_bg;
        ctx.lineWidth = 3;
        ctx.stroke();
        if (isHover) {
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = t.primary;
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
    ctx.restore();
}

function drawFreePoints(ctx, t) {
    ctx.font = `bold 12px ${t.cachedFontFamily}`;

    freePoints.forEach(p => {
        const isHover = (hoveredPinID === p.id || activeStringStartID === p.id || draggingPoint === p);
        const isSelected = (selectedObj && selectedObj.type === 'point' && selectedObj.id === p.id);

        ctx.beginPath();
        ctx.arc(p.x, p.y, isHover || isSelected ? 9 : 6, 0, Math.PI * 2);
        if (p.locked) ctx.fillStyle = "#94a3b8";
        else ctx.fillStyle = t.primary;
        ctx.fill();

        if (isSelected) {
            ctx.shadowColor = "#FFD700";
            ctx.shadowBlur = 15;
            ctx.strokeStyle = "#FFD700";
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = t.transparentCanvas ? 'rgba(255,255,255,0.5)' : t.c_bg;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (isHover && !p.locked) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
            ctx.fillStyle = t.primary;
            ctx.globalAlpha = 0.2;
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
        if (p.stickCircleID != null) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
            ctx.strokeStyle = t.primary;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 2]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        ctx.fillStyle = t.c_text;
        ctx.fillText(p.label, p.x + 12, p.y - 12);
    });
}

function drawReadings(ctx, t) {
    hitZones = [];
    const map = {};
    strings.forEach(s => {
        if (!map[s.start]) map[s.start] = [];
        map[s.start].push(s.end);
        if (!map[s.end]) map[s.end] = [];
        map[s.end].push(s.start);
    });

    const norm = (a) => (a + Math.PI * 3) % (Math.PI * 2) - Math.PI;

    for (let vid in map) {
        const neighbors = map[vid];
        if (neighbors.length >= 2) {
            const vID = parseInt(vid);
            const vPos = getPinPos(vID);
            const isComplex = neighbors.length > 2;

            neighbors.sort((a, b) => {
                const pa = getPinPos(a);
                const pb = getPinPos(b);
                const angA = Math.atan2(pa.y - vPos.y, pa.x - vPos.x);
                const angB = Math.atan2(pb.y - vPos.y, pb.x - vPos.x);
                return angA - angB;
            });

            const loopLimit = (neighbors.length === 2) ? 1 : neighbors.length;

            for (let i = 0; i < loopLimit; i++) {
                const n1 = neighbors[i];
                const n2 = neighbors[(i + 1) % neighbors.length];
                const p1Pos = getPinPos(n1);
                const p2Pos = getPinPos(n2);

                const ang1 = Math.atan2(p1Pos.y - vPos.y, p1Pos.x - vPos.x);
                const ang2 = Math.atan2(p2Pos.y - vPos.y, p2Pos.x - vPos.x);

                let startAng = ang1;
                let endAng = ang2;
                let diff = endAng - startAng;

                if (diff <= -Math.PI) diff += 2 * Math.PI;
                if (diff > Math.PI) diff -= 2 * Math.PI;

                if (neighbors.length === 2) {
                    if (Math.abs(diff) > Math.PI) {
                        if (diff > 0) diff -= 2 * Math.PI;
                        else diff += 2 * Math.PI;
                    }
                } else {
                    if (diff < 0) diff += 2 * Math.PI;
                }

                let sweep = Math.abs(diff);
                let wedgeStart = (diff > 0) ? startAng : endAng;
                while (wedgeStart < 0) wedgeStart += 2 * Math.PI;
                while (wedgeStart >= 2 * Math.PI) wedgeStart -= 2 * Math.PI;

                let drawStart = wedgeStart;
                let drawEnd = wedgeStart + sweep;
                let displayDeg = sweep * 180 / Math.PI;

                if (vID < 100 && vID !== 999 && protractors[vID]) {
                    const p = protractors[vID];
                    const pRot = p.angle;
                    let localStart = wedgeStart - pRot;
                    while (localStart < 0) localStart += 2 * Math.PI;
                    while (localStart >= 2 * Math.PI) localStart -= 2 * Math.PI;
                    let localEnd = localStart + sweep;
                    const getOverlap = (s, e, min, max) => Math.max(0, Math.min(e, max) - Math.max(s, min));
                    let o1 = getOverlap(localStart, localEnd, 0, Math.PI);
                    let o2 = getOverlap(localStart, localEnd, 2 * Math.PI, 3 * Math.PI);

                    if (o1 > 0.0001) {
                        displayDeg = o1 * 180 / Math.PI;
                        drawStart = pRot + Math.max(localStart, 0);
                        drawEnd = drawStart + o1;
                    } else if (o2 > 0.0001) {
                        displayDeg = o2 * 180 / Math.PI;
                        drawStart = pRot + Math.max(localStart, 2 * Math.PI);
                        drawEnd = drawStart + o2;
                    } else {
                        displayDeg = 0;
                    }
                }

                if (displayDeg < 0.1) continue;

                let midAng = drawStart + (drawEnd - drawStart) / 2;
                const lblX = vPos.x + 50 * Math.cos(midAng);
                const lblY = vPos.y + 50 * Math.sin(midAng);

                ctx.beginPath();
                ctx.moveTo(vPos.x, vPos.y);
                ctx.arc(vPos.x, vPos.y, 40, drawStart, drawEnd, false);
                ctx.fillStyle = isComplex ? "rgba(100,100,100,0.15)" : t.primary;
                if (!isComplex) ctx.globalAlpha = 0.2;
                ctx.fill();
                ctx.globalAlpha = 1.0;

                const txt = displayDeg.toFixed(1) + "°";
                const w = ctx.measureText(txt).width + 16;
                ctx.beginPath();
                drawRoundRect(ctx, lblX - w / 2, lblY - 12, w, 24, 8);
                ctx.fillStyle = t.c_bg;
                ctx.fill();
                ctx.strokeStyle = t.primary;
                ctx.lineWidth = 1;
                if (isComplex) ctx.setLineDash([2, 2]);
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.fillStyle = t.text;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                if (isComplex) ctx.globalAlpha = 0.6;
                ctx.fillText(txt, lblX, lblY);
                ctx.globalAlpha = 1.0;

                hitZones.push({
                    x: lblX,
                    y: lblY,
                    w: w,
                    h: 24,
                    deg: displayDeg,
                    v: vID,
                    p1: n1,
                    p2: n2,
                    locked: isComplex
                });
            }
        }
    }
}

function draw() {
    renderRequested = false;
    if (!activeTheme) applyTheme();
    const t = activeTheme;
    syncStuckPoints();

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    if (appSettings.infiniteBoard) {
        ctx.translate(camera.camX * camera.zoom, camera.camY * camera.zoom);
        ctx.scale(camera.zoom, camera.zoom);
    }

    const btnEdit = document.getElementById('btn-edit-selected');
    if (selectedObj && !(selectedObj.type === 'angle' && selectedObj.data.locked)) {
        btnEdit.classList.remove('hidden');
    } else {
        btnEdit.classList.add('hidden');
    }

    if (appSettings.showGrid) {
        ctx.fillStyle = t.c_grid;
        ctx.strokeStyle = t.c_grid;
        const size = appSettings.gridSize || 40;
        let minX = 0, maxX = width, minY = 0, maxY = height;
        if (appSettings.infiniteBoard) {
            const a = screenToWorld(0, 0);
            const b = screenToWorld(width, height);
            minX = Math.min(a.x, b.x);
            maxX = Math.max(a.x, b.x);
            minY = Math.min(a.y, b.y);
            maxY = Math.max(a.y, b.y);
        }
        if (t.gridType === 'dots' && !appSettings.lowPower) {
            const sx = Math.floor(minX / size) * size;
            const sy = Math.floor(minY / size) * size;
            for (let x = sx; x < maxX + size; x += size) {
                for (let y = sy; y < maxY + size; y += size) {
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else {
            ctx.lineWidth = 1;
            ctx.beginPath();
            const sx = Math.floor(minX / size) * size;
            const sy = Math.floor(minY / size) * size;
            for (let x = sx; x < maxX + size; x += size) {
                ctx.moveTo(x, minY);
                ctx.lineTo(x, maxY);
            }
            for (let y = sy; y < maxY + size; y += size) {
                ctx.moveTo(minX, y);
                ctx.lineTo(maxX, y);
            }
            ctx.stroke();
        }
    }

    if (appSettings.showOrbit) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, boardRadius, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = t.primary;
        ctx.globalAlpha = appSettings.orbitOpacity;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    ctx.shadowBlur = appSettings.lowPower ? 0 : (t.glow || 0);
    ctx.shadowColor = t.primary;
    drawCenterProtractor(ctx, t);
    protractors.forEach(p => p.draw(ctx, t));
    drawFreePoints(ctx, t);
    ctx.shadowBlur = 0;
    ctx.lineCap = 'round';
    circles.forEach(c => {
        const center = getPinPos(c.centerID);
        if (!center) return;
        ctx.beginPath();
        ctx.arc(center.x, center.y, c.radius, 0, Math.PI * 2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = t.c_line;
        ctx.stroke();
    });
    strings.forEach(l => {
        const p1 = getPinPos(l.start);
        const p2 = getPinPos(l.end);
        if (!p1 || !p2) return;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = t.c_bg;
        ctx.stroke();
        ctx.strokeStyle = t.c_line;
        ctx.lineWidth = 3;
        ctx.stroke();
    });
    ctx.shadowBlur = appSettings.lowPower ? 0 : (t.glow || 0);
    ctx.shadowColor = t.primary;
    drawReadings(ctx, t);

    if ((isDrawingLasso || lassoPoints.length > 0) && currentTool === 'lasso') {
        ctx.save();

        if (lassoPoints.length >= 3) {
            ctx.beginPath();
            ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
            for (let i = 1; i < lassoPoints.length; i++) ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
            if (!isDrawingLasso) ctx.closePath();
            ctx.fillStyle = t.primary;
            ctx.globalAlpha = 0.07;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.shadowBlur = 0;
        ctx.lineWidth = 2;
        ctx.strokeStyle = t.primary;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        if (lassoPoints.length > 0) {
            ctx.moveTo(lassoPoints[0].x, lassoPoints[0].y);
            for (let i = 1; i < lassoPoints.length; i++) ctx.lineTo(lassoPoints[i].x, lassoPoints[i].y);
            if (isDrawingLasso) ctx.lineTo(ptrX, ptrY);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        selectedByLasso.forEach(pointId => {
            const point = freePoints.find(fp => fp.id === pointId);
            if (!point) return;
            const ringRadius = 10;
            ctx.beginPath();
            ctx.arc(point.x, point.y, ringRadius + 3, 0, Math.PI * 2);
            ctx.strokeStyle = t.primary;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(point.x, point.y, ringRadius, 0, Math.PI * 2);
            ctx.fillStyle = t.primary;
            ctx.globalAlpha = 0.18;
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        if (!isDrawingLasso && selectedByLasso.length > 0) {
            const b = getLassoBounds();
            if (b) {
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = t.primary;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.rect(b.minX, b.minY, b.w, b.h);
                ctx.stroke();
                ctx.setLineDash([]);

                const handleX = b.maxX + LASSO_RESIZE_MARGIN;
                const handleY = b.maxY + LASSO_RESIZE_MARGIN;
                ctx.beginPath();
                ctx.arc(handleX, handleY, LASSO_RESIZE_HANDLE_SIZE, 0, Math.PI * 2);
                ctx.fillStyle = t.surface;
                ctx.fill();
                ctx.strokeStyle = t.primary;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = t.c_text;
                ctx.font = `700 10px ${t.cachedFontFamily}`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("↘", handleX, handleY);
            }
        }

        ctx.restore();
    }

    if (activeStringStartID !== null) {
        const startID = activeStringStartID;
        const p1 = getPinPos(startID);
        let targetX = ptrX;
        let targetY = ptrY;
        if (hoveredPinID !== null && hoveredPinID !== startID) {
            const targetPos = getPinPos(hoveredPinID);
            targetX = targetPos.x;
            targetY = targetPos.y;
            ctx.beginPath();
            ctx.arc(targetX, targetY, 25, 0, Math.PI * 2);
            ctx.strokeStyle = t.primary;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        if (currentTool === 'line') {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(targetX, targetY);
            ctx.strokeStyle = t.primary;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (currentTool === 'corner') {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(targetX, p1.y);
            ctx.lineTo(targetX, targetY);
            ctx.strokeStyle = t.primary;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(targetX, p1.y, 4, 0, Math.PI * 2);
            ctx.fillStyle = t.primary;
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(targetX, targetY);
            ctx.strokeStyle = t.c_line;
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
    if (currentTool === 'circle' && activeCircleCenterID !== null) {
        const c0 = getPinPos(activeCircleCenterID);
        const radius = Math.hypot(ptrX - c0.x, ptrY - c0.y);
        ctx.beginPath();
        ctx.arc(c0.x, c0.y, radius, 0, Math.PI * 2);

        const dragAngle = Math.atan2(ptrY - c0.y, ptrX - c0.x);
        const time = performance.now() * 0.003;
        const wave1 = Math.sin(time - dragAngle * 1.8) * 0.4;
        const wave2 = Math.sin(time * 0.7 + dragAngle * 1.2) * 0.2;
        const wave3 = Math.sin(time * 1.3 - dragAngle * 0.9) * 0.1;
        const combinedWave = wave1 + wave2 + wave3;
        const pulseFactor = 1 + combinedWave * 0.3;
        const baseWidth = 2.0;
        const widthVariation = 0.6;
        ctx.lineWidth = baseWidth + widthVariation * (pulseFactor - 1);
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = t.primary;
        ctx.stroke();
        ctx.setLineDash([]);
    }
    if (currentTool === 'midpoint' && midpointStartID !== null) {
        const a = getPinPos(midpointStartID);
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(ptrX, ptrY);
        ctx.strokeStyle = t.primary;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc((a.x + ptrX) * 0.5, (a.y + ptrY) * 0.5, 5, 0, Math.PI * 2);
        ctx.fillStyle = t.primary;
        ctx.fill();
    }
    if (currentTool === 'perpendicular' && perpendicularRefSegment) {
        const s = perpendicularRefSegment.data;
        const a = getPinPos(s.start);
        const b = getPinPos(s.end);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const mag = Math.hypot(dx, dy) || 1;
        const ux = -dy / mag;
        const uy = dx / mag;
        const len = Math.max(120, Math.min(width, height) * 0.35);
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(ptrX - ux * len, ptrY - uy * len);
        ctx.lineTo(ptrX + ux * len, ptrY + uy * len);
        ctx.strokeStyle = t.primary;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
    }
    ctx.restore();
    updateDebug();
}

function getAllConnectedAngles(pid) {
    let angs = [];
    const origin = getPinPos(pid);
    const halfCount = appSettings.protractorCount / 2;
    strings.forEach(s => {
        let targetID;
        if (s.start === pid) targetID = s.end; else if (s.end === pid) targetID = s.start;
        if (pid === CENTER_ID && Math.abs(s.start - s.end) === halfCount) {
            let pStart = protractors[s.start];
            let pEnd = protractors[s.end];
            let ang1 = Math.atan2(pStart.pivotY - centerY, pStart.pivotX - centerX);
            if (ang1 < 0) ang1 += Math.PI * 2;
            angs.push(ang1);
            let ang2 = Math.atan2(pEnd.pivotY - centerY, pEnd.pivotX - centerX);
            if (ang2 < 0) ang2 += Math.PI * 2;
            angs.push(ang2);
        }
        if (targetID !== undefined) {
            const tPos = getPinPos(targetID);
            let a = Math.atan2(tPos.y - origin.y, tPos.x - origin.x);
            if (a < 0) a += Math.PI * 2;
            angs.push(a);
        }
    });
    return [...new Set(angs.map(a => parseFloat(a.toFixed(5))))].sort((a, b) => a - b);
}

function autoAlign() {
    protractors.forEach(p => {
        const angs = getAllConnectedAngles(p.id);
        if (angs.length > 0) {
            if (angs.length === 1) {
                p.angle = angs[0];
            } else {
                let maxG = 0, best = angs[0];
                for (let i = 0; i < angs.length; i++) {
                    let g = angs[(i + 1) % angs.length] - angs[i];
                    if (g < 0) g += Math.PI * 2;
                    if (g > maxG) {
                        maxG = g;
                        best = angs[(i + 1) % angs.length];
                    }
                }
                p.angle = best;
            }
        }
    });
    requestDraw();
}

window.HalfProtractor = HalfProtractor;
window.initProtractors = initProtractors;
window.drawCenterProtractor = drawCenterProtractor;
window.drawFreePoints = drawFreePoints;
window.drawReadings = drawReadings;
window.draw = draw;
window.clamp = clamp;
window.pointInPolygon = pointInPolygon;
window.computePolygonAngle = computePolygonAngle;
window.solveTrianglePoint = solveTrianglePoint;
window.solveVertexPosition = solveVertexPosition;
window.getPinPos = getPinPos;
window.getCurrentAngleAtVertex = getCurrentAngleAtVertex;
window.getConnectedNeighbors = getConnectedNeighbors;
window.getPolygonFromVertex = getPolygonFromVertex;
window.getAllConnectedAngles = getAllConnectedAngles;
window.autoAlign = autoAlign;