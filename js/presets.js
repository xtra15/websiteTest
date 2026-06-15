function openPresetModal() {
    document.getElementById('preset-size').value = "80";
    selectPresetType("triangle");
    document.getElementById('overlay').classList.add('active');
    document.getElementById('preset-modal').classList.add('active');
}
function selectPresetType(kind) {
    selectedPresetType = kind;
    ["triangle","square","rectangle","pentagon","hexagon","right"].forEach(k => {
        const el = document.getElementById('preset-' + k);
        if (!el) return;
        el.className = k === kind ? "solver-opt active" : "solver-opt";
    });
}
function applyPresetFromModal() {
    const size = clamp(parseFloat(document.getElementById('preset-size').value) || 80, 20, 400);
    insertShapePreset(selectedPresetType, size);
    closePopup();
}
function insertShapePreset(kind, base) {
    if (!kind) return;
    const origin = screenToWorld(width * 0.5, height * 0.5);
    const sidesMap = { triangle: 3, square: 4, rectangle: 4, pentagon: 5, hexagon: 6, right: 3 };
    if (!sidesMap[kind]) { showToast("Unknown preset"); playFeedback('error'); return; }
    const ids = [];
    if (kind === "rectangle") {
        const pts = [
            {x: origin.x - base, y: origin.y - base * 0.6},
            {x: origin.x + base, y: origin.y - base * 0.6},
            {x: origin.x + base, y: origin.y + base * 0.6},
            {x: origin.x - base, y: origin.y + base * 0.6}
        ];
        pts.forEach(pt => {
            const label = String.fromCharCode(65 + (freePoints.length % 26));
            const id = uniquePointID++;
            freePoints.push({id, x:pt.x, y:pt.y, locked:false, label, type:'preset', stickCircleID: null, stickAngle: null});
            ids.push(id);
        });
    } else if (kind === "right") {
        const pts = [
            {x: origin.x - base, y: origin.y + base},
            {x: origin.x - base, y: origin.y - base},
            {x: origin.x + base, y: origin.y + base}
        ];
        pts.forEach(pt => {
            const label = String.fromCharCode(65 + (freePoints.length % 26));
            const id = uniquePointID++;
            freePoints.push({id, x:pt.x, y:pt.y, locked:false, label, type:'preset', stickCircleID: null, stickAngle: null});
            ids.push(id);
        });
    } else {
        const n = sidesMap[kind];
        for (let i = 0; i < n; i++) {
            const a = -Math.PI/2 + (i * Math.PI * 2 / n);
            const label = String.fromCharCode(65 + (freePoints.length % 26));
            const id = uniquePointID++;
            freePoints.push({id, x:origin.x + base * Math.cos(a), y:origin.y + base * Math.sin(a), locked:false, label, type:'preset', stickCircleID: null, stickAngle: null});
            ids.push(id);
        }
    }
    for (let i = 0; i < ids.length; i++) strings.push({start: ids[i], end: ids[(i+1) % ids.length]});
    emitHaptic(15); playFeedback('place');
    showToast("Preset inserted");
    requestDraw();
}
