/**
 * 3D Toy Vehicle Model & Visual Effects for Jeswin's Portfolio
 * Procedurally assembled low-poly cyber-buggy with spinning/pivoting wheels,
 * spotlight headlights, underglow neon, exhaust particle emitters, and skidmark ribbons.
 */

class Vehicle {
  constructor(scene) {
    this.scene = scene;

    // Physics & State Parameters
    this.pos = { x: 0, y: 0.1, z: 0 };
    this.heading = 0; // Yaw angle (radians)
    this.speed = 0;
    this.steering = 0;
    this.vy = 0; // vertical velocity
    this.chassisPitch = 0;
    this.chassisRoll = 0;
    this.lateralSlip = 0;

    // Vehicle Tuning
    this.maxSpeed = 24.0;
    this.maxReverseSpeed = 10.0;
    this.acceleration = 28.0;
    this.reverseAccel = 16.0;
    this.brakeDecel = 38.0;
    this.friction = 12.0;
    this.driftFriction = 6.0;
    this.maxSteering = 0.55;

    // Nitro / Boost state
    this.isBoosted = false;
    this.boostTimer = 0;

    // Three.js Object Groups
    this.rootGroup = new THREE.Group();
    this.chassisGroup = new THREE.Group();
    this.rootGroup.add(this.chassisGroup);

    // Wheel References
    this.wheels = [];
    this.frontWheelSteerGroups = [];

    // Lights
    this.headlights = [];
    this.taillights = [];
    this.underglow = null;

    // Skidmarks system
    this.skidmarks = [];
    this.lastSkidPos = null;

    // Particle system for exhaust & tire smoke
    this.particles = [];
    this.particlePool = [];

    this.buildCarModel();
    this.setupSkidmarkSystem();
    this.setupParticleSystem();

    this.scene.add(this.rootGroup);
  }

  buildCarModel() {
    // Materials
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9, // High-tech electric cyan / blue
      roughness: 0.25,
      metalness: 0.8,
    });

    const bodyDarkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, // Slate obsidian
      roughness: 0.4,
      metalness: 0.6,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.75,
    });

    const wheelRubberMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
      metalness: 0.1,
    });

    const wheelRimMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.9,
    });

    const neonGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });

    const brakeRedGlowMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
    });

    // 1. Main Lower Chassis
    const lowerChassisGeo = new THREE.BoxGeometry(1.6, 0.45, 2.8);
    const lowerChassis = new THREE.Mesh(lowerChassisGeo, bodyDarkMat);
    lowerChassis.position.y = 0.55;
    lowerChassis.castShadow = true;
    lowerChassis.receiveShadow = true;
    this.chassisGroup.add(lowerChassis);

    // 2. Upper Body Shell / Cyber Armor
    const upperBodyGeo = new THREE.BoxGeometry(1.45, 0.4, 2.2);
    const upperBody = new THREE.Mesh(upperBodyGeo, bodyMat);
    upperBody.position.set(0, 0.85, -0.15);
    upperBody.castShadow = true;
    this.chassisGroup.add(upperBody);

    // 3. Cabin / Cockpit Windshield (trapezoidal bevel)
    const cabinGeo = new THREE.BoxGeometry(1.2, 0.42, 1.25);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.2, -0.2);
    cabin.castShadow = true;
    this.chassisGroup.add(cabin);

    // 4. Roof Plate & Radar Antenna
    const roofGeo = new THREE.BoxGeometry(1.15, 0.08, 1.15);
    const roof = new THREE.Mesh(roofGeo, bodyDarkMat);
    roof.position.set(0, 1.44, -0.2);
    this.chassisGroup.add(roof);

    // Radar dish on roof
    const radarGeo = new THREE.CylinderGeometry(0.2, 0.05, 0.1, 8);
    this.radarMesh = new THREE.Mesh(radarGeo, neonGlowMat);
    this.radarMesh.position.set(0, 1.54, -0.2);
    this.radarMesh.rotation.x = Math.PI * 0.15;
    this.chassisGroup.add(this.radarMesh);

    // 5. Front Hood Scoop
    const scoopGeo = new THREE.BoxGeometry(0.8, 0.12, 0.6);
    const scoop = new THREE.Mesh(scoopGeo, bodyDarkMat);
    scoop.position.set(0, 1.05, 0.85);
    this.chassisGroup.add(scoop);

    // 6. Rear Cyber Spoiler / Wing
    const spoilerWingGeo = new THREE.BoxGeometry(1.5, 0.08, 0.35);
    const spoilerWing = new THREE.Mesh(spoilerWingGeo, bodyMat);
    spoilerWing.position.set(0, 1.35, -1.35);
    this.chassisGroup.add(spoilerWing);

    const spoilerLegGeo = new THREE.BoxGeometry(0.08, 0.35, 0.12);
    const legL = new THREE.Mesh(spoilerLegGeo, bodyDarkMat);
    legL.position.set(-0.55, 1.15, -1.35);
    const legR = new THREE.Mesh(spoilerLegGeo, bodyDarkMat);
    legR.position.set(0.55, 1.15, -1.35);
    this.chassisGroup.add(legL);
    this.chassisGroup.add(legR);

    // 7. Headlight Blocks & Real Light Cones
    const headLampGeo = new THREE.BoxGeometry(0.25, 0.12, 0.1);
    const lampL = new THREE.Mesh(headLampGeo, neonGlowMat);
    lampL.position.set(-0.55, 0.65, 1.4);
    const lampR = new THREE.Mesh(headLampGeo, neonGlowMat);
    lampR.position.set(0.55, 0.65, 1.4);
    this.chassisGroup.add(lampL);
    this.chassisGroup.add(lampR);

    // Real Spotlight for headlights
    const spotL = new THREE.SpotLight(0x00f0ff, 2.5, 30, Math.PI / 6, 0.3, 1.2);
    spotL.position.set(-0.55, 0.65, 1.4);
    const targetL = new THREE.Object3D();
    targetL.position.set(-0.55, 0, 12);
    this.chassisGroup.add(spotL);
    this.chassisGroup.add(targetL);
    spotL.target = targetL;

    const spotR = new THREE.SpotLight(0x00f0ff, 2.5, 30, Math.PI / 6, 0.3, 1.2);
    spotR.position.set(0.55, 0.65, 1.4);
    const targetR = new THREE.Object3D();
    targetR.position.set(0.55, 0, 12);
    this.chassisGroup.add(spotR);
    this.chassisGroup.add(targetR);
    spotR.target = targetR;

    this.headlights = [spotL, spotR];

    // 8. Taillights (Red)
    const tailLampGeo = new THREE.BoxGeometry(0.35, 0.1, 0.08);
    const tailL = new THREE.Mesh(tailLampGeo, brakeRedGlowMat);
    tailL.position.set(-0.5, 0.68, -1.42);
    const tailR = new THREE.Mesh(tailLampGeo, brakeRedGlowMat);
    tailR.position.set(0.5, 0.68, -1.42);
    this.chassisGroup.add(tailL);
    this.chassisGroup.add(tailR);
    this.taillights = [tailL, tailR];

    // 9. Cyber Underglow (PointLight under chassis)
    this.underglow = new THREE.PointLight(0x00f0ff, 2.2, 5.0);
    this.underglow.position.set(0, 0.25, 0);
    this.chassisGroup.add(this.underglow);

    // 10. Wheels Setup (4 wheels)
    const wheelPositions = [
      { x: -0.92, y: 0.45, z: 0.95, isFront: true },  // Front Left
      { x: 0.92, y: 0.45, z: 0.95, isFront: true },   // Front Right
      { x: -0.92, y: 0.45, z: -0.95, isFront: false }, // Rear Left
      { x: 0.92, y: 0.45, z: -0.95, isFront: false },  // Rear Right
    ];

    const wheelRadius = 0.45;
    const wheelWidth = 0.35;
    const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 14);
    tireGeo.rotateZ(Math.PI / 2);

    const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.55, wheelRadius * 0.55, wheelWidth + 0.02, 8);
    rimGeo.rotateZ(Math.PI / 2);

    wheelPositions.forEach((wp) => {
      const steerGroup = new THREE.Group();
      steerGroup.position.set(wp.x, wp.y, wp.z);

      const rollGroup = new THREE.Group();
      const tire = new THREE.Mesh(tireGeo, wheelRubberMat);
      tire.castShadow = true;
      const rim = new THREE.Mesh(rimGeo, wheelRimMat);

      rollGroup.add(tire);
      rollGroup.add(rim);
      steerGroup.add(rollGroup);

      this.chassisGroup.add(steerGroup);

      this.wheels.push({
        rollGroup: rollGroup,
        steerGroup: steerGroup,
        isFront: wp.isFront,
        posOffset: wp,
      });

      if (wp.isFront) {
        this.frontWheelSteerGroups.push(steerGroup);
      }
    });
  }

  setupSkidmarkSystem() {
    this.maxSkidPoints = 200;
    this.skidGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxSkidPoints * 3);
    const opacities = new Float32Array(this.maxSkidPoints);

    this.skidGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.skidGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    const skidMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        color: { value: new THREE.Color(0x0a0e17) },
      },
      vertexShader: `
        attribute float opacity;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(color, vOpacity * 0.65);
        }
      `,
    });

    this.skidLine = new THREE.LineSegments(this.skidGeometry, skidMat);
    this.scene.add(this.skidLine);
    this.skidIndex = 0;
  }

  addSkidmarkPoint(x, y, z) {
    if (this.skidIndex >= this.maxSkidPoints - 2) {
      this.skidIndex = 0; // circular buffer
    }

    const posAttr = this.skidGeometry.attributes.position;
    const opAttr = this.skidGeometry.attributes.opacity;

    const offsetL = 0.85;
    const cosH = Math.cos(this.heading);
    const sinH = Math.sin(this.heading);

    // Left tire mark
    posAttr.setXYZ(this.skidIndex, x - cosH * offsetL, y + 0.03, z + sinH * offsetL);
    opAttr.setX(this.skidIndex, 0.8);
    this.skidIndex++;

    // Right tire mark
    posAttr.setXYZ(this.skidIndex, x + cosH * offsetL, y + 0.03, z - sinH * offsetL);
    opAttr.setX(this.skidIndex, 0.8);
    this.skidIndex++;

    posAttr.needsUpdate = true;
    opAttr.needsUpdate = true;
  }

  setupParticleSystem() {
    // Particle pool for tire smoke and nitro exhaust
    const particleGeo = new THREE.SphereGeometry(0.12, 5, 5);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.6,
    });
    const nitroMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
    });

    for (let i = 0; i < 60; i++) {
      const mesh = new THREE.Mesh(particleGeo, i % 2 === 0 ? smokeMat : nitroMat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.particlePool.push({
        mesh: mesh,
        active: false,
        life: 0,
        maxLife: 0.6,
        vel: new THREE.Vector3(),
      });
    }
  }

  emitParticle(type = 'smoke') {
    const p = this.particlePool.find((item) => !item.active);
    if (!p) return;

    p.active = true;
    p.life = 0;
    p.maxLife = type === 'nitro' ? 0.4 : 0.65;
    p.mesh.visible = true;

    // Emit from rear exhaust
    const backOffset = 1.35;
    const pX = this.pos.x - Math.sin(this.heading) * backOffset + (Math.random() - 0.5) * 0.4;
    const pY = this.pos.y + 0.35;
    const pZ = this.pos.z - Math.cos(this.heading) * backOffset + (Math.random() - 0.5) * 0.4;

    p.mesh.position.set(pX, pY, pZ);

    if (type === 'nitro') {
      p.mesh.material.color.setHex(0x00f0ff);
      p.vel.set(
        -Math.sin(this.heading) * 8.0 + (Math.random() - 0.5) * 2,
        Math.random() * 2.5,
        -Math.cos(this.heading) * 8.0 + (Math.random() - 0.5) * 2
      );
    } else {
      p.mesh.material.color.setHex(0x64748b);
      p.vel.set(
        (Math.random() - 0.5) * 1.5,
        0.8 + Math.random() * 1.5,
        (Math.random() - 0.5) * 1.5
      );
    }
  }

  update(dt, input) {
    // 1. Position & Heading Sync
    this.rootGroup.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.rootGroup.rotation.y = this.heading;

    // 2. Chassis Pitch & Roll (Suspension tilt)
    this.chassisGroup.rotation.x = this.chassisPitch;
    this.chassisGroup.rotation.z = this.chassisRoll;

    // 3. Front Wheels Steering Pivot
    for (const steerGroup of this.frontWheelSteerGroups) {
      steerGroup.rotation.y = this.steering;
    }

    // 4. Wheels Rolling Rotation
    const rollAngle = (this.speed * dt) / 0.45;
    for (const wheel of this.wheels) {
      wheel.rollGroup.rotation.x += rollAngle;
    }

    // 5. Radar Dish Rotation on Roof
    if (this.radarMesh) {
      this.radarMesh.rotation.y += dt * 3.5;
    }

    // 6. Taillights brightness on braking
    const isBraking = input.backward || input.handbrake;
    const tailColor = isBraking ? 0xff0033 : 0x440011;
    for (const lamp of this.taillights) {
      lamp.material.color.setHex(tailColor);
    }

    // 7. Skidmarks Generation on Drift or Hard Brake
    if (this.lateralSlip > 0.35 || (isBraking && Math.abs(this.speed) > 10)) {
      this.addSkidmarkPoint(this.pos.x, this.pos.y, this.pos.z);
      if (Math.random() < 0.6) {
        this.emitParticle('smoke');
      }
    }

    // 8. Nitro Exhaust Particles
    if (this.isBoosted || (input.forward && Math.abs(this.speed) > 18)) {
      this.emitParticle('nitro');
    }

    // 9. Update Active Particles
    for (const p of this.particlePool) {
      if (!p.active) continue;
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        p.mesh.visible = false;
      } else {
        const progress = p.life / p.maxLife;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.mesh.scale.setScalar(1.0 + progress * 2.0);
        p.mesh.material.opacity = (1.0 - progress) * 0.7;
      }
    }
  }

  respawn(spawnPos = { x: 0, y: 0.1, z: 0 }) {
    this.pos = { ...spawnPos };
    this.speed = 0;
    this.heading = 0;
    this.steering = 0;
    this.vy = 0;
    this.chassisPitch = 0;
    this.chassisRoll = 0;
    this.lateralSlip = 0;
    this.isBoosted = false;
    this.rootGroup.position.set(this.pos.x, this.pos.y, this.pos.z);
    this.rootGroup.rotation.set(0, 0, 0);
    this.chassisGroup.rotation.set(0, 0, 0);

    if (window.soundEngine) {
      window.soundEngine.playResetMagic();
    }
  }
}

window.Vehicle = Vehicle;
