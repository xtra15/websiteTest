let dragStartY = 0;
let currentSheet = null;

document.addEventListener('touchstart', (e) => {
    const sheet = e.target.closest('.bottom-sheet');
    if (!sheet) return;
    const content = sheet.querySelector('.sheet-content');
    if (content && content.scrollTop > 0 && !e.target.closest('.sheet-header') && !e.target.closest('.sheet-handle-bar')) return;
    dragStartY = e.touches[0].clientY;
    currentSheet = sheet;
    sheet.style.transition = 'none';
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!currentSheet) return;
    const deltaY = e.touches[0].clientY - dragStartY;
    if (deltaY > 0) {
        if (e.cancelable) e.preventDefault();
        currentSheet.style.transform = `translateX(-50%) translateY(${deltaY}px)`;
    }
}, { passive: false });

document.addEventListener('touchend', (e) => {
    if (!currentSheet) return;
    const deltaY = e.changedTouches[0].clientY - dragStartY;
    currentSheet.style.transition = 'bottom 0.4s cubic-bezier(0.19, 1, 0.22, 1), transform 0.3s ease';
    if (deltaY > 80) closeAllModals();
    else currentSheet.style.transform = 'translateX(-50%) translateY(0)';
    currentSheet = null;
});

window.addEventListener('popstate', () => closeAllModals(true));
window.addEventListener('mouseup', e => handleRelease(getPointer(e)));
window.addEventListener('touchend', e => {
    const touch = e.changedTouches[0];
    const r = canvas.getBoundingClientRect();
    const sx = r.width === 0 ? 0 : clamp((touch.clientX - r.left) * (width / r.width), 0, width);
    const sy = r.width === 0 ? 0 : clamp((touch.clientY - r.top) * (height / r.height), 0, height);
    handleRelease(screenToWorld(sx, sy));
});
canvas.addEventListener('touchstart', e => {
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const me = new MouseEvent('mousedown', { clientX: touch.clientX, clientY: touch.clientY, bubbles: true });
    canvas.dispatchEvent(me);
}, { passive: false });
canvas.addEventListener('touchmove', e => {
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const me = new MouseEvent('mousemove', { clientX: touch.clientX, clientY: touch.clientY, bubbles: true });
    canvas.dispatchEvent(me);
}, { passive: false });

document.addEventListener("DOMContentLoaded", function() {
    loadToolLayout();
    if (!enabledTools[currentTool]) currentTool = toolLayout.find(id => enabledTools[id]) || 'drag';
    renderToolbar();
    initUI();
    resize();
    sanitizeCircleCenters();
    requestDraw();
});
window.onresize = resize;
