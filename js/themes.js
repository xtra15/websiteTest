function resetView() {
    camera.camX = 0;
    camera.camY = 0;
    camera.zoom = 1;
    requestDraw();
    showToast("View reset");
}

function saveCanvasPng() {
    canvas.toBlob((blob) => {
        if (!blob) { showToast("Save failed"); playFeedback('error'); return; }
        const a = document.createElement('a');
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        a.href = URL.createObjectURL(blob);
        a.download = `geolab-${stamp}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(a.href);
        emitHaptic(22);
        playFeedback('save');
        showToast("PNG Saved");
    }, "image/png");
}

function closePopup() {
    document.querySelectorAll('.custom-popup').forEach(el => el.classList.remove('active'));
    document.getElementById('overlay').classList.remove('active');
    if (history.state && history.state.modal) history.back();
}

function confirmClear() {
    strings = [];
    freePoints = [];
    tangents = [];
    circles = [];
    distanceLocks = [];
    angleLocks = [];
    selectedObj = null;
    document.getElementById('confirm-modal').classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
    if (history.state && history.state.modal) history.back();
    requestDraw();
    showToast("Board Cleared");
}

function toggleAccordion(header) {
    const item = header.parentElement;
    item.classList.toggle('open');
}

function toggleDebug() {
    debugMode = !debugMode;
    document.getElementById('debug-hud').style.display = debugMode ? 'block' : 'none';
    requestDraw();
}

function toggleToolbar() {
    document.getElementById('toolbar').classList.toggle('active');
}

function closeAllModals(fromHistory = false) {
    document.querySelectorAll('.bottom-sheet').forEach(el => {
        el.classList.remove('active');
        el.style.transform = 'translateX(-50%) translateY(0)';
    });
    document.getElementById('overlay').classList.remove('active');
    document.querySelectorAll('.custom-popup').forEach(el => el.classList.remove('active'));
    if (!fromHistory && history.state && history.state.modal) {
        history.back();
    }
}

function openModal(id) {
    document.querySelectorAll('.bottom-sheet').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('overlay').classList.add('active');
    history.pushState({modal: true, id: id}, null, "");
}

function toggleHelp() { openModal('help-modal'); }
function toggleSettings() { openModal('settings-modal'); }
function toggleLog() { openModal('log-modal'); }
function toggleLaws() { openModal('laws-modal'); }
function togglePointsModal() { renderPointList(); openModal('points-modal'); }

function toggleThemes() {
    const extra = document.getElementById('extra-themes');
    const btn = document.getElementById('btn-toggle-themes');
    if (extra.classList.contains('active')) {
        extra.classList.remove('active');
        btn.innerText = "More...";
    } else {
        extra.classList.add('active');
        btn.innerText = "Less";
    }
}

function selectTheme(name) {
    appSettings.currentTheme = name;
    updateSettings();
    applyTheme();
}

function setLayout(e, layoutName) {
    if (e) e.stopPropagation();
    appSettings.layout = layoutName;
    localStorage.setItem('geoSettings', JSON.stringify(appSettings));
    document.body.classList.remove('layout-classic', 'layout-split', 'layout-onehand');
    document.body.classList.add('layout-' + layoutName);
    document.querySelectorAll('.layout-card').forEach(c => c.classList.remove('selected'));
    const activeCard = document.getElementById('layout-' + layoutName);
    if (activeCard) activeCard.classList.add('selected');
    showToast("Layout: " + layoutName.charAt(0).toUpperCase() + layoutName.slice(1));
}

function applyTheme() {
    if (!THEMES[appSettings.currentTheme]) appSettings.currentTheme = 'modern';
    activeTheme = THEMES[appSettings.currentTheme];

    activeTheme.cachedFontFamily = activeTheme.font.split(',')[0];

    const r = document.querySelector(':root');
    r.style.setProperty('--bg', activeTheme.bg);
    r.style.setProperty('--surface', activeTheme.surface);
    r.style.setProperty('--text', activeTheme.text);
    r.style.setProperty('--primary', activeTheme.primary);
    r.style.setProperty('--border', activeTheme.border);
    r.style.setProperty('--font-ui', activeTheme.font);
    r.style.setProperty('--panel-blur', activeTheme.blur);
    r.style.setProperty('--btn-bg', activeTheme.btn_bg || 'rgba(0,0,0,0.05)');
    r.style.setProperty('--btn-text', activeTheme.btn_text || activeTheme.text);

    if (activeTheme.shadow) r.style.setProperty('--shadow', activeTheme.shadow);
    else r.style.setProperty('--shadow', '0 25px 50px -12px rgba(0, 0, 0, 0.25)');

    const mesh = document.getElementById('liquid-mesh');
    const noise = document.getElementById('liquid-noise');

    if (appSettings.currentTheme === 'liquid-2') {
        if (!appSettings.lowPower) {
            mesh.style.display = 'block';
            mesh.style.opacity = '1';
            noise.style.opacity = '0.05';
        } else {
            mesh.style.display = 'none';
        }
        r.style.setProperty('--saturation', '200%');
    } else {
        mesh.style.display = 'none';
        mesh.style.opacity = '0';
        noise.style.opacity = '0';
        r.style.setProperty('--saturation', '100%');
    }

    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('th-' + appSettings.currentTheme);
    if (btn) btn.classList.add('active');

    protractors.forEach(p => p.gradient = null);
    requestDraw();
}

function updateSettings() {
    appSettings.alwaysShowAngles = getCheck('opt-always-show');
    appSettings.showGrid = getCheck('opt-show-grid');
    appSettings.snapRotation = getCheck('opt-snap-active');
    appSettings.snapIncrement = parseFloat(getVal('opt-snap-val')) || 5;
    appSettings.snapThreshold = parseFloat(getVal('opt-snap-threshold')) || 2.0;
    appSettings.gridSnap = getCheck('opt-grid-snap');
    appSettings.gridSize = parseInt(getVal('opt-grid-size')) || 40;
    appSettings.gridThreshold = parseInt(getVal('opt-grid-threshold')) || 10;
    appSettings.strictPhysics = !getCheck('opt-reflex');
    appSettings.showCenterBody = getCheck('opt-show-center-body');
    appSettings.showCenterPin = getCheck('opt-show-center-pin');
    appSettings.showRingBody = getCheck('opt-show-ring-body');
    appSettings.showRingPin = getCheck('opt-show-ring-pin');
    appSettings.showHitboxes = getCheck('opt-show-hitboxes');
    appSettings.lowPower = getCheck('opt-low-power');

    appSettings.showOrbit = getCheck('opt-show-orbit');
    appSettings.orbitOpacity = parseFloat(getVal('opt-orbit-opacity')) || 0.5;
    document.getElementById('lbl-orbit-opacity').innerText = appSettings.orbitOpacity;
    appSettings.infiniteBoard = getCheck('opt-infinite-board');
    appSettings.haptics = getCheck('opt-haptics');
    appSettings.soundEnabled = getCheck('opt-sound');
    appSettings.soundVolume = parseFloat(getVal('opt-sound-volume')) || 0.5;
    document.getElementById('lbl-sound-volume').innerText = appSettings.soundVolume.toFixed(1);

    if (appSettings.lowPower) document.body.parentElement.classList.add('low-power');
    else document.body.parentElement.classList.remove('low-power');

    document.getElementById('lbl-text-scale').innerText = appSettings.textScale + "x";
    document.getElementById('lbl-count').innerText = parseInt(getVal('opt-count')) || 8;
    document.getElementById('lbl-snap-threshold').innerText = appSettings.snapThreshold + "°";
    document.getElementById('lbl-grid-threshold').innerText = appSettings.gridThreshold + "px";

    const newCount = parseInt(getVal('opt-count')) || 8;
    if (newCount !== appSettings.protractorCount) { appSettings.protractorCount = newCount; initProtractors(); }
    localStorage.setItem('geoSettings', JSON.stringify(appSettings));
    applyTheme();
}

function resetSettings() {
    if (confirm("Reset Everything?")) {
        appSettings = { ...DEFAULTS };
        localStorage.setItem('geoSettings', JSON.stringify(appSettings));
        localStorage.removeItem('geoToolLayout');
        toolLayout = [...DEFAULT_TOOL_LAYOUT];
        enabledTools = Object.fromEntries(DEFAULT_TOOL_LAYOUT.map(id => [id, true]));
        currentTool = 'drag';
        initUI();
        renderToolbar();
        strings = [];
        freePoints = [];
        tangents = [];
        circles = [];
        distanceLocks = [];
        angleLocks = [];
        initProtractors();
        closeAllModals();
    }
}

function initUI() {
    try {
        const loader = document.getElementById('loading-screen');
        setTimeout(() => {
            loader.style.opacity = '0';
            loader.style.transform = 'translateY(-20px) scale(0.95)';
            setTimeout(() => { loader.style.display = 'none'; }, 600);
        }, 1200);

        document.getElementById('opt-always-show').checked = appSettings.alwaysShowAngles;
        document.getElementById('opt-show-grid').checked = appSettings.showGrid;
        document.getElementById('opt-snap-active').checked = appSettings.snapRotation;
        document.getElementById('opt-snap-val').value = appSettings.snapIncrement;
        document.getElementById('opt-snap-threshold').value = appSettings.snapThreshold;
        document.getElementById('opt-grid-snap').checked = appSettings.gridSnap;
        document.getElementById('opt-grid-size').value = appSettings.gridSize;
        document.getElementById('opt-grid-threshold').value = appSettings.gridThreshold;
        document.getElementById('opt-reflex').checked = !appSettings.strictPhysics;
        document.getElementById('opt-show-center-body').checked = appSettings.showCenterBody;
        document.getElementById('opt-show-center-pin').checked = appSettings.showCenterPin;
        document.getElementById('opt-show-ring-body').checked = appSettings.showRingBody;
        document.getElementById('opt-show-ring-pin').checked = appSettings.showRingPin;
        document.getElementById('opt-show-hitboxes').checked = appSettings.showHitboxes;
        document.getElementById('opt-low-power').checked = appSettings.lowPower;
        document.getElementById('lbl-text-scale').innerText = appSettings.textScale + "x";
        document.getElementById('opt-text-scale').value = appSettings.textScale;
        document.getElementById('opt-count').value = appSettings.protractorCount;
        document.getElementById('lbl-count').innerText = appSettings.protractorCount;
        document.getElementById('lbl-snap-threshold').innerText = appSettings.snapThreshold + "°";
        document.getElementById('lbl-grid-threshold').innerText = appSettings.gridThreshold + "px";

        document.getElementById('opt-show-orbit').checked = appSettings.showOrbit;
        document.getElementById('opt-orbit-opacity').value = appSettings.orbitOpacity;
        document.getElementById('lbl-orbit-opacity').innerText = appSettings.orbitOpacity;
        document.getElementById('opt-infinite-board').checked = appSettings.infiniteBoard;
        document.getElementById('opt-haptics').checked = appSettings.haptics;
        document.getElementById('opt-sound').checked = appSettings.soundEnabled;
        document.getElementById('opt-sound-volume').value = appSettings.soundVolume;
        document.getElementById('lbl-sound-volume').innerText = appSettings.soundVolume.toFixed(1);

        if (appSettings.lowPower) document.body.parentElement.classList.add('low-power');

        document.body.classList.add('layout-' + appSettings.layout);
        const activeCard = document.getElementById('layout-' + appSettings.layout);
        if (activeCard) activeCard.classList.add('selected');

        applyTheme();
    } catch (e) { console.error("Init Error", e); }
}

function updateDebug() {
    if (!debugMode) return;
    const now = performance.now();
    const delta = now - lastTime;
    if (delta >= 1000) { fps = frameCount; frameCount = 0; lastTime = now; }
    frameCount++;
    document.getElementById('d-fps').innerText = fps;
    document.getElementById('d-mouse').innerText = Math.round(ptrX) + "," + Math.round(ptrY);
    document.getElementById('d-obj').innerText = freePoints.length + protractors.length;
    document.getElementById('d-str').innerText = strings.length;
}

window.toggleThemes = toggleThemes;
window.selectTheme = selectTheme;
window.setLayout = setLayout;
window.applyTheme = applyTheme;
window.updateSettings = updateSettings;
window.resetSettings = resetSettings;
window.initUI = initUI;
window.resetView = resetView;
window.saveCanvasPng = saveCanvasPng;
window.closePopup = closePopup;
window.confirmClear = confirmClear;
window.toggleAccordion = toggleAccordion;
window.toggleDebug = toggleDebug;
window.toggleToolbar = toggleToolbar;
window.closeAllModals = closeAllModals;
window.openModal = openModal;
window.toggleHelp = toggleHelp;
window.toggleSettings = toggleSettings;
window.toggleLog = toggleLog;
window.toggleLaws = toggleLaws;
window.togglePointsModal = togglePointsModal;
window.updateDebug = updateDebug;