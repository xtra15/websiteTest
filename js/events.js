function getPointer(e) {
    const r = canvas.getBoundingClientRect();
    const cx0 = e.touches ? e.touches[0].clientX : e.clientX;
    const cy0 = e.touches ? e.touches[0].clientY : e.clientY;
    if (r.width === 0) return {x:0, y:0};
    const cx = clamp(cx0, r.left, r.right);
    const cy = clamp(cy0, r.top, r.bottom);
    const sx = (cx - r.left) * (width / r.width);
    const sy = (cy - r.top) * (height / r.height);
    return screenToWorld(sx, sy);
}
function worldToScreen(x, y) {
    if (!appSettings.infiniteBoard) return {x, y};
    return { x: (x + camera.camX) * camera.zoom, y: (y + camera.camY) * camera.zoom };
}
function screenToWorld(x, y) {
    if (!appSettings.infiniteBoard) return {x, y};
    return { x: (x / camera.zoom) - camera.camX, y: (y / camera.zoom) - camera.camY };
}
function getSegmentAt(x, y, threshold = 14) {
    for (let i = strings.length - 1; i >= 0; i--) {
        const s = strings[i];
        const a = getPinPos(s.start);
        const b = getPinPos(s.end);
        if (!a || !b) continue;
        const l2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        if (l2 < 0.001) continue;
        let t = ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const px = a.x + t * (b.x - a.x);
        const py = a.y + t * (b.y - a.y);
        if (Math.hypot(x - px, y - py) <= threshold) return { type: 'segment', idx: i, data: s };
    }
    return null;
}
function getCanvasCircleAt(x, y, threshold = 14) {
    for (let i = circles.length - 1; i >= 0; i--) {
        const c = circles[i];
        const center = getPinPos(c.centerID);
        if (!center) continue;
        const d = Math.hypot(x - center.x, y - center.y);
        if (Math.abs(d - c.radius) <= threshold) return { type: 'circle', idx: i, data: c };
    }
    return null;
}
function getGeometryObjectAt(x, y) {
    const seg = getSegmentAt(x, y);
    if (seg) return seg;
    const cir = getCanvasCircleAt(x, y);
    if (cir) return cir;
    return null;
}
function addFreePointAt(x, y, type = 'free') {
    const label = String.fromCharCode(65 + (freePoints.length % 26));
    const id = uniquePointID++;
    freePoints.push({id, x, y, locked: false, label, type, stickCircleID: null, stickAngle: null});
    return id;
}
function getLassoBounds() {
    if (!lassoPoints || lassoPoints.length === 0) return null;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    lassoPoints.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });
    if (!Number.isFinite(minX)) return null;
    return { minX, maxX, minY, maxY, cx: (minX + maxX) * 0.5, cy: (minY + maxY) * 0.5, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
}
function lineLineIntersections(s1, s2) {
    const a = getPinPos(s1.start), b = getPinPos(s1.end), c = getPinPos(s2.start), d = getPinPos(s2.end);
    const den = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
    if (Math.abs(den) < 0.000001) return [];
    const px = ((a.x*b.y - a.y*b.x)*(c.x-d.x) - (a.x-b.x)*(c.x*d.y-c.y*d.x)) / den;
    const py = ((a.x*b.y - a.y*b.x)*(c.y-d.y) - (a.y-b.y)*(c.x*d.y-c.y*d.x)) / den;
    const onSeg = (p, q, r) => q >= Math.min(p, r)-0.01 && q <= Math.max(p, r)+0.01;
    const valid = onSeg(a.x, px, b.x) && onSeg(a.y, py, b.y) && onSeg(c.x, px, d.x) && onSeg(c.y, py, d.y);
    return valid ? [{x: px, y: py}] : [];
}
function lineCircleIntersections(s, cObj) {
    const a = getPinPos(s.start), b = getPinPos(s.end), center = getPinPos(cObj.centerID);
    const dx = b.x - a.x, dy = b.y - a.y;
    const fx = a.x - center.x, fy = a.y - center.y;
    const A = dx*dx + dy*dy;
    const B = 2*(fx*dx + fy*dy);
    const C = fx*fx + fy*fy - cObj.radius*cObj.radius;
    const disc = B*B - 4*A*C;
    if (disc < 0) return [];
    const sqrtD = Math.sqrt(Math.max(0, disc));
    const t1 = (-B - sqrtD) / (2*A);
    const t2 = (-B + sqrtD) / (2*A);
    const pts = [];
    [t1, t2].forEach(t => {
        if (t >= -0.001 && t <= 1.001) pts.push({x: a.x + t*dx, y: a.y + t*dy});
    });
    return pts;
}
function circleCircleIntersections(c1, c2) {
    const p0 = getPinPos(c1.centerID), p1 = getPinPos(c2.centerID);
    const d = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    if (d < 0.0001 || d > c1.radius + c2.radius || d < Math.abs(c1.radius - c2.radius)) return [];
    const a = (c1.radius*c1.radius - c2.radius*c2.radius + d*d) / (2*d);
    const h2 = c1.radius*c1.radius - a*a;
    if (h2 < -0.0001) return [];
    const h = Math.sqrt(Math.max(0, h2));
    const x2 = p0.x + a*(p1.x-p0.x)/d;
    const y2 = p0.y + a*(p1.y-p0.y)/d;
    const rx = -(p1.y - p0.y) * (h / d);
    const ry = (p1.x - p0.x) * (h / d);
    if (h < 0.0001) return [{x: x2, y: y2}];
    return [{x: x2 + rx, y: y2 + ry}, {x: x2 - rx, y: y2 - ry}];
}

function getIDAt(x,y) {
    if (currentTool === 'lasso') {
        if (activeStringStartID === null) {
            for(let z of hitZones) {
                if (Math.abs(x - z.x) < z.w/2 + 5 && Math.abs(y - z.y) < z.h/2 + 5) return { type: 'angle', data: z };
            }
        }
    }
    for(let p of freePoints) {
        if(Math.hypot(x - p.x, y - p.y) < 45) return p.id;
    }
    if(appSettings.showCenterPin && Math.hypot(x-centerX, y-centerY) < centerProtractorRadius * 0.6) return CENTER_ID;
    if (appSettings.showRingPin) {
        for(let p of protractors) if(Math.hypot(x-p.pivotX, y-p.pivotY) < protractorRadius * 0.6) return p.id;
    }
    if (activeStringStartID === null) {
        for(let z of hitZones) {
            if (Math.abs(x - z.x) < z.w/2 + 5 && Math.abs(y - z.y) < z.h/2 + 5) return { type: 'angle', data: z };
        }
    }
    return null;
}

function checkCircleHit(x,y) {
    if (appSettings.showRingPin || appSettings.showOrbit) {
        for(let i=protractors.length-1; i>=0; i--) {
            if(Math.hypot(x-protractors[i].pivotX, y-protractors[i].pivotY) < 30) return protractors[i].id;
        }
    }
    if (appSettings.showRingBody) {
        for(let i=protractors.length-1; i>=0; i--) {
            if(Math.hypot(x-protractors[i].pivotX, y-protractors[i].pivotY)<protractors[i].r) return protractors[i].id;
        }
    }
    if(appSettings.showCenterBody && Math.hypot(x-centerX, y-centerY) < centerObj.r) return CENTER_ID;
    return null;
}

function getDistToSegment(p, v, w) {
    const px = p.pivotX, py = p.pivotY;
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 == 0) return Math.hypot(px - v.x, py - v.y);
    let t = ((px - v.x) * (w.x - v.x) + (py - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (v.x + t * (w.x - v.x)), py - (v.y + t * (w.y - v.y)));
}

function handleRelease(p) {
    let releaseX = p.x;
    let releaseY = p.y;
    isPanning = false;

    if (currentTool === 'line' && activeStringStartID !== null) {
        const startP = getPinPos(activeStringStartID);
        const dx = releaseX - startP.x;
        const dy = releaseY - startP.y;
        if (Math.abs(dx) > Math.abs(dy)) releaseY = startP.y;
        else releaseX = startP.x;
    }

    if (appSettings.showOrbit && activeStringStartID !== null) {
        const dCenter = Math.hypot(releaseX - centerX, releaseY - centerY);
        if (Math.abs(dCenter - boardRadius) < 30) {
            const ang = Math.atan2(releaseY - centerY, releaseX - centerX);
            releaseX = centerX + boardRadius * Math.cos(ang);
            releaseY = centerY + boardRadius * Math.sin(ang);
        }
    }

    if (currentTool === 'line' && activeStringStartID !== null) {
        if (!Number.isFinite(releaseX) || !Number.isFinite(releaseY)) {
            activeStringStartID = null;
            showToast("Line Cancelled");
            playFeedback('error');
            return;
        }
        const endID = uniquePointID++;
        const label = String.fromCharCode(65 + (freePoints.length % 26));
        freePoints.push({id: endID, x: releaseX, y: releaseY, locked: false, label, type: 'line', stickCircleID: null, stickAngle: null});
        strings.push({start: activeStringStartID, end: endID});
        emitHaptic(14);
        playFeedback('place');
        showToast("Line Created");
        activeStringStartID = null;
        requestDraw();
        return;
    }

    if (currentTool === 'lasso' && isDrawingLasso) {
        isDrawingLasso = false;
        if (lassoPoints.length > 0 &&
            (lassoPoints[0].x !== lassoPoints[lassoPoints.length - 1].x ||
             lassoPoints[0].y !== lassoPoints[lassoPoints.length - 1].y)) {
            lassoPoints.push({x: lassoStartPoint.x, y: lassoStartPoint.y});
        }

        selectedByLasso = [];
        if (lassoPoints.length >= 3) {
            freePoints.forEach(point => {
                if (point.type !== 'circle-center' && pointInPolygon(point, lassoPoints)) {
                    selectedByLasso.push(point.id);
                }
            });
        } else {
            lassoPoints = [];
        }
        ensureLassoAnimationLoop();
        showToast(`Selected ${selectedByLasso.length} points - drag to move`);
        requestDraw();
        return;
    }
    if (currentTool === 'lasso' && lassoDragStartPoint) {
        lassoDragStartPoint = null;
        lassoOriginalPositions = {};
        emitHaptic(10);
        ensureLassoAnimationLoop();
    }
    if (currentTool === 'lasso' && lassoResizeMode) {
        lassoResizeMode = null;
        lassoResizeStartBounds = null;
        lassoResizeLassoSnapshot = [];
        lassoResizePointSnapshot = {};
        emitHaptic(10);
    }
    if (currentTool === 'circle' && activeCircleCenterID !== null) {
        const c0 = getPinPos(activeCircleCenterID);
        const radius = Math.hypot(releaseX - c0.x, releaseY - c0.y);
        if (radius > 2) {
            circles.push({ id: uniqueCircleID++, centerID: activeCircleCenterID, radius });
            emitHaptic(16);
            playFeedback('place');
            showToast("Circle Created");
        }
        activeCircleCenterID = null;
        requestDraw();
        return;
    }

    if (currentTool === 'corner' && activeStringStartID !== null) {
        const startP = getPinPos(activeStringStartID);
        const cornerID = uniquePointID++;
        const labelB = String.fromCharCode(65 + (freePoints.length % 26));
        freePoints.push({id: cornerID, x: releaseX, y: startP.y, locked: false, label: labelB, type: 'corner', stickCircleID: null, stickAngle: null});
        const endID = uniquePointID++;
        const labelC = String.fromCharCode(65 + (freePoints.length % 26));
        freePoints.push({id: endID, x: releaseX, y: releaseY, locked: false, label: labelC, type: 'corner', stickCircleID: null, stickAngle: null});
        strings.push({start: activeStringStartID, end: cornerID});
        strings.push({start: cornerID, end: endID});
        showToast("Corner Created");
        activeStringStartID = null;
        requestDraw();
        return;
    }

    if (activeStringStartID !== null) {
        const hit = getIDAt(p.x, p.y);
        if (hit !== null && typeof hit === 'number' && hit !== activeStringStartID) {
            const pStart = getPinPos(activeStringStartID);
            const pEnd = getPinPos(hit);
            let intermediateID = null;

            if (appSettings.showCenterPin && activeStringStartID !== CENTER_ID && hit !== CENTER_ID) {
                if (getDistToSegment(centerObj, pStart, pEnd) < 45) intermediateID = CENTER_ID;
            }

            const exists = (a, b) => strings.some(s => (s.start === a && s.end === b) || (s.start === b && s.end === a));

            if (intermediateID !== null) {
                let added = false;
                if (!exists(activeStringStartID, intermediateID)) { strings.push({start: activeStringStartID, end: intermediateID}); added = true; }
                if (!exists(intermediateID, hit)) { strings.push({start: intermediateID, end: hit}); added = true; }
                if (added) showToast("Linked via Center");
            } else {
                if (!exists(activeStringStartID, hit)) {
                    strings.push({start: activeStringStartID, end: hit});
                    showToast("Connected");
                }
            }

            if (!appSettings.showRingBody) {
                const nodesToCheck = [activeStringStartID, hit];
                if (intermediateID !== null) nodesToCheck.push(intermediateID);
                nodesToCheck.forEach(pid => {
                    if (pid < 100 && pid !== CENTER_ID) {
                        const p = protractors[pid];
                        const angs = getAllConnectedAngles(p.id);
                        if (angs.length > 0) {
                            if (angs.length === 1) p.angle = angs[0];
                            else {
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
                    }
                });
            }
        }
        activeStringStartID = null;
        requestDraw();
    }
    draggingProtractor = null;
    draggingPoint = null;
    requestDraw();
}

window.getPointer = getPointer;
window.worldToScreen = worldToScreen;
window.screenToWorld = screenToWorld;
window.getSegmentAt = getSegmentAt;
window.getCanvasCircleAt = getCanvasCircleAt;
window.getGeometryObjectAt = getGeometryObjectAt;
window.addFreePointAt = addFreePointAt;
window.getLassoBounds = getLassoBounds;
window.lineLineIntersections = lineLineIntersections;
window.lineCircleIntersections = lineCircleIntersections;
window.circleCircleIntersections = circleCircleIntersections;
window.getIDAt = getIDAt;
window.checkCircleHit = checkCircleHit;
window.getDistToSegment = getDistToSegment;
window.handleRelease = handleRelease;
