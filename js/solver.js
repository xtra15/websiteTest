// www/js/solver.js
// Angle solver functions extracted from index.html

function openInputModal() {
    if (!selectedObj) { showToast("Select an object first"); return; }

    const modal = document.getElementById('input-modal');
    const title = document.getElementById('input-title');
    const desc = document.getElementById('input-desc');

    const contAngle = document.getElementById('input-container-angle');
    const contOrbit = document.getElementById('input-container-orbit');
    const contPoint = document.getElementById('input-container-point');
    const contSolver = document.getElementById('input-container-solver');

    contAngle.style.display = 'none';
    contOrbit.style.display = 'none';
    contPoint.style.display = 'none';
    contSolver.style.display = 'none';

    if (selectedObj.type === 'ring') {
        title.innerText = "Edit Ring";
        desc.innerText = "Slide Limits & Rotation";
        contAngle.style.display = 'block';
        contOrbit.style.display = 'block';

        const p = protractors[selectedObj.id];

        // Rotation
        let currentAng = (p.angle * 180 / Math.PI) % 360;
        if (currentAng < 0) currentAng += 360;
        document.getElementById('inp-angle').value = currentAng.toFixed(1);

        // Orbit
        document.getElementById('inp-orbit-lock').checked = p.slideLocked;
        document.getElementById('inp-orbit-min').value = p.minOrbit !== null ? p.minOrbit : "";
        document.getElementById('inp-orbit-max').value = p.maxOrbit !== null ? p.maxOrbit : "";
    }
    else if (selectedObj.type === 'point') {
        title.innerText = "Edit Point";
        desc.innerText = "Set Distance & Angle";
        contPoint.style.display = 'block';
        const p = freePoints.find(fp => fp.id === selectedObj.id);
        if(p) {
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            let ang = Math.atan2(dy, dx) * (180 / Math.PI);
            if (ang < 0) ang += 360;

            document.getElementById('inp-dist').value = Math.round(dist);
            document.getElementById('inp-angle-pt').value = ang.toFixed(1);
            document.getElementById('inp-point-lock').checked = !!p.locked;
        }
    }
    else if (selectedObj.type === 'angle') {
        title.innerText = "Solve Angle";
        desc.innerText = "Adjust point to match angle";
        contSolver.style.display = 'block';

        document.getElementById('inp-solver-target').value = selectedObj.data.deg.toFixed(1);

        const p1 = getPointObj(selectedObj.data.p1);
        const p2 = getPointObj(selectedObj.data.p2);
        document.getElementById('lbl-sol-1').innerText = p1 ? `(Point ${p1.label})` : "(A)";
        document.getElementById('lbl-sol-2').innerText = p2 ? `(Point ${p2.label})` : "(B)";

        setSolveMode(1);

        // Attach real-time status updater for mode 3
        const targetInput = document.getElementById('inp-solver-target');
        targetInput.oninput = updateSolverStatus;
    }

    document.getElementById('overlay').classList.add('active');
    modal.classList.add('active');
}

function setSolveMode(m) {
    solveMode = m;
    document.getElementById('btn-sol-1').className = m===1 ? 'solver-opt active' : 'solver-opt';
    document.getElementById('btn-sol-2').className = m===2 ? 'solver-opt active' : 'solver-opt';
    document.getElementById('btn-sol-3').className = m===3 ? 'solver-opt active' : 'solver-opt';
    updateSolverStatus();
}

function getPointObj(id) {
    if(id === CENTER_ID) return {label:"Center", x:centerX, y:centerY};
    if(id < 100) return {label:"R"+(id+1)};
    return freePoints.find(p => p.id === id);
}

// Update the solver status div based on mode and input
function updateSolverStatus() {
    const status = document.getElementById('solver-status');
    const locksDiv = document.getElementById('solver-locks');
    const locksList = document.getElementById('solver-locks-list');
    const mode3Container = document.getElementById('mode3-points-container');
    const mode3List = document.getElementById('mode3-points-list');

    if (!status || !locksDiv || !locksList) return;

    if (solveMode !== 3) {
        locksDiv.style.display = 'none';
        status.innerHTML = '';
        mode3Container.style.display = 'none';
        return;
    }

    if (!selectedObj || selectedObj.type !== 'angle') {
        locksDiv.style.display = 'none';
        status.innerHTML = '';
        mode3Container.style.display = 'none';
        return;
    }

    const z = selectedObj.data;
    const vID = z.v;
    const p1ID = z.p1;
    const p2ID = z.p2;

    const polygon = getPolygonFromVertex(vID, p1ID, p2ID);
    if (!polygon) {
        locksDiv.style.display = 'none';
        status.innerHTML = '<span style="color:#ff3b30">Error: open or ambiguous shape</span>';
        mode3Container.style.display = 'none';
        return;
    }

    const n = polygon.length;

    locksDiv.style.display = 'none';
    mode3Container.style.display = 'block';
    mode3List.innerHTML = '';

    const pos = {};
    polygon.forEach(pid => { pos[pid] = getPinPos(pid); });

    const angles = {};
    for (let i = 0; i < n; i++) {
        const curr = polygon[i];
        const prev = polygon[(i - 1 + n) % n];
        const next = polygon[(i + 1) % n];
        angles[curr] = computePolygonAngle(pos[prev], pos[curr], pos[next]) * 180 / Math.PI;
    }

    polygon.forEach((pid, idx) => {
        if (pid === vID) return;

        const pObj = getPointObj(pid);
        const isRing = pid < 100;
        const label = pObj ? (isRing ? `Ring ${pid+1}` : `Point ${pObj.label}`) : `Point ${pid}`;
        const currentAng = angles[pid] || 0;

        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '8px';
        row.style.padding = '6px 0';
        row.style.borderBottom = '1px solid rgba(0,0,0,0.05)';

        const labelSpan = document.createElement('span');
        labelSpan.innerText = label;
        labelSpan.style.fontWeight = '600';

        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'popup-input';
        input.value = currentAng.toFixed(1);
        input.step = '0.1';
        input.style.width = '60px';
        input.style.padding = '4px';
        input.style.fontSize = '0.85rem';
        input.dataset.vertexId = pid;

        const lockCb = document.createElement('input');
        lockCb.type = 'checkbox';
        lockCb.checked = false;
        lockCb.disabled = isRing;
        lockCb.dataset.vertexId = pid;
        lockCb.title = isRing ? 'Ring pin (fixed - cannot move)' : 'Lock to prevent moving';

        row.appendChild(labelSpan);
        row.appendChild(input);
        row.appendChild(lockCb);

        mode3List.appendChild(row);
    });

    status.innerHTML = `Polygon: ${n} sides detected. Enter angle for each point:`;
}

function applyInput() {
    if (!selectedObj) return;

    if (selectedObj.type === 'ring') {
        const p = protractors[selectedObj.id];

        const val = parseFloat(document.getElementById('inp-angle').value);
        if (!isNaN(val)) {
            let rad = (val * Math.PI) / 180;
            p.angle = rad;
        }

        p.slideLocked = document.getElementById('inp-orbit-lock').checked;
        const minV = parseFloat(document.getElementById('inp-orbit-min').value);
        const maxV = parseFloat(document.getElementById('inp-orbit-max').value);
        p.minOrbit = !isNaN(minV) ? minV : null;
        p.maxOrbit = !isNaN(maxV) ? maxV : null;

        showToast("Ring Updated");
    }
    else if (selectedObj.type === 'point') {
        const dist = parseFloat(document.getElementById('inp-dist').value);
        const angDeg = parseFloat(document.getElementById('inp-angle-pt').value);

        if (!isNaN(dist) && !isNaN(angDeg)) {
            const p = freePoints.find(fp => fp.id === selectedObj.id);
            if (p) {
                const angRad = (angDeg * Math.PI) / 180;
                p.x = centerX + dist * Math.cos(angRad);
                p.y = centerY + dist * Math.sin(angRad);
                p.locked = document.getElementById('inp-point-lock').checked;
                showToast("Point Moved");
            }
        }
    }
    else if (selectedObj.type === 'angle') {
        const val = parseFloat(document.getElementById('inp-solver-target').value);
        if(!isNaN(val)) {
            const z = selectedObj.data;
            const targetRad = val * (Math.PI / 180);

            const vID = z.v;
            const vPos = getPinPos(vID);

            const getPointInfo = (pid) => {
                const pos = getPinPos(pid);
                const dist = Math.hypot(pos.x - vPos.x, pos.y - vPos.y);
                const ang = Math.atan2(pos.y - vPos.y, pos.x - vPos.x);
                return { pos, dist, ang, id: pid };
            };

            const p1Info = getPointInfo(z.p1);
            const p2Info = getPointInfo(z.p2);

            if (solveMode === 1 || solveMode === 2) {
                const moveID = solveMode === 1 ? z.p1 : z.p2;
                const fixedPos = solveMode === 1 ? p2Info.pos : p1Info.pos;
                const moveInfo = solveMode === 1 ? p1Info : p2Info;

                const thetaFixed = Math.atan2(fixedPos.y - vPos.y, fixedPos.x - vPos.x);
                const thetaMoveOld = moveInfo.ang;
                let diff = thetaMoveOld - thetaFixed;
                if(diff < -Math.PI) diff += 2*Math.PI;
                if(diff > Math.PI) diff -= 2*Math.PI;
                const sign = diff >= 0 ? 1 : -1;

                const thetaNew = thetaFixed + (sign * targetRad);

                if (moveID >= 2000) {
                    const p = freePoints.find(fp => fp.id === moveID);
                    if (p) {
                        p.x = vPos.x + moveInfo.dist * Math.cos(thetaNew);
                        p.y = vPos.y + moveInfo.dist * Math.sin(thetaNew);
                        showToast("Solved: " + val + "°");
                    }
                } else if (moveID < 100) {
                    showToast("Cannot move fixed Ring");
                }
            } else if (solveMode === 3) {
                const polygon = getPolygonFromVertex(z.v, z.p1, z.p2);
                if (!polygon) {
                    showToast("Error: open or ambiguous shape");
                    return;
                }

                const n = polygon.length;
                const pos = {};
                polygon.forEach(pid => { pos[pid] = getPinPos(pid); });

                const mode3List = document.getElementById('mode3-points-list');
                const rows = mode3List ? mode3List.children : [];

                const targetAngles = {};
                for (let row of rows) {
                    const inputs = row.querySelectorAll('input');
                    if (inputs.length < 2) continue;

                    const angleInput = inputs[0];
                    const lockCb = inputs[1];
                    const vertexID = parseInt(angleInput.dataset.vertexId);

                    const targetAngle = parseFloat(angleInput.value);
                    if (!isNaN(targetAngle) && !lockCb.checked && targetAngle > 0 && targetAngle <= 360) {
                        targetAngles[vertexID] = targetAngle;
                    }
                }

                let movedCount = 0;

                for (const vertexID of Object.keys(targetAngles).map(Number)) {
                    const targetAngle = targetAngles[vertexID];

                    const idx = polygon.indexOf(vertexID);
                    const prevV = polygon[(idx - 1 + n) % n];
                    const nextV = polygon[(idx + 1) % n];

                    const otherV = (prevV === z.v) ? nextV : (nextV === z.v ? prevV : null);

                    if (otherV === null) continue;

                    const fixedV = pos[z.v];
                    const fixedO = pos[otherV];

                    const voLen = Math.hypot(fixedO.x - fixedV.x, fixedO.y - fixedV.y);
                    if (voLen < 0.001) continue;

                    const arcRadius = voLen / (2 * Math.sin(targetAngle * Math.PI / 180));
                    if (!isFinite(arcRadius) || arcRadius <= 0) continue;

                    const midX = (fixedV.x + fixedO.x) / 2;
                    const midY = (fixedV.y + fixedO.y) / 2;
                    const dx = fixedO.x - fixedV.x;
                    const dy = fixedO.y - fixedV.y;
                    const halfChord = voLen / 2;

                    const centerDist = Math.sqrt(Math.max(0, arcRadius * arcRadius - halfChord * halfChord));

                    const perpX = -dy / voLen;
                    const perpY = dx / voLen;

                    const centers = [
                        { x: midX + perpX * centerDist, y: midY + perpY * centerDist },
                        { x: midX - perpX * centerDist, y: midY - perpY * centerDist }
                    ];

                    let bestResult = null;
                    let bestAngleError = Infinity;

                    centers.forEach(center => {
                        const vecToV = { x: fixedV.x - center.x, y: fixedV.y - center.y };
                        const lenToV = Math.hypot(vecToV.x, vecToV.y);

                        const unitToV = { x: vecToV.x / lenToV, y: vecToV.y / lenToV };

                        const vecToO = { x: fixedO.x - center.x, y: fixedO.y - center.y };

                        const dot = unitToV.x * vecToO.x + unitToV.y * vecToO.y;
                        const det = unitToV.x * vecToO.y - unitToV.y * vecToO.x;
                        let angleVO = Math.atan2(det, dot);
                        if (angleVO < 0) angleVO += 2 * Math.PI;

                        const targetCentralAngle = 2 * (targetAngle * Math.PI / 180);

                        const currentX = pos[vertexID];
                        const vecToX = { x: currentX.x - center.x, y: currentX.y - center.y };
                        const lenToX = Math.hypot(vecToX.x, vecToX.y);

                        if (lenToX < 0.001) return;

                        const unitToX = { x: vecToX.x / lenToX, y: vecToX.y / lenToX };

                        const dotCurr = unitToV.x * unitToX.x + unitToV.y * unitToX.y;
                        const detCurr = unitToV.x * unitToX.y - unitToV.y * unitToX.x;
                        let angleVX = Math.atan2(detCurr, dotCurr);
                        if (angleVX < 0) angleVX += 2 * Math.PI;

                        const targetAngleFromV = targetCentralAngle / 2;

                        const cosAngle = Math.cos(targetAngleFromV);
                        const sinAngle = Math.sin(targetAngleFromV);

                        const pos1 = {
                            x: center.x + arcRadius * (unitToV.x * cosAngle - unitToV.y * sinAngle),
                            y: center.y + arcRadius * (unitToV.x * sinAngle + unitToV.y * cosAngle)
                        };
                        const pos2 = {
                            x: center.x + arcRadius * (unitToV.x * cosAngle + unitToV.y * sinAngle),
                            y: center.y + arcRadius * (-unitToV.x * sinAngle + unitToV.y * cosAngle)
                        };

                        const dist1 = Math.hypot(pos1.x - currentX.x, pos1.y - currentX.y);
                        const dist2 = Math.hypot(pos2.x - currentX.x, pos2.y - currentX.y);

                        const candidatePos = dist1 < dist2 ? pos1 : pos2;
                        const dist = Math.hypot(candidatePos.x - currentX.x, candidatePos.y - currentX.y);

                        if (dist < bestAngleError) {
                            bestAngleError = dist;
                            bestResult = candidatePos;
                        }
                    });

                    if (bestResult) {
                        if (vertexID >= 2000) {
                            const p = freePoints.find(fp => fp.id === vertexID);
                            if (p) {
                                p.x = bestResult.x;
                                p.y = bestResult.y;
                                movedCount++;
                                pos[vertexID] = { x: bestResult.x, y: bestResult.y };
                            }
                        }
                    }
                }

                if (movedCount > 0) {
                    showToast(`Moved ${movedCount} points`);
                } else {
                    showToast("No points adjusted");
                }
            }
        }
    }
    closePopup();
    requestDraw();
}

function lockDistanceFromCenter() {
    if (!selectedObj || selectedObj.type !== 'point') return;
    const p = freePoints.find(fp => fp.id === selectedObj.id);
    if (!p) return;
    const dist = Math.hypot(p.x - centerX, p.y - centerY);
    distanceLocks = distanceLocks.filter(l => l.pointID !== p.id);
    distanceLocks.push({ pointID: p.id, anchorID: CENTER_ID, dist: dist });
    emitHaptic(16); playFeedback('lock');
    showToast("Distance Locked");
}
function lockAngleFromCenter() {
    if (!selectedObj || selectedObj.type !== 'point') return;
    const p = freePoints.find(fp => fp.id === selectedObj.id);
    if (!p) return;
    const ang = Math.atan2(p.y - centerY, p.x - centerX);
    angleLocks = angleLocks.filter(l => l.pointID !== p.id);
    angleLocks.push({ pointID: p.id, anchorID: CENTER_ID, angle: ang });
    emitHaptic(16); playFeedback('lock');
    showToast("Angle Locked");
}
function clearPointLocks() {
    if (!selectedObj || selectedObj.type !== 'point') return;
    const pid = selectedObj.id;
    distanceLocks = distanceLocks.filter(l => l.pointID !== pid);
    angleLocks = angleLocks.filter(l => l.pointID !== pid);
    showToast("Point Locks Cleared");
}

function renderPointList() {
    const list = document.getElementById('point-list');
    list.innerHTML = "";
    const userPoints = freePoints.filter(p => p.type !== 'circle-center');
    const circleCenters = freePoints.filter(p => p.type === 'circle-center');
    const allPoints = [...circleCenters, ...userPoints];
    if (allPoints.length === 0) {
        list.innerHTML = `<div style="text-align:center; opacity:0.5; padding:20px; color:var(--text);">No points created.</div>`;
        return;
    }
    allPoints.forEach(p => {
        const row = document.createElement('div');
        row.className = `point-item ${p.locked ? 'locked' : ''}`;
        let icon = '🔵';
        if (p.type === 'corner') icon = '⎣';
        else if (p.type === 'line') icon = '📏';
        else if (p.type === 'circle-center') icon = '⭕';
        row.innerHTML = `
            <div class="point-left"><div class="point-type-icon">${icon}</div><div class="point-badge">${p.label}</div><span class="point-name">Point ${p.label}</span></div>
            <div class="point-controls"><div class="lock-wrapper"><span class="lock-label">Lock</span><label class="switch"><input type="checkbox" ${p.locked ? 'checked' : ''} onchange="togglePointLock(${p.id})"><span class="slider"></span></label></div><button class="btn-delete" onclick="deletePoint(${p.id})">✕</button></div>`;
        list.appendChild(row);
    });
}

function togglePointLock(id) {
    const p = freePoints.find(pt => pt.id === id);
    if (p) {
        p.locked = !p.locked;
        renderPointList();
    requestDraw();
}

window.openInputModal = openInputModal;
window.setSolveMode = setSolveMode;
window.applyInput = applyInput;
window.lockDistanceFromCenter = lockDistanceFromCenter;
window.lockAngleFromCenter = lockAngleFromCenter;
window.clearPointLocks = clearPointLocks;
window.enforcePointLocks = enforcePointLocks;
window.getCircleByID = getCircleByID;
window.sanitizeCircleCenters = sanitizeCircleCenters;
window.getNearestCircleForPoint = getNearestCircleForPoint;
window.bindPointToCircle = bindPointToCircle;
window.unbindPointFromCircle = unbindPointFromCircle;
window.syncStuckPoints = syncStuckPoints;
window.togglePointCircleStick = togglePointCircleStick;
window.renderPointList = renderPointList;
window.togglePointLock = togglePointLock;
window.deletePoint = deletePoint;
window.resetBoard = resetBoard;
}

function deletePoint(id) {
    if (confirm("Delete this point?")) {
        freePoints = freePoints.filter(p => p.id !== id);
        strings = strings.filter(s => s.start !== id && s.end !== id);
        tangents = tangents.filter(t => t.sourceID !== id && t.targetID !== id);
        circles = circles.filter(c => c.centerID !== id);
        distanceLocks = distanceLocks.filter(l => l.pointID !== id);
        angleLocks = angleLocks.filter(l => l.pointID !== id);
        if (selectedObj && selectedObj.id === id) selectedObj = null;
        freePoints.forEach((p, index) => { p.label = String.fromCharCode(65 + (index % 26)); });
        renderPointList();
        requestDraw();
        showToast("Point Deleted");
    }
}

function resetBoard() {
    strings = [];
    freePoints = [];
    tangents = [];
    circles = [];
    distanceLocks = [];
    angleLocks = [];
    initProtractors();
    requestDraw();
    showToast("Reset");
}

function enforcePointLocks(point) {
    if (!point) return;
    const dLock = distanceLocks.find(l => l.pointID === point.id);
    const aLock = angleLocks.find(l => l.pointID === point.id);
    if (!dLock && !aLock) return;
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    const fallback = Math.atan2(dy, dx);
    const ang = aLock ? aLock.angle : fallback;
    const dist = dLock ? dLock.dist : Math.hypot(dx, dy);
    point.x = centerX + dist * Math.cos(ang);
    point.y = centerY + dist * Math.sin(ang);
}

function getCircleByID(circleID) {
    return circles.find(c => c.id === circleID) || null;
}
function sanitizeCircleCenters() {
    freePoints.forEach(p => {
        if (p.type === 'circle') p.type = 'circle-center';
    });
}
function getNearestCircleForPoint(x, y, threshold = 16) {
    let best = null;
    let bestGap = Infinity;
    circles.forEach(c => {
        const center = getPinPos(c.centerID);
        if (!center) return;
        const d = Math.hypot(x - center.x, y - center.y);
        const gap = Math.abs(d - c.radius);
        if (gap < threshold && gap < bestGap) {
            bestGap = gap;
            best = c;
        }
    });
    return best;
}
function bindPointToCircle(point, circle) {
    if (!point || !circle) return;
    const center = getPinPos(circle.centerID);
    if (!center) return;
    point.stickCircleID = circle.id;
    point.stickAngle = Math.atan2(point.y - center.y, point.x - center.x);
    point.x = center.x + circle.radius * Math.cos(point.stickAngle);
    point.y = center.y + circle.radius * Math.sin(point.stickAngle);
}
function unbindPointFromCircle(point) {
    if (!point) return;
    point.stickCircleID = null;
    point.stickAngle = null;
}
function syncStuckPoints() {
    freePoints.forEach(p => {
        if (p.stickCircleID == null) return;
        const circle = getCircleByID(p.stickCircleID);
        if (!circle) { unbindPointFromCircle(p); return; }
        const center = getPinPos(circle.centerID);
        if (!center) { unbindPointFromCircle(p); return; }
        if (typeof p.stickAngle !== "number") p.stickAngle = Math.atan2(p.y - center.y, p.x - center.x);
        p.x = center.x + circle.radius * Math.cos(p.stickAngle);
        p.y = center.y + circle.radius * Math.sin(p.stickAngle);
    });
}
function togglePointCircleStick() {
    if (!selectedObj || selectedObj.type !== 'point') return;
    const p = freePoints.find(fp => fp.id === selectedObj.id);
    if (!p) return;
    if (p.stickCircleID != null) {
        unbindPointFromCircle(p);
        showToast("Point Unstuck");
        playFeedback('tap');
    } else {
        const c = getNearestCircleForPoint(p.x, p.y, 40);
        if (!c) { showToast("No circle nearby"); playFeedback('error'); return; }
        bindPointToCircle(p, c);
        showToast("Point Stuck");
        playFeedback('lock');
    }
    requestDraw();
}

window.openInputModal = openInputModal;
window.setSolveMode = setSolveMode;
window.applyInput = applyInput;
window.lockDistanceFromCenter = lockDistanceFromCenter;
window.lockAngleFromCenter = lockAngleFromCenter;
window.clearPointLocks = clearPointLocks;
window.enforcePointLocks = enforcePointLocks;
window.getCircleByID = getCircleByID;
window.sanitizeCircleCenters = sanitizeCircleCenters;
window.getNearestCircleForPoint = getNearestCircleForPoint;
window.bindPointToCircle = bindPointToCircle;
window.unbindPointFromCircle = unbindPointFromCircle;
window.syncStuckPoints = syncStuckPoints;
window.togglePointCircleStick = togglePointCircleStick;
window.renderPointList = renderPointList;
window.togglePointLock = togglePointLock;
window.deletePoint = deletePoint;
window.resetBoard = resetBoard;
