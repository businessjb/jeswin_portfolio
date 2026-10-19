/**
 * 3D World Generator for Jeswin B Maliyekkal's Resume Portfolio & Game
 * Features:
 * - Real GitHub Projects from https://github.com/businessjb
 * - Education Pavilion: Muthoot Institute of Technology and Science (B.Tech CSE, CGPA 7.88)
 * - Internship Monument: NaicoITS Infopark Kochi (Cyber Security Intern)
 * - ICPC Programming Contest Winner Trophy Monument
 * - Interactive Resume Pavilion with 1-Click PDF Download
 * - 10-Pin Bowling Alley with Heavy Bowling Ball
 * - Destructible Brick Wall (24 Smashable Bricks)
 * - Skills Demolition Arena (Python, Django, C++, Java, OpenCV, Firebase, etc.)
 * - Mega Stunt Ramps and Super Spring Trampoline
 * - 150+ Trees, 80+ Boulders, 40+ Street Lampposts, Traffic Cones, Barriers
 * - 25 Collectible Golden Gems
 */

class WorldBuilder {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;

    this.gems = [];
    this.collectedGemsCount = 0;
    this.totalGemsCount = 25;

    this.rotatingProps = [];
    this.resetBtnMesh = null;

    this.initTextures();
    this.buildGroundAndRoads();
    this.buildBoundaryWallsAndMountains();
    this.buildLaunchpadAndResumePavilion();
    this.buildProjectsDistrict();
    this.buildInternshipDistrict();
    this.buildEducationDistrict();
    this.buildAchievementsDistrict();
    this.buildSkillsArena();
    this.buildBowlingAlley();
    this.buildDestructibleBrickWall();
    this.buildStuntParkAndTrampoline();
    this.buildContactTower();
    this.spawnCollectibleGems();
    this.buildDenseScenery();
  }

  initTextures() {
    // 1. Grid Ground Texture
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = 512;
    gridCanvas.height = 512;
    const gctx = gridCanvas.getContext('2d');

    gctx.fillStyle = '#0a0e17';
    gctx.fillRect(0, 0, 512, 512);

    gctx.strokeStyle = '#1e293b';
    gctx.lineWidth = 2;
    const step = 64;
    for (let i = 0; i <= 512; i += step) {
      gctx.beginPath();
      gctx.moveTo(i, 0);
      gctx.lineTo(i, 512);
      gctx.stroke();

      gctx.beginPath();
      gctx.moveTo(0, i);
      gctx.lineTo(512, i);
      gctx.stroke();
    }

    gctx.fillStyle = '#00f0ff';
    for (let x = 0; x <= 512; x += step) {
      for (let y = 0; y <= 512; y += step) {
        if ((x + y) % (step * 2) === 0) {
          gctx.fillRect(x - 2, y - 2, 4, 4);
        }
      }
    }

    this.groundTexture = new THREE.CanvasTexture(gridCanvas);
    this.groundTexture.wrapS = THREE.RepeatWrapping;
    this.groundTexture.wrapT = THREE.RepeatWrapping;
    this.groundTexture.repeat.set(40, 40);

    // 2. Asphalt Road Texture
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 256;
    roadCanvas.height = 256;
    const rctx = roadCanvas.getContext('2d');

    rctx.fillStyle = '#111827';
    rctx.fillRect(0, 0, 256, 256);

    rctx.strokeStyle = '#00f0ff';
    rctx.lineWidth = 8;
    rctx.beginPath();
    rctx.moveTo(10, 0);
    rctx.lineTo(10, 256);
    rctx.moveTo(246, 0);
    rctx.lineTo(246, 256);
    rctx.stroke();

    rctx.strokeStyle = '#f59e0b';
    rctx.lineWidth = 6;
    rctx.setLineDash([24, 20]);
    rctx.beginPath();
    rctx.moveTo(128, 0);
    rctx.lineTo(128, 256);
    rctx.stroke();

    this.roadTexture = new THREE.CanvasTexture(roadCanvas);
    this.roadTexture.wrapS = THREE.RepeatWrapping;
    this.roadTexture.wrapT = THREE.RepeatWrapping;
    this.roadTexture.repeat.set(1, 16);
  }

  createTextTexture(text, bgColor = '#0f172a', textColor = '#00f0ff', fontSize = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = textColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, 496, 240);

    ctx.fillStyle = textColor;
    ctx.font = `bold ${fontSize}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 128);

    return new THREE.CanvasTexture(canvas);
  }

  buildGroundAndRoads() {
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({
      map: this.groundTexture,
      roughness: 0.8,
      metalness: 0.2,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Main Avenue Network
    this.createRoadSegment(0, -90, 0, 90, 10);     // Central Spine (North-South)
    this.createRoadSegment(-90, 0, 90, 0, 10);     // Central Boulevard (East-West)
    this.createRoadSegment(0, 45, -75, 45, 8);     // West Branch to GitHub Projects
    this.createRoadSegment(0, -45, -75, -45, 8);   // South-West Branch to Education & Internship
    this.createRoadSegment(0, 45, 75, 45, 8);      // East Branch to Skills & Bowling
    this.createRoadSegment(0, -45, 75, -45, 8);    // South-East Branch to Stunt Park
  }

  createRoadSegment(x1, z1, x2, z2, width = 8) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dx, dz);

    const roadGeo = new THREE.PlaneGeometry(width, length);
    const roadMat = new THREE.MeshStandardMaterial({
      map: this.roadTexture,
      roughness: 0.6,
      metalness: 0.3,
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.rotation.z = -angle;
    road.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
    road.receiveShadow = true;
    this.scene.add(road);
  }

  buildBoundaryWallsAndMountains() {
    // Glowing boundary fence
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const glowRailMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    const borders = [
      { x: 0, z: -140, w: 280, d: 2 },
      { x: 0, z: 140, w: 280, d: 2 },
      { x: -140, z: 0, w: 2, d: 280 },
      { x: 140, z: 0, w: 2, d: 280 },
    ];

    borders.forEach((b) => {
      const wallGeo = new THREE.BoxGeometry(b.w, 2.0, b.d);
      const wall = new THREE.Mesh(wallGeo, fenceMat);
      wall.position.set(b.x, 1.0, b.z);
      this.scene.add(wall);

      const railGeo = new THREE.BoxGeometry(b.w, 0.25, b.d);
      const rail = new THREE.Mesh(railGeo, glowRailMat);
      rail.position.set(b.x, 2.1, b.z);
      this.scene.add(rail);

      this.physics.addStaticCollider({
        minX: b.x - b.w / 2,
        maxX: b.x + b.w / 2,
        minZ: b.z - b.d / 2,
        maxZ: b.z + b.d / 2,
      });
    });

    // Distant low-poly mountain ridge
    const mountainGeo = new THREE.ConeGeometry(18, 32, 5);
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dist = 145 + Math.random() * 15;
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(Math.cos(angle) * dist, 12, Math.sin(angle) * dist);
      m.scale.set(1 + Math.random() * 0.6, 0.8 + Math.random() * 0.8, 1 + Math.random() * 0.6);
      this.scene.add(m);
    }
  }

  buildLaunchpadAndResumePavilion() {
    // 1. Launchpad Spawn Center (X: 0, Z: 0)
    const padGeo = new THREE.CylinderGeometry(10, 10, 0.2, 32);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(0, 0.1, 0);
    pad.receiveShadow = true;
    this.scene.add(pad);

    const ringGeo = new THREE.RingGeometry(8.5, 9.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.22, 0);
    this.scene.add(ring);

    // Gantry Archway with Name & Title
    const gantryMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
    const pillarGeo = new THREE.BoxGeometry(1.2, 7, 1.2);
    const pL = new THREE.Mesh(pillarGeo, gantryMat);
    pL.position.set(-6, 3.5, 7);
    const pR = new THREE.Mesh(pillarGeo, gantryMat);
    pR.position.set(6, 3.5, 7);
    this.scene.add(pL, pR);

    const headerGeo = new THREE.BoxGeometry(15, 2.2, 0.6);
    const nameTex = this.createTextTexture('JESWIN B', '#0a0f1d', '#00f0ff', 40);
    const headerMesh = new THREE.Mesh(headerGeo, new THREE.MeshStandardMaterial({ map: nameTex }));
    headerMesh.position.set(0, 6.5, 7);
    this.scene.add(headerMesh);

    const subSignGeo = new THREE.BoxGeometry(14, 1.0, 0.4);
    const subTex = this.createTextTexture('B.TECH CSE (MITS) // FULL STACK & AI', '#07090e', '#ffffff', 22);
    const subMesh = new THREE.Mesh(subSignGeo, new THREE.MeshStandardMaterial({ map: subTex }));
    subMesh.position.set(0, 4.9, 7);
    this.scene.add(subMesh);

    // 2. Interactive RESUME PAVILION (X: 0, Z: -16) right next to spawn!
    const resPavilionGeo = new THREE.BoxGeometry(7, 3.8, 1.2);
    const resTex = this.createTextTexture('📄 OFFICIAL RESUME & PDF', '#1e1b4b', '#38bdf8', 26);
    const resPavilion = new THREE.Mesh(resPavilionGeo, new THREE.MeshStandardMaterial({ map: resTex }));
    resPavilion.position.set(0, 2.0, -18);
    resPavilion.castShadow = true;
    this.scene.add(resPavilion);

    // Floating Golden Document Icon above Resume Pavilion
    const docIconGeo = new THREE.BoxGeometry(1.6, 2.2, 0.2);
    const docIconMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      emissive: 0xffb703,
      emissiveIntensity: 0.5,
      metalness: 0.8,
    });
    const docIcon = new THREE.Mesh(docIconGeo, docIconMat);
    docIcon.position.set(0, 5.0, -18);
    this.scene.add(docIcon);
    this.rotatingProps.push({ mesh: docIcon, speedY: 1.2 });

    this.physics.addStaticCollider({
      minX: -4.0,
      maxX: 4.0,
      minZ: -19.0,
      maxZ: -17.0,
    });

    // Proximity Trigger to view/download Resume
    this.physics.addTrigger({
      id: 'resume-pavilion',
      name: 'RESUME PAVILION',
      sub: 'CREDENTIALS & PDF DOWNLOAD',
      x: 0,
      z: -18,
      radius: 6.5,
      onEnter: (t) => {
        window.onZoneEntered(t);
        window.showInteractPrompt('Open Full Resume & Download PDF', () => {
          window.openResumeModal();
        });
      },
      onExit: () => window.hideInteractPrompt(),
    });

    // Speed booster exiting launchpad toward North
    this.createSpeedBooster(0, 14, 0);

    // Launchpad Trigger
    this.physics.addTrigger({
      id: 'launchpad',
      name: 'COMMAND LAUNCHPAD',
      sub: 'STARTING GRID',
      x: 0,
      z: 0,
      radius: 12,
      onEnter: (t) => window.onZoneEntered(t),
    });
  }

  createSpeedBooster(x, z, rotationY = 0) {
    const boosterGeo = new THREE.PlaneGeometry(5, 7);
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 128;
    bCanvas.height = 256;
    const bctx = bCanvas.getContext('2d');
    bctx.fillStyle = '#ff007f';
    bctx.fillRect(0, 0, 128, 256);
    bctx.fillStyle = '#ffffff';
    bctx.beginPath();
    for (let y = 30; y < 240; y += 70) {
      bctx.moveTo(64, y);
      bctx.lineTo(110, y + 40);
      bctx.lineTo(85, y + 40);
      bctx.lineTo(64, y + 20);
      bctx.lineTo(43, y + 40);
      bctx.lineTo(18, y + 40);
      bctx.closePath();
    }
    bctx.fill();

    const bTex = new THREE.CanvasTexture(bCanvas);
    const bMat = new THREE.MeshBasicMaterial({ map: bTex, transparent: true, opacity: 0.85 });
    const booster = new THREE.Mesh(boosterGeo, bMat);
    booster.rotation.x = -Math.PI / 2;
    booster.rotation.z = -rotationY;
    booster.position.set(x, 0.05, z);
    this.scene.add(booster);

    this.physics.addTrigger({
      id: `booster_${x}_${z}`,
      name: 'SPEED BOOST',
      x: x,
      z: z,
      radius: 3.5,
      onEnter: (_, car) => {
        car.speed = Math.max(car.speed, 22.0) * 1.55;
        car.isBoosted = true;
        car.boostTimer = 1.8;
        if (window.soundEngine) window.soundEngine.playBoost();
      },
    });
  }

  buildProjectsDistrict() {
    // Real Projects from github.com/JB1071017
    const projects = [
      {
        id: 'proj-smartboard',
        name: 'SmartBoard Touch System',
        category: 'COMPUTER VISION & HARDWARE',
        repo: 'miniproject',
        githubUrl: 'https://github.com/JB1071017/miniproject',
        x: -40,
        z: 35,
        color: 0x00f0ff,
        title: 'Touch-based Camera Projection System',
        desc: 'Converts any flat wall or table surface into a virtual interactive touchscreen using computer vision. Tracks LED/IR light pen positions via perspective homography calibration and translates optical coords into real-time OS mouse events.',
        stats: [
          { val: 'OpenCV', desc: 'Computer Vision' },
          { val: 'Homography', desc: 'Perspective Calib' },
          { val: 'Low-Cost', desc: 'Zero HW Overhead' },
          { val: 'Real-Time', desc: 'Sub-15ms Latency' },
        ],
        tech: ['Python', 'OpenCV', 'Homography', 'Computer Vision', 'PyAutoGUI'],
        code: `// Homography Matrix Perspective Calibration
H, status = cv2.findHomography(source_pts, screen_pts)
calibrated_touch = cv2.perspectiveTransform(detected_led, H)
pyautogui.moveTo(calibrated_touch.x, calibrated_touch.y)`,
      },
      {
        id: 'proj-cuads',
        name: 'CUADS ASCII Streamer',
        category: 'TERMINAL & VIDEO STREAMING',
        repo: 'cuads',
        githubUrl: 'https://github.com/JB1071017/cuads',
        x: -40,
        z: 65,
        color: 0x00f59b,
        title: 'Terminal Animated ASCII Video Streaming',
        desc: 'Upload videos and stream them directly into any standard developer terminal as high-speed animated ASCII art using a simple one-line curl command. Real-time frame downscaling and ANSI color sequence rendering.',
        stats: [
          { val: 'cURL Direct', desc: 'Zero Client Setup' },
          { val: 'ANSI RGB', desc: '24-bit TrueColor' },
          { val: '60 FPS', desc: 'Terminal Stream' },
          { val: 'FastAPI', desc: 'Chunked Transfer' },
        ],
        tech: ['Python', 'FastAPI', 'FFmpeg', 'Pillow', 'ANSI Escape Codes'],
        code: `// Stream Live Video to Terminal via cURL
curl -sN https://cuads.domain/stream/demo | while read frame; do
  clear; echo -e "$frame"; sleep 0.03;
done`,
      },
      {
        id: 'proj-desplit',
        name: 'DeSplit-Core Coordinator',
        category: 'DISTRIBUTED SYSTEMS & P2P',
        repo: 'Final_Year',
        githubUrl: 'https://github.com/JB1071017',
        x: -70,
        z: 35,
        color: 0xff007f,
        title: 'Native Windows P2P Training Coordinator',
        desc: 'Asynchronous peer-to-peer distributed machine learning training coordinator and 3D telemetry engine natively on Windows. Dynamically mitigates straggler latency penalties using preemptive work-stealing and INT8 stochastic gossip consensus.',
        stats: [
          { val: '100% Native', desc: 'No Docker/WSL2' },
          { val: '4.0x', desc: 'INT8 Compression' },
          { val: '<50ms', desc: 'Silicon Benchmark' },
          { val: 'Zero Stall', desc: 'Work-Stealing' },
        ],
        tech: ['Python 3.10+', 'PyTorch', 'FastAPI', 'WebSockets', 'psutil', 'Three.js'],
        code: `// Preemptive Work-Stealing Reallocation
if (progressRate < 0.40 * clusterMedianRate) {
  stolenBatches = Math.ceil(0.5 * uncomputedBatches);
  reassignToFastestIdlePeer(stolenBatches);
  sendCancellationRPC(stragglerNode);
}`,
      },
      {
        id: 'proj-circuit-ai',
        name: 'AI Circuit Assistant',
        category: 'INTELLIGENT APPLICATION & AI',
        repo: 'ai-circuit',
        githubUrl: 'https://github.com/JB1071017',
        x: -70,
        z: 65,
        color: 0xa855f7,
        title: 'Gemini LLM-Powered Circuit Design Assistant',
        desc: 'Intelligent full-stack circuit assistant built with Python, Django, Gemini API, and LLM reasoning. Analyzes schematics, diagnoses wiring faults, suggests component values, and generates automated BOM reports.',
        stats: [
          { val: 'Gemini API', desc: 'Multimodal LLM' },
          { val: 'Django', desc: 'Full Stack App' },
          { val: 'Schematics', desc: 'Auto Diagnosis' },
          { val: 'REST API', desc: 'Microservices' },
        ],
        tech: ['Python', 'Django', 'Google Gemini API', 'REST Framework', 'PostgreSQL'],
        code: `// Gemini Multimodal Circuit Analysis
response = gemini_client.generate_content([
  "Diagnose this circuit diagram and calculate resistor values:",
  uploaded_schematic_image
])`,
      },
      {
        id: 'proj-keepalive',
        name: 'Keep-Alive Uptime Monitor',
        category: 'CLOUD & SERVICE HEALTH',
        repo: 'keep-alive',
        githubUrl: 'https://github.com/JB1071017/keep-alive',
        x: -100,
        z: 35,
        color: 0xfbbf24,
        title: 'Cloud Service Uptime & Ping Sentinel',
        desc: 'Lightweight web sentinel preventing free-tier cloud instances (Vercel, Render, Railway) from spinning down into cold sleep by running scheduled heartbeat pings and latency telemetry dashboards.',
        stats: [
          { val: 'Uptime Ping', desc: 'Zero Cold Boot' },
          { val: 'Vercel App', desc: 'Live Deployed' },
          { val: 'Cron Sync', desc: 'Automated Pings' },
          { val: 'Analytics', desc: 'Latency Tracking' },
        ],
        tech: ['Next.js', 'Node.js', 'Cron Tasks', 'HTTP Health Pings', 'Vercel'],
        code: `// Automated Cold-Boot Keep-Alive Ping
setInterval(async () => {
  await fetch('https://api.service.com/health');
  logHeartbeat(Date.now(), 'ALIVE');
}, 14 * 60 * 1000);`,
      },
      {
        id: 'proj-qlearning',
        name: 'Q-Learning & Param-Golf',
        category: 'REINFORCEMENT LEARNING & LM',
        repo: 'Q-Learning',
        githubUrl: 'https://github.com/JB1071017/Q-Learning',
        x: -100,
        z: 65,
        color: 0x38bdf8,
        title: 'Model-Free RL & 16MB Compact Language Model',
        desc: 'Implementations of model-free reinforcement learning algorithms (Q-learning, Bellman optimality) and extreme language model compression designed to fit complete neural text generators into tiny 16MB footprints.',
        stats: [
          { val: 'Bellman', desc: 'Value Iteration' },
          { val: '<16 MB', desc: 'Compact LLM Size' },
          { val: 'NumPy', desc: 'Matrix Math' },
          { val: 'PyTorch', desc: 'Custom Training' },
        ],
        tech: ['Python', 'PyTorch', 'Reinforcement Learning', 'Transformer Architecture'],
        code: `// Q-Learning Bellman Update Equation
Q[state, action] += alpha * (reward + gamma * np.max(Q[next_state]) - Q[state, action])`,
      },
    ];

    projects.forEach((proj) => {
      // Pedestal Base
      const pedGeo = new THREE.CylinderGeometry(4.2, 4.6, 0.8, 8);
      const ped = new THREE.Mesh(pedGeo, new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 }));
      ped.position.set(proj.x, 0.4, proj.z);
      ped.castShadow = true;
      ped.receiveShadow = true;
      this.scene.add(ped);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(4.0, 4.4, 8),
        new THREE.MeshBasicMaterial({ color: proj.color, side: THREE.DoubleSide })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(proj.x, 0.82, proj.z);
      this.scene.add(ring);

      // Monolith Display
      const monoTex = this.createTextTexture(proj.name, '#0b0f19', '#ffffff', 28);
      const mono = new THREE.Mesh(
        new THREE.BoxGeometry(3.6, 4.2, 0.8),
        new THREE.MeshStandardMaterial({ map: monoTex, metalness: 0.6 })
      );
      mono.position.set(proj.x, 3.0, proj.z);
      mono.castShadow = true;
      this.scene.add(mono);

      // Floating Hologram
      const holo = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.2, 0),
        new THREE.MeshStandardMaterial({ color: proj.color, wireframe: true, emissive: proj.color, emissiveIntensity: 0.8 })
      );
      holo.position.set(proj.x, 6.2, proj.z);
      this.scene.add(holo);
      this.rotatingProps.push({ mesh: holo, speedY: 1.2, speedX: 0.6 });

      this.physics.addStaticCollider({
        minX: proj.x - 3.2,
        maxX: proj.x + 3.2,
        minZ: proj.z - 3.2,
        maxZ: proj.z + 3.2,
      });

      this.physics.addTrigger({
        id: proj.id,
        name: proj.name,
        sub: proj.category,
        x: proj.x,
        z: proj.z,
        radius: 6.8,
        onEnter: (t) => {
          window.onZoneEntered(t);
          window.showInteractPrompt(`Inspect ${proj.name}`, () => {
            window.openProjectModal(proj);
          });
        },
        onExit: () => window.hideInteractPrompt(),
      });
    });

    this.physics.addTrigger({
      id: 'projects-district',
      name: 'GITHUB PROJECTS DISTRICT',
      sub: 'OPEN SOURCE // GITHUB.COM/JB1071017',
      x: -70,
      z: 50,
      radius: 38,
      onEnter: (t) => window.onZoneEntered(t),
    });
  }

  buildInternshipDistrict() {
    // NaicoITS Cyber Security Internship Pavilion (X: -45, Z: -45)
    const platGeo = new THREE.CylinderGeometry(10, 11, 0.8, 16);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.set(-45, 0.4, -45);
    this.scene.add(platform);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(9.4, 10.0, 16),
      new THREE.MeshBasicMaterial({ color: 0x00f59b, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(-45, 0.82, -45);
    this.scene.add(ring);

    // Office Monument
    const bldgTex = this.createTextTexture('NAICOITS // CYBER SECURITY', '#061a14', '#00f59b', 28);
    const bldg = new THREE.Mesh(
      new THREE.BoxGeometry(6.5, 4.5, 2.0),
      new THREE.MeshStandardMaterial({ map: bldgTex, metalness: 0.7 })
    );
    bldg.position.set(-45, 3.0, -45);
    bldg.castShadow = true;
    this.scene.add(bldg);

    // Shield Sculpture on top
    const shieldGeo = new THREE.ConeGeometry(1.6, 2.4, 4);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x00f59b,
      emissive: 0x00f59b,
      emissiveIntensity: 0.6,
      wireframe: true,
    });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.rotation.z = Math.PI;
    shield.position.set(-45, 6.8, -45);
    this.scene.add(shield);
    this.rotatingProps.push({ mesh: shield, speedY: 1.5 });

    this.physics.addStaticCollider({
      minX: -49.0,
      maxX: -41.0,
      minZ: -47.0,
      maxZ: -43.0,
    });

    this.physics.addTrigger({
      id: 'internship-pavilion',
      name: 'EXPERIENCE & INTERNSHIP',
      sub: 'NAICOITS // INFOPARK KOCHI',
      x: -45,
      z: -45,
      radius: 8.5,
      onEnter: (t) => {
        window.onZoneEntered(t);
        window.showInteractPrompt('View Cyber Security Internship', () => {
          window.openExperienceModal();
        });
      },
      onExit: () => window.hideInteractPrompt(),
    });
  }

  buildEducationDistrict() {
    // Muthoot Institute of Technology and Science (MITS) (X: -80, Z: -45)
    const platGeo = new THREE.CylinderGeometry(10, 11, 0.8, 16);
    const platform = new THREE.Mesh(platGeo, new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 }));
    platform.position.set(-80, 0.4, -45);
    this.scene.add(platform);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(9.4, 10.0, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(-80, 0.82, -45);
    this.scene.add(ring);

    // University Monument
    const mitsTex = this.createTextTexture('MITS // B.TECH CSE (2023-2027)', '#0c1a2e', '#38bdf8', 26);
    const bldg = new THREE.Mesh(
      new THREE.BoxGeometry(7.0, 4.5, 2.0),
      new THREE.MeshStandardMaterial({ map: mitsTex, metalness: 0.7 })
    );
    bldg.position.set(-80, 3.0, -45);
    bldg.castShadow = true;
    this.scene.add(bldg);

    // Graduation Cap 3D Model
    const capBaseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.8, 12);
    const capBase = new THREE.Mesh(capBaseGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    const capTopGeo = new THREE.BoxGeometry(3.0, 0.15, 3.0);
    const capTop = new THREE.Mesh(capTopGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    capTop.rotation.y = Math.PI / 4;
    capTop.position.y = 0.5;
    const gradCap = new THREE.Group();
    gradCap.add(capBase);
    gradCap.add(capTop);
    gradCap.position.set(-80, 6.2, -45);
    this.scene.add(gradCap);
    this.rotatingProps.push({ mesh: gradCap, speedY: 0.8 });

    this.physics.addStaticCollider({
      minX: -84.0,
      maxX: -76.0,
      minZ: -47.0,
      maxZ: -43.0,
    });

    this.physics.addTrigger({
      id: 'education-pavilion',
      name: 'EDUCATION & ACADEMICS',
      sub: 'MITS // CGPA 7.88',
      x: -80,
      z: -45,
      radius: 8.5,
      onEnter: (t) => {
        window.onZoneEntered(t);
        window.showInteractPrompt('View Academic Credentials', () => {
          window.openEducationModal();
        });
      },
      onExit: () => window.hideInteractPrompt(),
    });
  }

  buildAchievementsDistrict() {
    // ICPC Winner Trophy Monument (X: -45, Z: -80)
    const baseGeo = new THREE.CylinderGeometry(5, 5.5, 1.2, 16);
    const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 }));
    base.position.set(-45, 0.6, -80);
    this.scene.add(base);

    // Giant 3D Trophy Cup
    const trophyGeo = new THREE.CylinderGeometry(2.0, 0.8, 3.5, 16);
    const trophyMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xffb703,
      emissiveIntensity: 0.35,
    });
    const trophyCup = new THREE.Mesh(trophyGeo, trophyMat);
    trophyCup.position.set(-45, 3.2, -80);
    trophyCup.castShadow = true;
    this.scene.add(trophyCup);

    // Signboard
    const signTex = this.createTextTexture('ICPC WINNER 2026', '#1e1b4b', '#ffb703', 32);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 1.4, 0.4),
      new THREE.MeshStandardMaterial({ map: signTex })
    );
    sign.position.set(-45, 5.8, -80);
    this.scene.add(sign);
    this.rotatingProps.push({ mesh: trophyCup, speedY: 1.0 });

    this.physics.addStaticCollider({
      minX: -49.0,
      maxX: -41.0,
      minZ: -84.0,
      maxZ: -76.0,
    });

    this.physics.addTrigger({
      id: 'icpc-trophy',
      name: 'ICPC PROGRAMMING WINNER',
      sub: 'COLLEGE PROGRAMMING CHAMPION',
      x: -45,
      z: -80,
      radius: 8.0,
      onEnter: (t) => {
        window.onZoneEntered(t);
        window.showInteractPrompt('Inspect ICPC Winner Details', () => {
          window.openAchievementsModal();
        });
      },
      onExit: () => window.hideInteractPrompt(),
    });
  }

  buildSkillsArena() {
    // Skills Demolition Arena (X: 45, Z: 45)
    const arenaFloor = new THREE.Mesh(
      new THREE.BoxGeometry(34, 0.2, 34),
      new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.7 })
    );
    arenaFloor.position.set(50, 0.05, 50);
    arenaFloor.receiveShadow = true;
    this.scene.add(arenaFloor);

    // Title Billboard
    const signTex = this.createTextTexture('SKILLS DEMOLITION ARENA', '#0f172a', '#ffb703', 28);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2.2, 0.6),
      new THREE.MeshStandardMaterial({ map: signTex })
    );
    sign.position.set(50, 4.5, 33.5);
    this.scene.add(sign);

    // All skills from resume
    const skills = [
      { name: 'Python', color: '#3b82f6' },
      { name: 'Django', color: '#092e20' },
      { name: 'Java', color: '#e76f51' },
      { name: 'C / C++', color: '#00599c' },
      { name: 'JavaScript', color: '#f7df1e' },
      { name: 'FastAPI', color: '#009688' },
      { name: 'OpenCV', color: '#5c3d2e' },
      { name: 'Firebase', color: '#ffca28' },
      { name: 'REST APIs', color: '#38bdf8' },
      { name: 'Android', color: '#3ddc84' },
      { name: 'PyTorch', color: '#ee4c2c' },
      { name: 'Three.js', color: '#00f0ff' },
      { name: 'P2P Net', color: '#a855f7' },
      { name: 'DSA / OOP', color: '#ec4899' },
      { name: 'ROS/Linux', color: '#22314e' },
      { name: 'Git/DevOps', color: '#f97316' },
    ];

    const blockSize = { w: 2.0, h: 1.6, d: 2.0 };
    const boxGeo = new THREE.BoxGeometry(blockSize.w, blockSize.h, blockSize.d);

    let idx = 0;
    const startX = 46;
    const startZ = 52;

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const skill = skills[idx % skills.length];
        idx++;

        const tex = this.createTextTexture(skill.name, '#182030', skill.color, 36);
        const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.3, metalness: 0.5 });
        const mesh = new THREE.Mesh(boxGeo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const posX = startX + col * 2.6 - (row * 0.4);
        const posY = 0.8 + row * 1.65;
        const posZ = startZ + row * 2.2;

        mesh.position.set(posX, posY, posZ);
        this.scene.add(mesh);

        this.physics.addDynamicBlock(
          mesh,
          { x: posX, y: posY, z: posZ },
          { x: 0, y: 0, z: 0 },
          blockSize,
          'block'
        );
      }
    }

    // Floor Reset Button for Rebuilding Blocks
    const btnBase = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.8, 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    btnBase.position.set(50, 0.15, 39);
    this.scene.add(btnBase);

    const btnTex = this.createTextTexture('RAM TO REBUILD ALL', '#ff0055', '#ffffff', 26);
    this.resetBtnMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(3.0, 3.0, 0.35, 16),
      new THREE.MeshStandardMaterial({ map: btnTex, roughness: 0.3 })
    );
    this.resetBtnMesh.position.set(50, 0.35, 39);
    this.scene.add(this.resetBtnMesh);

    this.physics.addTrigger({
      id: 'reset-skills',
      name: 'ARENA REBUILDER',
      sub: 'RESTORES SKILLS, BOWLING & BRICKS',
      x: 50,
      z: 39,
      radius: 3.5,
      onEnter: () => {
        this.physics.resetAllBlocks();
        window.showToast('✨ ALL BLOCKS, PINS & BRICKS RECONSTRUCTED!');
      },
    });

    this.physics.addTrigger({
      id: 'skills-arena',
      name: 'SKILLS DEMOLITION ARENA',
      sub: 'RAM TO TEST PHYSICS',
      x: 50,
      z: 50,
      radius: 20,
      onEnter: (t) => window.onZoneEntered(t),
    });
  }

  buildBowlingAlley() {
    // 10-Pin Bowling Alley (X: 85, Z: 50)
    const laneGeo = new THREE.BoxGeometry(12, 0.2, 28);
    const laneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.1 });
    const lane = new THREE.Mesh(laneGeo, laneMat);
    lane.position.set(85, 0.08, 50);
    lane.receiveShadow = true;
    this.scene.add(lane);

    // Title Billboard
    const signTex = this.createTextTexture('🎳 10-PIN BOWLING ALLEY', '#1e293b', '#ffb703', 28);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1.8, 0.5),
      new THREE.MeshStandardMaterial({ map: signTex })
    );
    sign.position.set(85, 4.0, 37);
    this.scene.add(sign);

    // 10 Bowling Pins in Triangular Formation
    const pinGeo = new THREE.CylinderGeometry(0.3, 0.45, 1.8, 10);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const pinRows = [
      [{ x: 85, z: 60 }],
      [{ x: 84.2, z: 61.5 }, { x: 85.8, z: 61.5 }],
      [{ x: 83.4, z: 63 }, { x: 85, z: 63 }, { x: 86.6, z: 63 }],
      [{ x: 82.6, z: 64.5 }, { x: 84.2, z: 64.5 }, { x: 85.8, z: 64.5 }, { x: 87.4, z: 64.5 }],
    ];

    pinRows.forEach((row) => {
      row.forEach((pos) => {
        const pin = new THREE.Mesh(pinGeo, pinMat);
        pin.position.set(pos.x, 0.9, pos.z);
        pin.castShadow = true;
        this.scene.add(pin);

        this.physics.addDynamicBlock(
          pin,
          { x: pos.x, y: 0.9, z: pos.z },
          { x: 0, y: 0, z: 0 },
          { w: 0.9, h: 1.8, d: 0.9 },
          'pin'
        );
      });
    });

    // Heavy Bowling Ball
    const ballGeo = new THREE.SphereGeometry(1.0, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.1,
      metalness: 0.9,
    });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(85, 1.0, 44);
    ball.castShadow = true;
    this.scene.add(ball);

    this.physics.addDynamicBlock(
      ball,
      { x: 85, y: 1.0, z: 44 },
      { x: 0, y: 0, z: 0 },
      { w: 2.0, h: 2.0, d: 2.0 },
      'ball'
    );

    this.physics.addTrigger({
      id: 'bowling-alley',
      name: '10-PIN BOWLING ALLEY',
      sub: 'HIT THE BALL FOR A STRIKE!',
      x: 85,
      z: 50,
      radius: 16,
      onEnter: (t) => window.onZoneEntered(t),
    });
  }

  buildDestructibleBrickWall() {
    // Destructible Brick Wall (X: 50, Z: 18)
    const brickSize = { w: 1.8, h: 0.9, d: 0.8 };
    const brickGeo = new THREE.BoxGeometry(brickSize.w, brickSize.h, brickSize.d);
    const brickMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.8 });

    const wallTex = this.createTextTexture('⚠️ DANGER: DEMOLITION WALL', '#0a0a0a', '#ef4444', 24);
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(10, 1.4, 0.3),
      new THREE.MeshStandardMaterial({ map: wallTex })
    );
    sign.position.set(50, 4.5, 18);
    this.scene.add(sign);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        const brick = new THREE.Mesh(brickGeo, brickMat);
        const posX = 45 + c * 2.0 + (r % 2 ? 0.9 : 0);
        const posY = 0.45 + r * 0.95;
        const posZ = 18;

        brick.position.set(posX, posY, posZ);
        brick.castShadow = true;
        this.scene.add(brick);

        this.physics.addDynamicBlock(
          brick,
          { x: posX, y: posY, z: posZ },
          { x: 0, y: 0, z: 0 },
          brickSize,
          'brick'
        );
      }
    }
  }

  buildStuntParkAndTrampoline() {
    // Stunt Jump Ramps (X: 50, Z: -45)
    const rampWidth = 9;
    const rampLength = 16;
    const rampHeight = 5.0;

    const rampShape = new THREE.Shape();
    rampShape.moveTo(0, 0);
    rampShape.lineTo(rampLength, 0);
    rampShape.lineTo(rampLength, rampHeight);
    rampShape.closePath();

    const extrudeSettings = { steps: 1, depth: rampWidth, bevelEnabled: false };
    const rampGeo = new THREE.ExtrudeGeometry(rampShape, extrudeSettings);
    const rampTex = this.createTextTexture('MEGA JUMP >>>', '#111827', '#ff007f', 32);
    const rampMesh = new THREE.Mesh(rampGeo, new THREE.MeshStandardMaterial({ map: rampTex, metalness: 0.5 }));

    rampMesh.rotation.y = -Math.PI / 2;
    rampMesh.position.set(54.5, 0, -32);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    this.scene.add(rampMesh);

    this.physics.addRamp({
      minX: 45.5,
      maxX: 54.5,
      minZ: -48,
      maxZ: -32,
      startY: 0,
      endY: rampHeight,
      axis: 'z',
    });

    this.createSpeedBooster(50, -24, Math.PI);

    // Glowing Aerial Stunt Ring
    const ringGeo = new THREE.TorusGeometry(4.0, 0.4, 12, 24);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    ring.position.set(50, 6.5, -58);
    this.scene.add(ring);
    this.rotatingProps.push({ mesh: ring, speedY: 0.8, speedZ: 0.4 });

    // Super Spring Trampoline Launchpad (X: 85, Z: -45)
    const trampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(5.0, 5.5, 0.5, 20),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    trampBase.position.set(85, 0.25, -45);
    this.scene.add(trampBase);

    const trampPadTex = this.createTextTexture('SPRING LAUNCHER', '#000000', '#00f59b', 26);
    const trampPad = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.5, 0.3, 20),
      new THREE.MeshStandardMaterial({ map: trampPadTex })
    );
    trampPad.position.set(85, 0.55, -45);
    this.scene.add(trampPad);

    this.physics.addTrampoline({
      x: 85,
      z: -45,
      radius: 4.5,
      power: 28.0,
    });

    this.physics.addTrigger({
      id: 'stunt-park',
      name: 'STUNT & TRAMPOLINE PARK',
      sub: 'MAX AIRTIME // 15M JUMPS',
      x: 65,
      z: -45,
      radius: 25,
      onEnter: (t) => window.onZoneEntered(t),
    });
  }

  buildContactTower() {
    // Contact Relay Tower (X: 0, Z: -75)
    const baseGeo = new THREE.CylinderGeometry(5, 5.5, 1.0, 16);
    const base = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8 }));
    base.position.set(0, 0.5, -75);
    this.scene.add(base);

    const towerGeo = new THREE.CylinderGeometry(0.5, 2.0, 18, 6);
    const tower = new THREE.Mesh(towerGeo, new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, wireframe: true }));
    tower.position.set(0, 9.5, -75);
    tower.castShadow = true;
    this.scene.add(tower);

    const dishGeo = new THREE.CylinderGeometry(2.4, 0.4, 0.5, 16);
    const dish = new THREE.Mesh(dishGeo, new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.8 }));
    dish.position.set(0, 18.5, -75);
    dish.rotation.x = Math.PI * 0.25;
    this.scene.add(dish);
    this.rotatingProps.push({ mesh: dish, speedY: 1.5 });

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
    beacon.position.set(0, 19.2, -75);
    this.scene.add(beacon);

    const conTex = this.createTextTexture('DISPATCH INBOX', '#050810', '#00f59b', 32);
    const consoleMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.0, 1.2),
      new THREE.MeshStandardMaterial({ map: conTex })
    );
    consoleMesh.position.set(0, 1.8, -71);
    consoleMesh.castShadow = true;
    this.scene.add(consoleMesh);

    this.physics.addStaticCollider({
      minX: -4.0,
      maxX: 4.0,
      minZ: -78.0,
      maxZ: -71.0,
    });

    this.physics.addTrigger({
      id: 'contact-station',
      name: 'TRANSMISSION TOWER',
      sub: 'DISPATCH & COLLABORATE',
      x: 0,
      z: -71,
      radius: 7.0,
      onEnter: (t) => {
        window.onZoneEntered(t);
        window.showInteractPrompt('Open Contact Terminal', () => {
          window.openContactModal();
        });
      },
      onExit: () => window.hideInteractPrompt(),
    });
  }

  spawnCollectibleGems() {
    // 25 Collectible Golden Stars & Crystals across all map regions
    const coords = [
      { x: 0, y: 1.2, z: 25 },
      { x: -18, y: 1.2, z: 35 },
      { x: -40, y: 1.2, z: 35 },
      { x: -40, y: 1.2, z: 65 },
      { x: -70, y: 1.2, z: 35 },
      { x: -70, y: 1.2, z: 65 },
      { x: -100, y: 1.2, z: 35 },
      { x: -100, y: 1.2, z: 65 },
      { x: -45, y: 1.2, z: -45 },
      { x: -80, y: 1.2, z: -45 },
      { x: -45, y: 1.2, z: -80 },
      { x: 0, y: 1.2, z: -35 },
      { x: 0, y: 1.2, z: -55 },
      { x: 0, y: 1.2, z: -71 },
      { x: 25, y: 1.2, z: 0 },
      { x: 50, y: 1.2, z: 25 },
      { x: 50, y: 1.2, z: 45 },
      { x: 85, y: 1.2, z: 40 },
      { x: 85, y: 1.2, z: 62 },
      { x: 25, y: 1.2, z: -45 },
      { x: 50, y: 5.2, z: -45 }, // Ramp jump midair!
      { x: 50, y: 6.8, z: -58 }, // Ring midair!
      { x: 85, y: 8.5, z: -45 }, // Trampoline super high!
      { x: 70, y: 1.2, z: -25 },
      { x: -25, y: 1.2, z: 0 },
    ];

    const gemGeo = new THREE.OctahedronGeometry(0.7, 0);
    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.7,
      roughness: 0.1,
      metalness: 0.9,
    });

    coords.forEach((coord, i) => {
      const mesh = new THREE.Mesh(gemGeo, gemMat.clone());
      mesh.position.set(coord.x, coord.y, coord.z);
      mesh.castShadow = true;
      this.scene.add(mesh);

      this.gems.push({
        id: `gem_${i}`,
        mesh: mesh,
        x: coord.x,
        y: coord.y,
        z: coord.z,
        collected: false,
      });

      this.rotatingProps.push({ mesh: mesh, speedY: 2.2, speedX: 1.1 });
    });
  }

  buildDenseScenery() {
    // 1. Street Lampposts
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lampGeo = new THREE.CylinderGeometry(0.12, 0.18, 5.0, 6);

    const lampPositions = [
      { x: -5, z: -20 }, { x: 5, z: -20 },
      { x: -5, z: 20 }, { x: 5, z: 20 },
      { x: -5, z: 50 }, { x: 5, z: 50 },
      { x: -5, z: 80 }, { x: 5, z: 80 },
      { x: -5, z: -50 }, { x: 5, z: -50 },
      { x: -30, z: -5 }, { x: -30, z: 5 },
      { x: -60, z: -5 }, { x: -60, z: 5 },
      { x: 30, z: -5 }, { x: 30, z: 5 },
      { x: 60, z: -5 }, { x: 60, z: 5 },
      { x: 45, z: 25 }, { x: 75, z: 25 },
      { x: 45, z: -25 }, { x: 75, z: -25 },
    ];

    lampPositions.forEach((lp) => {
      const pole = new THREE.Mesh(lampGeo, lampMat);
      pole.position.set(lp.x, 2.5, lp.z);
      pole.castShadow = true;

      const lightHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.8), lampGlowMat);
      lightHead.position.set(lp.x, 5.1, lp.z);

      const lampLight = new THREE.PointLight(0xfef08a, 1.2, 14);
      lampLight.position.set(lp.x, 5.0, lp.z);

      this.scene.add(pole, lightHead, lampLight);

      this.physics.addStaticCollider({
        minX: lp.x - 0.4,
        maxX: lp.x + 0.4,
        minZ: lp.z - 0.4,
        maxZ: lp.z + 0.4,
      });
    });

    // 2. Traffic Cones
    const coneGeo = new THREE.ConeGeometry(0.35, 0.9, 8);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.3 });
    const conePositions = [
      { x: 42, z: 24 }, { x: 43.5, z: 24 }, { x: 45, z: 24 },
      { x: 42, z: -20 }, { x: 43.5, z: -20 }, { x: 45, z: -20 },
      { x: -5, z: 12 }, { x: 5, z: 12 },
    ];
    conePositions.forEach((cp) => {
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.set(cp.x, 0.45, cp.z);
      cone.castShadow = true;
      this.scene.add(cone);
    });

    // 3. Dense 150+ Low-Poly Trees in multiple styles
    const pineGeo = new THREE.ConeGeometry(2.0, 5.0, 5);
    const pineMat = new THREE.MeshStandardMaterial({ color: 0x064e3b, roughness: 0.6 });
    const birchGeo = new THREE.DodecahedronGeometry(2.2, 0);
    const birchMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    const autumnMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 });
    const cyberMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 2.5, 5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });

    for (let i = 0; i < 150; i++) {
      const x = (Math.random() - 0.5) * 260;
      const z = (Math.random() - 0.5) * 260;

      // Avoid placing trees directly in the middle of roads & pads
      if (Math.abs(x) < 8 || Math.abs(z) < 8) continue;
      if (Math.abs(x - 50) < 18 && Math.abs(z - 50) < 18) continue;
      if (Math.abs(x + 70) < 35 && Math.abs(z - 50) < 25) continue;

      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 1.25;
      trunk.castShadow = true;
      tree.add(trunk);

      const type = i % 4;
      let foliage;
      if (type === 0) {
        foliage = new THREE.Mesh(pineGeo, pineMat);
        foliage.position.y = 4.2;
      } else if (type === 1) {
        foliage = new THREE.Mesh(birchGeo, birchMat);
        foliage.position.y = 3.8;
      } else if (type === 2) {
        foliage = new THREE.Mesh(pineGeo, autumnMat);
        foliage.position.y = 4.2;
      } else {
        foliage = new THREE.Mesh(birchGeo, cyberMat);
        foliage.position.y = 3.8;
      }
      foliage.castShadow = true;
      tree.add(foliage);

      const scale = 0.7 + Math.random() * 0.7;
      tree.scale.set(scale, scale, scale);
      tree.position.set(x, 0, z);
      this.scene.add(tree);

      this.physics.addStaticCollider({
        minX: x - 0.8,
        maxX: x + 0.8,
        minZ: z - 0.8,
        maxZ: z + 0.8,
      });
    }

    // 4. 80+ Boulders and Low-Poly Rocks
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    for (let i = 0; i < 80; i++) {
      const x = (Math.random() - 0.5) * 260;
      const z = (Math.random() - 0.5) * 260;
      if (Math.abs(x) < 8 || Math.abs(z) < 8) continue;

      const rock = new THREE.Mesh(rockGeo, rockMat);
      const rscale = 0.5 + Math.random() * 1.5;
      rock.scale.set(rscale * (0.8 + Math.random() * 0.4), rscale * (0.6 + Math.random() * 0.4), rscale);
      rock.position.set(x, rscale * 0.4, z);
      rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rock.castShadow = true;
      this.scene.add(rock);

      this.physics.addStaticCollider({
        minX: x - rscale * 0.8,
        maxX: x + rscale * 0.8,
        minZ: z - rscale * 0.8,
        maxZ: z + rscale * 0.8,
      });
    }
  }

  update(dt, car) {
    for (const prop of this.rotatingProps) {
      if (prop.speedY) prop.mesh.rotation.y += dt * prop.speedY;
      if (prop.speedX) prop.mesh.rotation.x += dt * prop.speedX;
      if (prop.speedZ) prop.mesh.rotation.z += dt * prop.speedZ;
    }

    for (const gem of this.gems) {
      if (gem.collected) continue;
      const dx = gem.x - car.pos.x;
      const dy = gem.y - car.pos.y;
      const dz = gem.z - car.pos.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 2.2) {
        gem.collected = true;
        gem.mesh.visible = false;
        this.collectedGemsCount++;

        if (window.soundEngine) window.soundEngine.playGemChime();
        window.updateGemHUD(this.collectedGemsCount, this.totalGemsCount);

        if (this.collectedGemsCount === this.totalGemsCount) {
          window.triggerVictoryCelebration();
        }
      }
    }
  }
}

window.WorldBuilder = WorldBuilder;
