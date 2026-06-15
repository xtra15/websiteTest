function loadToolLayout() {
    try {
        const raw = JSON.parse(localStorage.getItem('geoToolLayout'));
        if (!raw) return;
        const valid = Array.isArray(raw.order) ? raw.order.filter(id => TOOL_REGISTRY[id]) : [];
        const mergedOrder = [...valid, ...DEFAULT_TOOL_LAYOUT.filter(id => !valid.includes(id))];
        toolLayout = mergedOrder;
        if (raw.enabled && typeof raw.enabled === 'object') {
            DEFAULT_TOOL_LAYOUT.forEach(id => {
                if (typeof raw.enabled[id] === 'boolean') enabledTools[id] = raw.enabled[id];
            });
        }
    } catch(e) {}
}
function saveToolLayout() {
    localStorage.setItem('geoToolLayout', JSON.stringify({ order: toolLayout, enabled: enabledTools }));
}
function renderToolbar() {
    const tb = document.getElementById('toolbar');
    if (!tb) return;
    tb.innerHTML = "";
    const visible = toolLayout.filter(id => enabledTools[id]).slice(0, MAX_VISIBLE_TOOLS);
    visible.forEach(id => {
        const cfg = TOOL_REGISTRY[id];
        if (!cfg) return;
        const item = document.createElement('div');
        item.className = 'tool-opt' + (currentTool === id ? ' selected' : '');
        item.id = 'tool-' + id;
        item.onclick = () => setTool(id);
        item.innerHTML = `<span class="tool-icon">${cfg.icon}</span>${cfg.label}`;
        tb.appendChild(item);
    });
    const plus = document.createElement('button');
    plus.className = 'tool-plus';
    plus.innerText = '+';
    plus.onclick = openToolManager;
    tb.appendChild(plus);
}
function openToolManager() {
    const list = document.getElementById('tool-manager-list');
    if (!list) return;
    list.innerHTML = "";
    toolLayout.forEach((id) => {
        const cfg = TOOL_REGISTRY[id];
        if (!cfg) return;
        const row = document.createElement('div');
        row.className = 'tool-manager-item';
        row.draggable = true;
        row.dataset.toolId = id;
        row.innerHTML = `<div class="tool-manager-left"><span class="tool-drag-handle">≡</span><span>${cfg.icon} ${cfg.label}</span></div><button class="tool-toggle-btn ${enabledTools[id] ? '' : 'off'}">${enabledTools[id] ? 'Added' : 'Hidden'}</button>`;
        const toggleBtn = row.querySelector('.tool-toggle-btn');
        toggleBtn.addEventListener('click', () => {
            enabledTools[id] = !enabledTools[id];
            const activeCount = Object.values(enabledTools).filter(Boolean).length;
            if (activeCount === 0) enabledTools.drag = true;
            if (!enabledTools[currentTool]) currentTool = 'drag';
            saveToolLayout();
            renderToolbar();
            openToolManager();
        });
        row.addEventListener('dragstart', () => row.classList.add('dragging'));
        row.addEventListener('dragend', () => {
            row.classList.remove('dragging');
            const newOrder = Array.from(list.querySelectorAll('.tool-manager-item')).map(el => el.dataset.toolId);
            toolLayout = newOrder;
            saveToolLayout();
            renderToolbar();
            openToolManager();
        });
        row.addEventListener('dragover', (e) => {
            e.preventDefault();
            const dragging = list.querySelector('.tool-manager-item.dragging');
            if (!dragging || dragging === row) return;
            const rect = row.getBoundingClientRect();
            const after = e.clientX > rect.left + rect.width / 2;
            if (after) row.after(dragging); else row.before(dragging);
        });
        list.appendChild(row);
    });
    openModal('tool-manager-modal');
}
function resetToolLayout() {
    toolLayout = [...DEFAULT_TOOL_LAYOUT];
    enabledTools = Object.fromEntries(DEFAULT_TOOL_LAYOUT.map(id => [id, true]));
    if (!enabledTools[currentTool]) currentTool = 'drag';
    saveToolLayout();
    renderToolbar();
    openToolManager();
}
function ensureLassoAnimationLoop() {
    if (lassoAnimRaf !== null) {
        cancelAnimationFrame(lassoAnimRaf);
        lassoAnimRaf = null;
    }
}
function setTool(t) {
    if (t === 'tangent') return;
    if (!enabledTools[t]) return;
    currentTool = t;
    activeStringStartID = null;
    activeCircleCenterID = null;
    midpointStartID = null;
    perpendicularRefSegment = null;
    intersectionFirstObj = null;
    lassoPoints = [];
    isDrawingLasso = false;
    selectedByLasso = [];
    lassoDragStartPoint = null;
    lassoOriginalPositions = {};
    ensureLassoAnimationLoop();
    renderToolbar();
    selectedObj = null;
    requestDraw();
    emitHaptic(8);
    playFeedback('tap');
    showToast("Tool: " + t.charAt(0).toUpperCase() + t.slice(1));
}
