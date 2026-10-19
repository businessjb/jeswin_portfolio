/**
 * Main Application Orchestrator for Jeswin B Maliyekkal's 3D Resume Portfolio & Game
 * Connects Three.js, Camera Follow, Physics, Vehicle, World, UI HUD, Radar Minimap,
 * Resume Modals, and Audio Synthesizer.
 */

class App {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      handbrake: false,
    };

    this.cameraModes = ['isometric', 'chase', 'topdown'];
    this.currentCameraMode = 0;
    this.camTargetLookAt = new THREE.Vector3();
    this.camCurrentPos = new THREE.Vector3();

    this.themes = ['night', 'sunset', 'day'];
    this.currentThemeIdx = 0;

    this.lastTime = performance.now();
    this.currentInteractCallback = null;

    this.initThree();
    this.initLights();
    this.initGame();
    this.initInputListeners();
    this.initHUD();
    this.initMinimap();
    this.setupWindowResize();

    requestAnimationFrame((t) => this.animate(t));
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x07090e);
    this.scene.fog = new THREE.FogExp2(0x07090e, 0.007);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
    this.camera.position.set(24, 30, 24);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
  }

  initLights() {
    this.ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.7);
    this.hemiLight.position.set(0, 60, 0);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xdbeafe, 1.8);
    this.dirLight.position.set(70, 110, 60);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 320;
    const d = 130;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
  }

  setTheme(themeName) {
    if (themeName === 'night') {
      this.scene.background.setHex(0x07090e);
      this.scene.fog.color.setHex(0x07090e);
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 1.3;
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 1.4;
      this.hemiLight.color.setHex(0x0ea5e9);
      this.hemiLight.groundColor.setHex(0x05070a);
      if (this.vehicle) {
        this.vehicle.headlights.forEach((h) => (h.intensity = 2.8));
        this.vehicle.underglow.intensity = 2.4;
      }
    } else if (themeName === 'sunset') {
      this.scene.background.setHex(0x1c1018);
      this.scene.fog.color.setHex(0x1c1018);
      this.ambientLight.color.setHex(0x7c2d12);
      this.ambientLight.intensity = 1.5;
      this.dirLight.color.setHex(0xfb923c);
      this.dirLight.intensity = 2.2;
      this.hemiLight.color.setHex(0xf43f5e);
      this.hemiLight.groundColor.setHex(0x18181b);
      if (this.vehicle) {
        this.vehicle.headlights.forEach((h) => (h.intensity = 2.0));
        this.vehicle.underglow.intensity = 1.8;
      }
    } else if (themeName === 'day') {
      this.scene.background.setHex(0xe2e8f0);
      this.scene.fog.color.setHex(0xe2e8f0);
      this.ambientLight.color.setHex(0xffffff);
      this.ambientLight.intensity = 1.8;
      this.dirLight.color.setHex(0xffffff);
      this.dirLight.intensity = 2.0;
      this.hemiLight.color.setHex(0xbae6fd);
      this.hemiLight.groundColor.setHex(0x94a3b8);
      if (this.vehicle) {
        this.vehicle.headlights.forEach((h) => (h.intensity = 0.5));
        this.vehicle.underglow.intensity = 0.8;
      }
    }
  }

  toggleTheme() {
    this.currentThemeIdx = (this.currentThemeIdx + 1) % this.themes.length;
    const nextTheme = this.themes[this.currentThemeIdx];
    this.setTheme(nextTheme);
    window.showToast(`🎨 Theme: ${nextTheme.toUpperCase()}`);
  }

  toggleCameraMode() {
    this.currentCameraMode = (this.currentCameraMode + 1) % this.cameraModes.length;
    const mode = this.cameraModes[this.currentCameraMode];
    window.showToast(`🎥 Camera: ${mode.toUpperCase()} MODE`);
  }

  initGame() {
    this.physics = window.physicsEngine;
    this.vehicle = new window.Vehicle(this.scene);
    this.world = new window.WorldBuilder(this.scene, this.physics);

    this.vehicle.respawn({ x: 0, y: 0.1, z: 0 });
    this.camCurrentPos.set(24, 30, 24);
  }

  initInputListeners() {
    window.addEventListener('keydown', (e) => {
      if (window.soundEngine) window.soundEngine.resume();

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = true;
          break;
        case 'Space':
          this.input.handbrake = true;
          e.preventDefault();
          break;
        case 'KeyH':
          if (window.soundEngine) window.soundEngine.playHonk();
          break;
        case 'KeyR':
          this.vehicle.respawn({ x: 0, y: 0.1, z: 0 });
          window.showToast('🚀 Vehicle Respawned at Launchpad');
          break;
        case 'KeyC':
          this.toggleCameraMode();
          break;
        case 'KeyT':
          this.toggleTheme();
          break;
        case 'KeyM':
          this.toggleAudio();
          break;
        case 'KeyE':
        case 'Enter':
          if (this.currentInteractCallback) {
            this.currentInteractCallback();
          }
          break;
        case 'Escape':
          window.closeAllModals();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.input.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.input.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.input.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.input.right = false;
          break;
        case 'Space':
          this.input.handbrake = false;
          break;
      }
    });

    this.initTouchControls();
  }

  initTouchControls() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const touchOverlay = document.getElementById('touch-controls');
    if (isTouchDevice && touchOverlay) {
      touchOverlay.classList.add('active');
    }

    const joystickZone = document.getElementById('joystick-zone');
    const joystickKnob = document.getElementById('joystick-knob');

    if (joystickZone && joystickKnob) {
      let touchId = null;
      let startX = 0;
      let startY = 0;
      const maxRadius = 45;

      const handleTouchStart = (e) => {
        if (touchId !== null) return;
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = joystickZone.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        if (window.soundEngine) window.soundEngine.resume();
      };

      const handleTouchMove = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === touchId) {
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const clampedDist = Math.min(dist, maxRadius);
            const angle = Math.atan2(dy, dx);

            const knobX = Math.cos(angle) * clampedDist;
            const knobY = Math.sin(angle) * clampedDist;
            joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

            this.input.left = knobX < -15;
            this.input.right = knobX > 15;
            this.input.forward = knobY < -15;
            this.input.backward = knobY > 15;
          }
        }
      };

      const handleTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === touchId) {
            touchId = null;
            joystickKnob.style.transform = 'translate(0px, 0px)';
            this.input.left = false;
            this.input.right = false;
            this.input.forward = false;
            this.input.backward = false;
          }
        }
      };

      joystickZone.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
      window.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }

    const bindTouchBtn = (id, onDown, onUp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (window.soundEngine) window.soundEngine.resume();
        onDown();
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        onUp();
      });
    };

    bindTouchBtn('touch-btn-gas', () => (this.input.forward = true), () => (this.input.forward = false));
    bindTouchBtn('touch-btn-brake', () => (this.input.backward = true), () => (this.input.backward = false));
    bindTouchBtn('touch-btn-drift', () => (this.input.handbrake = true), () => (this.input.handbrake = false));
    bindTouchBtn('touch-btn-horn', () => {
      if (window.soundEngine) window.soundEngine.playHonk();
    }, () => {});
  }

  initHUD() {
    this.speedValEl = document.getElementById('speed-value');
    this.speedBarFillEl = document.getElementById('speed-bar-fill');
    this.gearValEl = document.getElementById('gear-val');
    this.gemCountEl = document.getElementById('gem-count');
    this.zoneTitleEl = document.getElementById('zone-title');
    this.zoneSubEl = document.getElementById('zone-sub');
    this.zoneAnnouncerEl = document.getElementById('zone-announcer');
    this.interactPromptEl = document.getElementById('interact-prompt');
    this.interactTextEl = document.getElementById('interact-text');
    this.toastEl = document.getElementById('toast-notice');

    // Teleport Navigation
    const teleports = {
      'nav-home': { x: 0, z: 0, heading: 0 },
      'nav-resume': { x: 0, z: -10, heading: Math.PI },
      'nav-projects': { x: -40, z: 25, heading: Math.PI / 2 },
      'nav-internship': { x: -45, z: -35, heading: Math.PI },
      'nav-education': { x: -80, z: -35, heading: Math.PI },
      'nav-skills': { x: 50, z: 25, heading: -Math.PI / 2 },
      'nav-bowling': { x: 85, z: 32, heading: 0 },
      'nav-stunts': { x: 50, z: -20, heading: Math.PI },
      'nav-contact': { x: 0, z: -60, heading: Math.PI },
    };

    for (const [btnId, target] of Object.entries(teleports)) {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          this.teleportVehicle(target);
          document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        });
      }
    }

    document.getElementById('btn-audio-toggle')?.addEventListener('click', () => this.toggleAudio());
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('btn-camera-toggle')?.addEventListener('click', () => this.toggleCameraMode());
    document.getElementById('btn-help-toggle')?.addEventListener('click', () => window.openHelpModal());
    document.getElementById('btn-respawn')?.addEventListener('click', () => {
      this.vehicle.respawn({ x: 0, y: 0.1, z: 0 });
      window.showToast('🚀 Vehicle Respawned at Launchpad');
    });

    this.interactPromptEl?.addEventListener('click', () => {
      if (this.currentInteractCallback) {
        this.currentInteractCallback();
      }
    });
  }

  toggleAudio() {
    if (!window.soundEngine) return;
    const isMuted = window.soundEngine.toggleMute();
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) {
      btn.classList.toggle('active', !isMuted);
    }
    window.showToast(isMuted ? '🔇 Audio Muted' : '🔊 Audio Active');
  }

  teleportVehicle(target) {
    this.vehicle.pos.x = target.x;
    this.vehicle.pos.y = 0.2;
    this.vehicle.pos.z = target.z;
    this.vehicle.heading = target.heading;
    this.vehicle.speed = 0;
    this.vehicle.vy = 0;
    this.vehicle.rootGroup.position.set(target.x, 0.2, target.z);
    this.vehicle.rootGroup.rotation.y = target.heading;

    if (window.soundEngine) {
      window.soundEngine.playBoost();
    }
    window.showToast('⚡ Teleported to Zone');
  }

  initMinimap() {
    if (!this.minimapCanvas) return;
    this.minimapCanvas.width = 140;
    this.minimapCanvas.height = 140;
  }

  renderMinimap() {
    if (!this.minimapCtx) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const worldSize = 280;
    const toMapX = (wx) => ((wx + 140) / worldSize) * w;
    const toMapY = (wz) => ((wz + 140) / worldSize) * h;

    // Rings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    // Zone Blips
    const blips = [
      { x: 0, z: 0, color: '#ffffff' },        // Spawn
      { x: 0, z: -18, color: '#38bdf8' },      // Resume
      { x: -70, z: 50, color: '#00f0ff' },     // Projects
      { x: -45, z: -45, color: '#00f59b' },    // Internship
      { x: -80, z: -45, color: '#6366f1' },    // Education
      { x: -45, z: -80, color: '#ffb703' },    // ICPC Trophy
      { x: 50, z: 50, color: '#f59e0b' },      // Skills Arena
      { x: 85, z: 50, color: '#ef4444' },      // Bowling
      { x: 65, z: -45, color: '#ff007f' },     // Stunts
      { x: 0, z: -71, color: '#a855f7' },      // Contact
    ];

    blips.forEach((b) => {
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(toMapX(b.x), toMapY(b.z), 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Uncollected Gems
    if (this.world && this.world.gems) {
      ctx.fillStyle = '#ffb703';
      this.world.gems.forEach((g) => {
        if (!g.collected) {
          ctx.fillRect(toMapX(g.x) - 1, toMapY(g.z) - 1, 2, 2);
        }
      });
    }

    // Vehicle Marker
    const carX = toMapX(this.vehicle.pos.x);
    const carY = toMapY(this.vehicle.pos.z);

    ctx.save();
    ctx.translate(carX, carY);
    ctx.rotate(-this.vehicle.heading);

    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(0, -2);
    ctx.stroke();

    ctx.restore();
  }

  updateCamera(dt) {
    const carPos = this.vehicle.pos;
    const mode = this.cameraModes[this.currentCameraMode];

    let targetCamPos = new THREE.Vector3();
    let lookTarget = new THREE.Vector3(carPos.x, carPos.y + 1.2, carPos.z);

    if (mode === 'isometric') {
      const isoDist = 26.0;
      targetCamPos.set(carPos.x + isoDist, carPos.y + 32.0, carPos.z + isoDist);
      lookTarget.set(carPos.x - 2, carPos.y + 1, carPos.z - 2);
    } else if (mode === 'chase') {
      const dist = 10.0;
      const height = 4.5;
      const behindX = carPos.x - Math.sin(this.vehicle.heading) * dist;
      const behindZ = carPos.z - Math.cos(this.vehicle.heading) * dist;
      targetCamPos.set(behindX, carPos.y + height, behindZ);
      lookTarget.set(
        carPos.x + Math.sin(this.vehicle.heading) * 6,
        carPos.y + 1.5,
        carPos.z + Math.cos(this.vehicle.heading) * 6
      );
    } else if (mode === 'topdown') {
      targetCamPos.set(carPos.x, carPos.y + 60.0, carPos.z + 0.1);
      lookTarget.set(carPos.x, carPos.y, carPos.z);
    }

    const lerpSpeed = mode === 'chase' ? 8.0 : 4.5;
    this.camCurrentPos.lerp(targetCamPos, dt * lerpSpeed);
    this.camTargetLookAt.lerp(lookTarget, dt * 6.0);

    this.camera.position.copy(this.camCurrentPos);
    this.camera.lookAt(this.camTargetLookAt);
  }

  updateHUD() {
    const rawSpeed = this.vehicle.speed;
    const kmh = Math.round(Math.abs(rawSpeed) * 3.6);

    if (this.speedValEl) this.speedValEl.textContent = kmh;

    if (this.speedBarFillEl) {
      const pct = Math.min((Math.abs(rawSpeed) / (this.vehicle.maxSpeed * 1.5)) * 100, 100);
      this.speedBarFillEl.style.width = `${pct}%`;
    }

    if (this.gearValEl) {
      let gear = 'N';
      if (rawSpeed < -0.5) gear = 'R';
      else if (kmh > 75) gear = '4';
      else if (kmh > 45) gear = '3';
      else if (kmh > 20) gear = '2';
      else if (kmh > 2) gear = '1';
      this.gearValEl.textContent = gear;
    }
  }

  animate(currentTime) {
    requestAnimationFrame((t) => this.animate(t));

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.physics.updateVehicle(this.vehicle, this.input, dt);
    this.vehicle.update(dt, this.input);
    this.world.update(dt, this.vehicle);

    if (window.soundEngine) {
      window.soundEngine.updateEngine(
        this.vehicle.speed,
        this.input.forward,
        this.input.backward
      );
      window.soundEngine.updateDrift(this.vehicle.lateralSlip);
    }

    this.updateCamera(dt);
    this.updateHUD();
    this.renderMinimap();

    this.renderer.render(this.scene, this.camera);
  }

  setupWindowResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
}

// Global UI Hook Helpers
window.onZoneEntered = (zone) => {
  const titleEl = document.getElementById('zone-title');
  const subEl = document.getElementById('zone-sub');
  const announcer = document.getElementById('zone-announcer');

  if (titleEl) titleEl.textContent = zone.name;
  if (subEl) subEl.textContent = zone.sub || 'INTERACTIVE ZONE';

  if (announcer) {
    announcer.classList.add('visible');
    clearTimeout(window._zoneTimeout);
    window._zoneTimeout = setTimeout(() => {
      announcer.classList.remove('visible');
    }, 3500);
  }
};

window.showInteractPrompt = (text, callback) => {
  const prompt = document.getElementById('interact-prompt');
  const textEl = document.getElementById('interact-text');
  if (prompt && textEl) {
    textEl.textContent = text;
    prompt.classList.add('visible');
  }
  if (window.app) {
    window.app.currentInteractCallback = callback;
  }
};

window.hideInteractPrompt = () => {
  const prompt = document.getElementById('interact-prompt');
  if (prompt) {
    prompt.classList.remove('visible');
  }
  if (window.app) {
    window.app.currentInteractCallback = null;
  }
};

window.showToast = (msg) => {
  const toast = document.getElementById('toast-notice');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
};

window.updateGemHUD = (collected, total) => {
  const el = document.getElementById('gem-count');
  if (el) {
    el.textContent = `${collected} / ${total}`;
  }
  window.showToast(`💎 Gem Collected! (${collected}/${total})`);
};

window.triggerVictoryCelebration = () => {
  window.showToast('🎉 ALL 25 GEMS DISCOVERED! MASTER DRIVER UNLOCKED!');
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');

  const confettis = [];
  const colors = ['#00f0ff', '#ff007f', '#ffb703', '#00f59b', '#ffffff'];

  for (let i = 0; i < 200; i++) {
    confettis.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 5 + 4,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 10,
    });
  }

  let startTime = performance.now();
  const renderConfetti = (now) => {
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const c of confettis) {
      c.x += c.vx;
      c.y += c.vy;
      c.rot += c.vrot;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((c.rot * Math.PI) / 180);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
      ctx.restore();
    }

    if (elapsed < 6000) {
      requestAnimationFrame(renderConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  requestAnimationFrame(renderConfetti);
};

// Modal Open / Close Handlers
window.openResumeModal = () => {
  const modal = document.getElementById('resume-modal');
  if (modal) modal.classList.add('open');
};

window.openProjectModal = (proj) => {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  document.getElementById('modal-proj-title').textContent = proj.title;
  document.getElementById('modal-proj-cat').textContent = proj.category;
  document.getElementById('modal-proj-desc').textContent = proj.desc;
  document.getElementById('modal-proj-code').textContent = proj.code;

  const repoLinkBtn = document.getElementById('modal-proj-repo-btn');
  if (repoLinkBtn) {
    repoLinkBtn.href = proj.githubUrl || 'https://github.com/JB1071017';
    repoLinkBtn.textContent = `View ${proj.name} on GitHub`;
  }

  const statsContainer = document.getElementById('modal-proj-stats');
  statsContainer.innerHTML = '';
  proj.stats.forEach((s) => {
    const box = document.createElement('div');
    box.className = 'stat-box';
    box.innerHTML = `<span class="stat-val">${s.val}</span><span class="stat-desc">${s.desc}</span>`;
    statsContainer.appendChild(box);
  });

  const tagsContainer = document.getElementById('modal-proj-tags');
  tagsContainer.innerHTML = '';
  proj.tech.forEach((t) => {
    const tag = document.createElement('span');
    tag.className = 'tech-tag';
    tag.textContent = t;
    tagsContainer.appendChild(tag);
  });

  modal.classList.add('open');
};

window.openExperienceModal = () => {
  const modal = document.getElementById('experience-modal');
  if (modal) modal.classList.add('open');
};

window.openEducationModal = () => {
  const modal = document.getElementById('education-modal');
  if (modal) modal.classList.add('open');
};

window.openAchievementsModal = () => {
  const modal = document.getElementById('achievements-modal');
  if (modal) modal.classList.add('open');
};

window.openContactModal = () => {
  const modal = document.getElementById('contact-modal');
  if (modal) modal.classList.add('open');
};

window.openHelpModal = () => {
  const modal = document.getElementById('help-modal');
  if (modal) modal.classList.add('open');
};

window.closeAllModals = () => {
  document.querySelectorAll('.modal-overlay').forEach((m) => m.classList.remove('open'));
};

window.copyEmailToClipboard = () => {
  navigator.clipboard.writeText('23cs350@mgits.ac.in').then(() => {
    window.showToast('📋 Email copied: 23cs350@mgits.ac.in');
  });
};

window.addEventListener('DOMContentLoaded', () => {
  window.app = new App();

  document.querySelectorAll('.modal-close-btn').forEach((btn) => {
    btn.addEventListener('click', () => window.closeAllModals());
  });

  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        window.closeAllModals();
      }
    });
  });
});
