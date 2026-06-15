window.geoconfig = (function () {
    const THEMES = {
        'liquid-2': { bg: 'transparent', transparentCanvas: true, c_bg: 'rgba(255,255,255,0.1)', surface: 'rgba(255, 255, 255, 0.45)', text: '#1d1d1f', primary: '#007aff', border: 'rgba(255,255,255,0.6)', btn_bg: 'rgba(255,255,255,0.2)', btn_text: '#000000', c_grid: 'rgba(0,0,0,0.05)', c_line: '#007aff', c_text: '#1d1d1f', c_pin: '#007aff', font: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', sans-serif", blur: '40px', shadow: '0 20px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6), inset 0 0 20px rgba(255,255,255,0.1)' },
        'modern': { bg: '#f0f9ff', transparentCanvas: false, c_bg: '#f0f9ff', surface: 'rgba(255, 255, 255, 0.95)', text: '#0c4a6e', primary: '#0ea5e9', border: 'rgba(14, 165, 233, 0.2)', btn_bg: 'rgba(255,255,255,0.6)', btn_text: '#0f172a', c_grid: '#e0f2fe', c_line: '#0284c7', c_text: '#0c4a6e', c_pin: '#0ea5e9', font: "'Inter', sans-serif", blur:'24px' },
        'liquid': { bg: 'radial-gradient(at 0% 0%, hsla(280,100%,20%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(240,100%,30%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(320,100%,30%,1) 0, transparent 50%), radial-gradient(at 0% 50%, hsla(340,100%,30%,1) 0, transparent 50%), radial-gradient(at 100% 50%, hsla(260,100%,20%,1) 0, transparent 50%), #0f0c29', transparentCanvas: true, c_bg: 'rgba(255, 255, 255, 0)', surface: 'rgba(0, 0, 0, 0.4)', text: '#ffffff', primary: '#00d2ff', border: 'rgba(255, 255, 255, 0.3)', btn_bg: 'rgba(255,255,255,0.1)', btn_text: '#ffffff', c_grid: 'rgba(255, 255, 255, 0.1)', c_line: '#00d2ff', c_text: '#ffffff', c_pin: '#00d2ff', font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", blur:'30px' },
        'midnight': { bg: '#020617', transparentCanvas: false, c_bg: '#020617', surface: 'rgba(15, 23, 42, 0.95)', text: '#f1f5f9', primary: '#38bdf8', border: 'rgba(255,255,255,0.15)', btn_bg: 'rgba(255,255,255,0.1)', btn_text: '#ffffff', c_grid: '#1e293b', c_line: '#38bdf8', c_text: '#e2e8f0', c_pin: '#0ea5e9', font: "'Inter', sans-serif", blur:'24px' },
        'blueprint': { bg: '#172554', transparentCanvas: false, c_bg: '#172554', surface: 'rgba(30, 58, 138, 0.95)', text: '#dbeafe', primary: '#60a5fa', border: 'rgba(255,255,255,0.2)', btn_bg: 'rgba(255,255,255,0.1)', btn_text: '#ffffff', c_grid: 'rgba(255,255,255,0.1)', c_line: '#93c5fd', c_text: '#dbeafe', c_pin: '#3b82f6', font: "'Space Grotesk', sans-serif", blur:'24px' },
        'cyber': { bg: '#000000', transparentCanvas: false, c_bg: '#000000', surface: 'rgba(10,10,10,0.9)', text: '#00ff9d', primary: '#00ff9d', border: '#00ff9d', btn_bg: 'rgba(0,255,157,0.1)', btn_text:'#00ff9d', c_grid: 'rgba(0,255,157,0.1)', c_line: '#00ff9d', c_text: '#00ff9d', c_pin: '#ffffff', font: "'JetBrains Mono', monospace", blur:'24px' },
        'paper': { bg: '#f5f5f4', transparentCanvas: false, c_bg: '#f5f5f4', surface: 'rgba(255, 255, 255, 0.9)', text: '#292524', primary: '#ea580c', border: 'rgba(0,0,0,0.1)', btn_bg: 'rgba(0,0,0,0.05)', btn_text:'#292524', c_grid: 'rgba(0,0,0,0.05)', c_line: '#44403c', c_text: '#292524', c_pin: '#ea580c', font: "'Crimson Pro', serif", blur:'24px' },
        'sunset': { bg: 'linear-gradient(135deg, #4c1d95, #c026d3, #f97316)', transparentCanvas: true, c_bg: 'rgba(0,0,0,0)', surface: 'rgba(255,255,255,0.15)', text: '#fff', primary: '#fbbf24', border: 'rgba(255,255,255,0.2)', btn_bg:'rgba(255,255,255,0.1)', btn_text:'#fff', c_grid:'rgba(255,255,255,0.1)', c_line:'#fbbf24', c_text:'#fff', c_pin:'#fcd34d', font:"'Inter', sans-serif", blur:'40px' },
        'forest': { bg: '#052e16', transparentCanvas: false, c_bg: '#052e16', surface: 'rgba(20, 83, 45, 0.95)', text: '#dcfce7', primary: '#4ade80', border: 'rgba(255,255,255,0.1)', btn_bg:'rgba(0,0,0,0.2)', btn_text:'#dcfce7', c_grid:'rgba(255,255,255,0.05)', c_line:'#22c55e', c_text:'#dcfce7', c_pin:'#4ade80', font:"'Inter', sans-serif", blur:'24px' },
        'dracula': { bg: '#282a36', transparentCanvas: false, c_bg: '#282a36', surface: 'rgba(68, 71, 90, 0.95)', text: '#f8f8f2', primary: '#bd93f9', border: '#6272a4', btn_bg:'rgba(255,255,255,0.05)', btn_text:'#f8f8f2', c_grid:'rgba(444,75,90,0.1)', c_line:'#bd93f9', c_text:'#f8f8f2', c_pin:'#ff79c6', font:"'JetBrains Mono', monospace", blur:'24px' },
        'terminal': { bg: '#000000', transparentCanvas: false, c_bg: '#000000', surface: 'rgba(0, 20, 0, 0.95)', text: '#00ff00', primary: '#00ff00', border: '#003300', btn_bg:'rgba(0,50,0,0.3)', btn_text:'#00ff00', c_grid:'#003300', c_line:'#00cc00', c_text:'#00ff00', c_pin:'#00ff00', font:"'Courier New', monospace", blur:'0px' },
        'cream': { bg: '#fdf6e3', transparentCanvas: false, c_bg: '#fdf6e3', surface: 'rgba(238, 232, 213, 0.95)', text: '#657b83', primary: '#cb4b16', border: 'rgba(0,0,0,0.05)', btn_bg:'rgba(0,0,0,0.03)', btn_text:'#586e75', c_grid:'rgba(0,0,0,0.05)', c_line:'#93a1a1', c_text:'#657b83', c_pin:'#d33682', font:"'Crimson Pro', serif", blur:'24px' },
        'lavender': { bg: '#f5f3ff', transparentCanvas: false, c_bg: '#f5f3ff', surface: 'rgba(255, 255, 255, 0.9)', text: '#5b21b6', primary: '#8b5cf6', border: 'rgba(139, 92, 246, 0.1)', btn_bg:'rgba(139, 92, 246, 0.05)', btn_text:'#4c1d95', c_grid:'rgba(139, 92, 246, 0.05)', c_line:'#8b5cf6', c_text:'#5b21b6', c_pin:'#a78bfa', font:"'Inter', sans-serif", blur:'24px' },
        'slate': { bg: '#0f172a', transparentCanvas: false, c_bg: '#0f172a', surface: 'rgba(30, 41, 59, 0.95)', text: '#cbd5e1', primary: '#94a3b8', border: 'rgba(255,255,255,0.1)', btn_bg:'rgba(255,255,255,0.05)', btn_text:'#fff', c_grid:'#1e293b', c_line:'#64748b', c_text:'#94a3b8', c_pin:'#cbd5e1', font:"'Inter', sans-serif", blur:'24px' },
        'synthwave': { bg: '#2b213a', transparentCanvas: false, c_bg: '#2b213a', surface: 'rgba(43, 33, 58, 0.9)', text: '#ff00ff', primary: '#00ffff', border: '#ff00ff', btn_bg:'rgba(255,0,255,0.1)', btn_text:'#ff00ff', c_grid:'rgba(0,255,255,0.1)', c_line:'#00ffff', c_text:'#ff00ff', c_pin:'#fff', font:"'Space Grotesk', sans-serif", blur:'20px' },
        'cherry': { bg: '#fff0f5', transparentCanvas: false, c_bg: '#fff0f5', surface: 'rgba(255, 255, 255, 0.9)', text: '#8b0000', primary: '#ff69b4', border: 'rgba(255,105,180,0.3)', btn_bg:'rgba(255,105,180,0.1)', btn_text:'#8b0000', c_grid:'rgba(255,182,193,0.3)', c_line:'#db7093', c_text:'#8b0000', c_pin:'#ff1493', font:"'Crimson Pro', serif", blur:'24px' },
        'gold': { bg: '#000000', transparentCanvas: false, c_bg: '#000000', surface: 'rgba(20, 20, 20, 0.95)', text: '#ffd700', primary: '#ffd700', border: '#b8860b', btn_bg:'rgba(255,215,0,0.1)', btn_text:'#ffd700', c_grid:'rgba(184,134,11,0.2)', c_line:'#ffd700', c_text:'#fff', c_pin:'#ffd700', font:"'Playfair Display', serif", blur:'30px' },
        'ocean': { bg: '#001f3f', transparentCanvas: false, c_bg: '#001f3f', surface: 'rgba(0, 31, 63, 0.9)', text: '#7fdbff', primary: '#39cccc', border: '#0074d9', btn_bg:'rgba(0,116,217,0.2)', btn_text:'#7fdbff', c_grid:'rgba(127,219,255,0.1)', c_line:'#39cccc', c_text:'#7fdbff', c_pin:'#ffffff', font:"'Inter', sans-serif", blur:'24px' },
        'nebula': { bg: '#1a0b2e', transparentCanvas: false, c_bg: '#1a0b2e', surface: 'rgba(45, 27, 78, 0.9)', text: '#e0d4fc', primary: '#d4bbff', border: 'rgba(112, 0, 255, 0.3)', btn_bg:'rgba(112,0,255,0.1)', btn_text:'#e0d4fc', c_grid:'rgba(112,0,255,0.1)', c_line:'#b388ff', c_text:'#e0d4fc', c_pin:'#7c4dff', font:"'Space Grotesk', sans-serif", blur:'30px' },
        'coffee': { bg: '#3e2723', transparentCanvas: false, c_bg: '#3e2723', surface: 'rgba(78, 52, 46, 0.95)', text: '#efebe9', primary: '#d7ccc8', border: 'rgba(141, 110, 99, 0.3)', btn_bg:'rgba(255,255,255,0.05)', btn_text:'#efebe9', c_grid:'rgba(255,255,255,0.05)', c_line:'#bcaaa4', c_text:'#efebe9', c_pin:'#d7ccc8', font:"'Inter', sans-serif", blur:'20px' },
        'retro': { bg: '#e0e0ce', transparentCanvas: false, c_bg: '#e0e0ce', surface: 'rgba(190, 190, 175, 0.9)', text: '#4a4a40', primary: '#d65d0e', border: '#909080', btn_bg:'rgba(0,0,0,0.05)', btn_text:'#4a4a40', c_grid:'rgba(0,0,0,0.1)', c_line:'#4a4a40', c_text:'#4a4a40', c_pin:'#d65d0e', font:"'Courier New', monospace", blur:'0px' },
        'mint': { bg: '#e0f7fa', transparentCanvas: false, c_bg: '#e0f7fa', surface: 'rgba(255, 255, 255, 0.9)', text: '#00695c', primary: '#26a69a', border: 'rgba(0, 150, 136, 0.2)', btn_bg:'rgba(0,150,136,0.1)', btn_text:'#004d40', c_grid:'rgba(0,150,136,0.1)', c_line:'#4db6ac', c_text:'#00695c', c_pin:'#00897b', font:"'Inter', sans-serif", blur:'24px' },
        'matrix': { bg: '#000000', transparentCanvas: false, c_bg: '#000000', surface: 'rgba(0, 20, 0, 0.9)', text: '#00ff00', primary: '#00ff00', border: '#004400', btn_bg:'rgba(0,50,0,0.3)', btn_text:'#00ff00', c_grid:'rgba(0,50,0,0.3)', c_line:'#00cc00', c_text:'#00ff00', c_pin:'#00ff00', font:"'Courier New', monospace", blur:'0px' },
        'vapor': { bg: '#ff71ce', transparentCanvas: true, c_bg: 'linear-gradient(to bottom, #ff71ce, #01cdfe)', surface: 'rgba(255, 255, 255, 0.4)', text: '#fff', primary: '#fff', border: 'rgba(255,255,255,0.5)', btn_bg:'rgba(255,255,255,0.2)', btn_text:'#fff', c_grid:'rgba(255,255,255,0.2)', c_line:'#fff', c_text:'#fff', c_pin:'#fff', font:"'Space Grotesk', sans-serif", blur:'20px' },
        'nord': { bg: '#2e3440', transparentCanvas: false, c_bg: '#2e3440', surface: 'rgba(46, 52, 64, 0.95)', text: '#d8dee9', primary: '#88c0d0', border: '#4c566a', btn_bg:'rgba(255,255,255,0.05)', btn_text:'#d8dee9', c_grid:'rgba(35,39,48,0.5)', c_line:'#81a1c1', c_text:'#eceff4', c_pin:'#5e81ac', font:"'Inter', sans-serif", blur:'20px' },
        'gruvbox': { bg: '#282828', transparentCanvas: false, c_bg: '#282828', surface: 'rgba(40, 40, 40, 0.95)', text: '#ebdbb2', primary: '#fabd2f', border: '#504945', btn_bg:'rgba(255,255,255,0.05)', btn_text:'#ebdbb2', c_grid:'rgba(60,56,54,0.5)', c_line:'#fe8019', c_text:'#ebdbb2', c_pin:'#b8bb26', font:"'Courier New', monospace", blur:'0px' },
        'highcon': { bg: '#ffffff', transparentCanvas: false, c_bg: '#ffffff', surface: '#ffffff', text: '#000000', primary: '#000000', border: '#000000', btn_bg:'#ffffff', btn_text:'#000000', c_grid:'rgba(0,0,0,0.5)', c_line:'#000000', c_text:'#000000', c_pin:'#000000', font:"sans-serif", blur:'0px' },
        'toxic': { bg: '#111111', transparentCanvas: false, c_bg: '#111111', surface: 'rgba(20, 20, 20, 0.9)', text: '#ccff00', primary: '#ccff00', border: '#ccff00', btn_bg:'rgba(204,255,0,0.1)', btn_text:'#ccff00', c_grid:'rgba(204,255,0,0.2)', c_line:'#ccff00', c_text:'#ccff00', c_pin:'#ffffff', font:"'JetBrains Mono', monospace", blur:'0px' }
    };

    const DEFAULTS = {
        currentTheme: 'modern',
        showGrid: true,
        showCenterBody: true,
        showCenterPin: true,
        showRingBody: true,
        showRingPin: true,
        alwaysShowAngles: true,
        snapRotation: true,
        snapIncrement: 5,
        snapThreshold: 2.0,
        gridSnap: false,
        gridSize: 40,
        gridThreshold: 10,
        showHitboxes: false,
        textScale: 1.0,
        protractorCount: 8,
        strictPhysics: true,
        layout: 'classic',
        lowPower: false,
        showOrbit: false,
        orbitOpacity: 0.5,
        infiniteBoard: false,
        haptics: true,
        soundEnabled: true,
        soundVolume: 0.5
    };

    const TOOL_REGISTRY = {
        drag: { id: 'drag', label: 'Drag', icon: '✋' },
        connect: { id: 'connect', label: 'Link', icon: '🔗' },
        point: { id: 'point', label: 'Point', icon: '🔵' },
        line: { id: 'line', label: 'Line', icon: '📏' },
        corner: { id: 'corner', label: 'Corner', icon: '⎣' },
        circle: { id: 'circle', label: 'Circle', icon: '⭕' },
        lasso: { id: 'lasso', label: 'Lasso', icon: '◌' },
        midpoint: { id: 'midpoint', label: 'Mid', icon: 'M' },
        perpendicular: { id: 'perpendicular', label: 'Perp', icon: '⊥' },
        intersection: { id: 'intersection', label: 'X', icon: '✚' }
    };

    const DEFAULT_TOOL_LAYOUT = ['drag','connect','point','line','corner','circle','lasso','midpoint','perpendicular','intersection'];

    const CENTER_ID = 999;
    const LASSO_RESIZE_HANDLE_SIZE = 10;
    const LASSO_RESIZE_MARGIN = 12;
    const MAX_VISIBLE_TOOLS = 7;

    return {
        THEMES,
        DEFAULTS,
        TOOL_REGISTRY,
        DEFAULT_TOOL_LAYOUT,
        CENTER_ID,
        LASSO_RESIZE_HANDLE_SIZE,
        LASSO_RESIZE_MARGIN,
        MAX_VISIBLE_TOOLS
    };
})();

window.CONFIG = window.geoconfig;
window.THEMES = window.CONFIG.THEMES;
window.DEFAULTS = window.CONFIG.DEFAULTS;
window.TOOL_REGISTRY = window.CONFIG.TOOL_REGISTRY;
window.DEFAULT_TOOL_LAYOUT = window.CONFIG.DEFAULT_TOOL_LAYOUT;
window.CENTER_ID = window.CONFIG.CENTER_ID;
window.LASSO_RESIZE_HANDLE_SIZE = window.CONFIG.LASSO_RESIZE_HANDLE_SIZE;
window.LASSO_RESIZE_MARGIN = window.CONFIG.LASSO_RESIZE_MARGIN;
window.MAX_VISIBLE_TOOLS = window.CONFIG.MAX_VISIBLE_TOOLS;
