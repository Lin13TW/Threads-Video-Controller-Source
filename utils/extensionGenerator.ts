
export const generateManifest = () => {
  return JSON.stringify(
    {
      manifest_version: 3,
      name: "Threads Video Pro",
      version: "12.1",
      description: "v12.1: UI Refinement. Narrower blocker for IG (reveals tags/reply), Fixed Dock controller for Threads.",
      permissions: ["activeTab", "scripting", "storage"],
      action: {
        default_popup: "popup.html"
      },
      host_permissions: ["*://*.threads.net/*", "*://*.threads.com/*", "*://*.instagram.com/*"],
      content_scripts: [
        {
          matches: ["*://*.threads.net/*", "*://*.threads.com/*", "*://*.instagram.com/*"],
          js: ["content.js"],
          run_at: "document_start",
        },
      ]
    },
    null,
    2
  );
};

export const generateStyles = () => `/* v12.1 Styles */`;

export const generatePopupHTML = () => `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { width: 220px; background: #1a1a1a; color: white; font-family: -apple-system, sans-serif; padding: 16px; user-select: none; }
    h2 { margin: 0 0 16px 0; font-size: 16px; border-bottom: 1px solid #333; padding-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    label { font-size: 14px; color: #ddd; }
    
    /* Switch */
    .switch { position: relative; display: inline-block; width: 40px; height: 20px; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #444; transition: .4s; border-radius: 20px; }
    .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
    input:checked + .slider { background-color: #2563eb; }
    input:checked + .slider:before { transform: translateX(20px); }
    
    .footer { margin-top: 16px; font-size: 10px; color: #666; text-align: center; border-top: 1px solid #333; padding-top: 8px; }
  </style>
</head>
<body>
  <h2>
    <span>⚙️ Settings</span>
  </h2>
  
  <div class="row">
    <label for="toggle-threads">Threads</label>
    <label class="switch">
      <input type="checkbox" id="toggle-threads">
      <span class="slider"></span>
    </label>
  </div>

  <div class="row">
    <label for="toggle-instagram">Instagram</label>
    <label class="switch">
      <input type="checkbox" id="toggle-instagram">
      <span class="slider"></span>
    </label>
  </div>

  <div class="footer">Threads Video Pro</div>
  <script src="popup.js"></script>
</body>
</html>`;

export const generatePopupJS = () => `
document.addEventListener('DOMContentLoaded', () => {
  const tThreads = document.getElementById('toggle-threads');
  const tInsta = document.getElementById('toggle-instagram');

  // Load saved settings (Default true)
  chrome.storage.sync.get(['enableThreads', 'enableInstagram'], (items) => {
    tThreads.checked = items.enableThreads !== false; 
    tInsta.checked = items.enableInstagram !== false; 
  });

  // Save on change
  const update = () => {
    const settings = {
      enableThreads: tThreads.checked,
      enableInstagram: tInsta.checked
    };
    chrome.storage.sync.set(settings, () => {
      // Notify active tabs
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if(tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATE', settings });
        }
      });
    });
  };

  tThreads.addEventListener('change', update);
  tInsta.addEventListener('change', update);
});
`;

export const generateContentScript = () => `
// Threads Video Pro - Content Script v12.1
// Strategy: "Surgical Shield" for IG, "Fixed Dock" for Threads.

(function() {
  if (window.TVP_INSTANCE) return;
  window.TVP_INSTANCE = true;
  console.log('Threads Video Pro v12.1: Loaded');

  let isEnabled = true;
  const isInstagram = window.location.hostname.includes('instagram.com');
  const isThreads = window.location.hostname.includes('threads');

  // --- 0. CSS: Hide Native Controls (Visual only) ---
  const styleEl = document.createElement('style');
  styleEl.textContent = \`
    video::-webkit-media-controls {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
    }
    video::-webkit-media-controls-enclosure {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
    }
  \`;
  (document.documentElement || document.head).appendChild(styleEl);

  // --- 1. Host Setup ---
  const host = document.createElement('div');
  host.id = 'tvp-host-v12';
  host.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; z-index:2147483647; pointer-events:none;'; 
  (document.documentElement).appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  // --- 2. Styles for Overlay & Controller ---
  const style = document.createElement('style');
  style.textContent = \`
    :host { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    
    /* THE FOOTER BLOCKER (IG Only mostly) */
    #footer-blocker {
      position: absolute;
      background: transparent; /* Invisible */
      /* background: rgba(255,0,0,0.3); /* Debug: Red Tint */
      cursor: default;
      pointer-events: auto; /* Catch clicks */
      display: none;
      z-index: 1000; 
    }

    #ctrl {
      background: rgba(10, 10, 10, 0.9);
      backdrop-filter: blur(10px);
      padding: 0 18px;
      height: 46px;
      border-radius: 999px;
      
      display: flex;
      align-items: center;
      gap: 14px;
      
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 8px 32px rgba(0,0,0,0.7);
      
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: auto; 
      user-select: none;
      visibility: hidden;
      z-index: 2000;
    }
    
    #ctrl.show {
      opacity: 1;
      visibility: visible;
    }

    button {
      background: transparent;
      border: none;
      color: #ddd;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
    }
    button:hover { background: rgba(255, 255, 255, 0.2); color: #fff; }
    button:active { transform: scale(0.9); }

    .time {
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      color: #bbb;
      min-width: 38px;
      text-align: center;
      font-weight: 500;
    }

    .slider-box {
      width: 180px;
      height: 46px;
      display: flex;
      align-items: center;
      position: relative;
    }
    
    input[type=range] {
      -webkit-appearance: none;
      width: 100%;
      height: 4px;
      background: rgba(255,255,255,0.25);
      border-radius: 2px;
      outline: none;
      cursor: pointer;
      transition: height 0.2s;
    }
    input[type=range]:hover { height: 6px; }
    
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.5);
      margin-top: 0;
    }
    input[type=range]:hover::-webkit-slider-thumb {
        transform: scale(1.3);
    }

    select {
      background: rgba(255,255,255,0.1);
      color: #eee;
      border: none;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: bold;
      outline: none;
      cursor: pointer;
      height: 24px;
    }
    select:hover { background: rgba(255,255,255,0.3); color: #fff; }
    select option { background: #111; color: #fff; }
  \`;
  shadow.appendChild(style);

  // --- 3. UI Template ---
  const svgs = {
    play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    vol: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>',
    mute: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>'
  };

  const wrapper = document.createElement('div');
  wrapper.innerHTML = \`
    <div id="footer-blocker"></div>
    <div id="ctrl">
        <button id="btn-play">\${svgs.play}</button>
        <div class="time" id="lbl-time">0:00</div>
        <div class="slider-box">
        <input type="range" id="inp-seek" min="0" max="100" step="0.1" value="0">
        </div>
        <select id="sel-rate">
        <option value="0.5">0.5x</option>
        <option value="1" selected>1x</option>
        <option value="1.5">1.5x</option>
        <option value="2">2x</option>
        <option value="3">3x</option>
        </select>
        <button id="btn-vol">\${svgs.vol}</button>
    </div>
  \`;
  shadow.appendChild(wrapper);

  // --- 4. Logic & Settings ---
  const $ = (id) => shadow.getElementById(id);
  const ui = {
    blocker: $('footer-blocker'),
    ctrl: $('ctrl'),
    play: $('btn-play'),
    time: $('lbl-time'),
    seek: $('inp-seek'),
    rate: $('sel-rate'),
    vol: $('btn-vol')
  };

  let activeVideo = null;
  let isDragging = false;
  let hideTimeout = null;
  
  function checkConfig(settings) {
      if(isInstagram) {
          isEnabled = settings.enableInstagram !== false;
      } else if (isThreads) {
          isEnabled = settings.enableThreads !== false;
      }
      host.style.display = isEnabled ? 'block' : 'none';
      if(!isEnabled) hideAll();
  }

  chrome.storage.sync.get(['enableThreads', 'enableInstagram'], checkConfig);

  chrome.runtime.onMessage.addListener((msg) => {
      if(msg.type === 'SETTINGS_UPDATE') checkConfig(msg.settings);
  });

  // --- 5. Event Handling ---
  const stop = (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.type === 'mousedown' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'INPUT') {
        e.preventDefault(); 
    }
  };

  ui.blocker.onclick = stop;
  ui.blocker.onmousedown = stop;
  ui.blocker.onmouseup = stop;
  ui.blocker.ondblclick = stop;
  
  ui.ctrl.onmouseenter = () => clearTimeout(hideTimeout);
  ui.ctrl.onmouseleave = () => startHide(500);

  ui.play.onclick = (e) => {
      stop(e);
      if(activeVideo) {
          activeVideo.paused ? activeVideo.play() : activeVideo.pause();
          updateState();
      }
  };

  ui.vol.onclick = (e) => {
      stop(e);
      if(activeVideo) {
          const m = activeVideo.muted || activeVideo.volume === 0;
          if (m) { activeVideo.muted = false; activeVideo.volume = 1; }
          else { activeVideo.muted = true; }
          updateState();
      }
  };

  ui.rate.onchange = (e) => {
      if(activeVideo) activeVideo.playbackRate = parseFloat(e.target.value);
  };
  ui.rate.onmousedown = (e) => e.stopPropagation();

  ui.seek.oninput = (e) => {
      isDragging = true;
      if(activeVideo && activeVideo.duration) {
          activeVideo.currentTime = (parseFloat(e.target.value) / 100) * activeVideo.duration;
      }
  };
  ui.seek.onchange = (e) => {
      isDragging = false;
      if(activeVideo) activeVideo.play();
  };
  ui.seek.onmousedown = (e) => { stop(e); if(activeVideo) activeVideo.pause(); };

  // --- 6. Detection Loop ---
  document.addEventListener('mousemove', (e) => {
      if(!isEnabled) return;
      
      const mx = e.clientX;
      const my = e.clientY;
      const videos = document.getElementsByTagName('video');
      let found = null;

      for(let i=0; i<videos.length; i++) {
        const v = videos[i];
        if(v.offsetParent === null) continue; 
        const r = v.getBoundingClientRect();
        
        // Use a slight padding to trigger
        if(mx >= r.left && mx <= r.right && my >= r.top && my <= r.bottom) {
             if(r.width > 100 && r.height > 100) {
                 found = v;
                 break;
             }
        }
      }

      if(found) {
          if(activeVideo !== found) {
              activeVideo = found;
              activeVideo.addEventListener('play', updateState);
              activeVideo.addEventListener('pause', updateState);
              activeVideo.addEventListener('volumechange', updateState);
              showAll();
          } else {
              showAll();
          }
      } else {
          startHide(500);
      }
  }, { passive: true });

  function showAll() {
      if(!activeVideo) return;
      clearTimeout(hideTimeout);
      
      const r = activeVideo.getBoundingClientRect();
      
      // --- Threads: Fixed Dock Mode ---
      if (isThreads) {
        ui.ctrl.style.position = 'fixed';
        ui.ctrl.style.bottom = '30px';
        ui.ctrl.style.left = '50%';
        ui.ctrl.style.transform = 'translateX(-50%)';
        ui.ctrl.classList.add('show');
        
        // No blocker for Threads usually needed, or minimal
        ui.blocker.style.display = 'none'; 
      } 
      
      // --- Instagram: Floating Mode with Surgical Blocker ---
      else {
        ui.ctrl.style.position = 'absolute';
        
        // 1. Position Blocker (Surgical Shield)
        // Only width 40% to allow clicking tags (left) and share (right)
        // Positioned slightly higher to avoid Reply input
        const bWidth = r.width * 0.4; 
        const bLeft = r.left + (r.width * 0.3); // Center it (30% left offset + 40% width + 30% right space)
        
        ui.blocker.style.display = 'block';
        ui.blocker.style.width = bWidth + 'px';
        ui.blocker.style.height = '50px'; 
        ui.blocker.style.top = (r.bottom - 60) + 'px'; // Sit just above very bottom
        ui.blocker.style.left = bLeft + 'px';

        // 2. Position Controller
        ui.ctrl.style.top = (r.bottom - 70) + 'px'; 
        ui.ctrl.style.left = (r.left + (r.width/2)) + 'px';
        ui.ctrl.style.transform = 'translateX(-50%)';
        ui.ctrl.classList.add('show');
      }

      updateState();
  }

  function startHide(delay) {
      if(isDragging) return;
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(hideAll, delay);
  }

  function hideAll() {
      ui.ctrl.classList.remove('show');
      ui.blocker.style.display = 'none';
  }

  function updateState() {
      if(!activeVideo) return;
      ui.play.innerHTML = activeVideo.paused ? svgs.play : svgs.pause;
      const isMuted = activeVideo.muted || activeVideo.volume === 0;
      ui.vol.innerHTML = isMuted ? svgs.mute : svgs.vol;
  }

  function loop() {
      if(isEnabled && activeVideo && ui.ctrl.classList.contains('show')) {
          if(activeVideo.hasAttribute('controls')) activeVideo.removeAttribute('controls');
          
          if (isThreads) {
              // Threads: Controller is fixed, no updates needed per frame for position
          } else {
             // IG: Update positions
             const r = activeVideo.getBoundingClientRect();
             const bWidth = r.width * 0.4; 
             const bLeft = r.left + (r.width * 0.3);
             ui.blocker.style.top = (r.bottom - 60) + 'px';
             ui.blocker.style.left = bLeft + 'px';
             ui.blocker.style.width = bWidth + 'px';
             
             ui.ctrl.style.top = (r.bottom - 70) + 'px';
             ui.ctrl.style.left = (r.left + (r.width/2)) + 'px';
          }

          if(activeVideo.duration && !isDragging) {
             const pct = (activeVideo.currentTime / activeVideo.duration) * 100;
             ui.seek.value = pct;
             ui.seek.style.background = \`linear-gradient(to right, #fff \${pct}%, rgba(255,255,255,0.25) \${pct}%)\`;
             
             const m = Math.floor(activeVideo.currentTime / 60);
             const s = Math.floor(activeVideo.currentTime % 60);
             ui.time.innerText = \`\${m}:\${s.toString().padStart(2,'0')}\`;
          }
      }
      requestAnimationFrame(loop);
  }
  loop();

})();
`;