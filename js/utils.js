function clamp(v, a, b) {
    return Math.min(b, Math.max(a, v));
}

function getCheck(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

function drawRoundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
    }
}

function requestDraw() {
    if (!renderRequested) {
        renderRequested = true;
        requestAnimationFrame(draw);
    }
}

function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = appSettings.lowPower ? 1 : Math.min(window.devicePixelRatio || 2, 3);
    const cw = width < 600 ? width - 8 : Math.min(width * 0.95, 800);
    const ch = Math.min(height * 0.75, 900);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    width = cw;
    height = ch;
    centerX = width / 2;
    centerY = height / 2;
    const min = Math.min(width, height);
    centerProtractorRadius = min * 0.15;
    centerObj.pivotX = centerX;
    centerObj.pivotY = centerY;
    centerObj.r = centerProtractorRadius;
    boardRadius = min * 0.38;
    protractorRadius = min * 0.12;

    if (protractors.length !== appSettings.protractorCount) initProtractors();
    else protractors.forEach(p => p.gradient = null);

    requestDraw();
}

window.clamp = clamp;
window.getCheck = getCheck;
window.getVal = getVal;
window.showToast = showToast;
window.drawRoundRect = drawRoundRect;
window.requestDraw = requestDraw;
window.resize = resize;