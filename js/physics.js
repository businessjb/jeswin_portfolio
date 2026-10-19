/**
 * Enhanced Arcade Physics Engine for Jeswin's 3D Portfolio & Game
 * Features:
 * - Vehicle dynamics, steering, drifting with lateral slip
 * - Destructible skill blocks, 10 bowling pins, movable bowling ball, and brick wall
 * - Spring trampoline launchpad (mega vertical jump)
 * - Dual stunt ramps with height interpolation
 * - Static obstacle bounding boxes
 * - Reset all dynamic objects functionality
 */

class PhysicsEngine {
  constructor() {
    this.worldBounds = {
      minX: -140,
      maxX: 140,
      minZ: -140,
      maxZ: 140,
    };

    this.staticColliders = [];
    this.dynamicBlocks = [];
    this.triggers = [];
    this.ramps = [];
    this.trampolines = [];
  }

  addStaticCollider(box) {
    this.staticColliders.push(box);
  }

  addDynamicBlock(mesh, originalPos, originalRot, size = { w: 1.6, h: 1.6, d: 1.6 }, type = 'block') {
    const block = {
      mesh: mesh,
      pos: { x: originalPos.x, y: originalPos.y, z: originalPos.z },
      rot: { x: originalRot.x, y: originalRot.y, z: originalRot.z },
      vel: { x: 0, y: 0, z: 0 },
      angVel: { x: 0, y: 0, z: 0 },
      originPos: { ...originalPos },
      originRot: { ...originalRot },
      size: size,
      type: type, // 'block', 'pin', 'ball', 'brick'
      isResetting: false,
      resetProgress: 1.0,
      mass: type === 'ball' ? 4.0 : type === 'pin' ? 0.8 : 1.2,
      isSleeping: false,
    };
    this.dynamicBlocks.push(block);
    return block;
  }

  addTrigger(zone) {
    this.triggers.push({
      ...zone,
      isInside: false,
    });
  }

  addRamp(ramp) {
    this.ramps.push(ramp);
  }

  addTrampoline(tramp) {
    // tramp: { x, z, radius, power }
    this.trampolines.push(tramp);
  }

  getGroundHeight(x, z) {
    for (const ramp of this.ramps) {
      if (x >= ramp.minX && x <= ramp.maxX && z >= ramp.minZ && z <= ramp.maxZ) {
        if (ramp.axis === 'z') {
          const t = (z - ramp.minZ) / (ramp.maxZ - ramp.minZ);
          return ramp.startY + t * (ramp.endY - ramp.startY);
        } else {
          const t = (x - ramp.minX) / (ramp.maxX - ramp.minX);
          return ramp.startY + t * (ramp.endY - ramp.startY);
        }
      }
    }
    return 0;
  }

  updateVehicle(car, input, dt) {
    // 1. Steering
    const steerSpeed = 3.0;
    const steerReturnSpeed = 4.5;

    if (input.left) {
      car.steering = Math.min(car.steering + steerSpeed * dt, car.maxSteering);
    } else if (input.right) {
      car.steering = Math.max(car.steering - steerSpeed * dt, -car.maxSteering);
    } else {
      if (car.steering > 0) {
        car.steering = Math.max(0, car.steering - steerReturnSpeed * dt);
      } else if (car.steering < 0) {
        car.steering = Math.min(0, car.steering + steerReturnSpeed * dt);
      }
    }

    // 2. Acceleration / Braking
    const isDrifting = input.handbrake;
    const isGrounded = car.pos.y <= this.getGroundHeight(car.pos.x, car.pos.z) + 0.12;

    if (isGrounded) {
      if (input.forward) {
        car.speed += car.acceleration * dt;
      } else if (input.backward) {
        if (car.speed > 0.5) {
          car.speed -= car.brakeDecel * dt;
        } else {
          car.speed -= car.reverseAccel * dt;
        }
      } else {
        const friction = isDrifting ? car.driftFriction : car.friction;
        if (car.speed > 0) {
          car.speed = Math.max(0, car.speed - friction * dt);
        } else if (car.speed < 0) {
          car.speed = Math.min(0, car.speed + friction * dt);
        }
      }
    }

    // Boost decay
    const maxSpd = car.isBoosted ? car.maxSpeed * 1.65 : car.maxSpeed;
    car.speed = Math.max(-car.maxReverseSpeed, Math.min(car.speed, maxSpd));

    if (car.isBoosted) {
      car.boostTimer -= dt;
      if (car.boostTimer <= 0) {
        car.isBoosted = false;
      }
    }

    // 3. Angular Yaw
    const speedRatio = Math.abs(car.speed) / car.maxSpeed;
    if (speedRatio > 0.02) {
      const turnMultiplier = (car.speed < 0 ? -1 : 1) * (isDrifting ? 1.6 : 1.0);
      car.heading += car.steering * turnMultiplier * dt * (1.65 - speedRatio * 0.38);
    }

    // 4. Drift & Lateral Slip
    const forwardVector = {
      x: Math.sin(car.heading),
      z: Math.cos(car.heading),
    };
    const lateralVector = {
      x: Math.cos(car.heading),
      z: -Math.sin(car.heading),
    };

    if (isDrifting && Math.abs(car.speed) > 7) {
      car.lateralSlip = Math.min(car.lateralSlip + dt * 4.2, 1.0);
    } else {
      car.lateralSlip = Math.max(car.lateralSlip - dt * 3.6, 0.0);
    }

    // 5. Position Update
    const forwardDist = car.speed * dt;
    const lateralDist = car.lateralSlip * (car.steering * -5.2) * dt;

    let nextX = car.pos.x + forwardVector.x * forwardDist + lateralVector.x * lateralDist;
    let nextZ = car.pos.z + forwardVector.z * forwardDist + lateralVector.z * lateralDist;

    // 6. World Bounds
    nextX = Math.max(this.worldBounds.minX + 2, Math.min(nextX, this.worldBounds.maxX - 2));
    nextZ = Math.max(this.worldBounds.minZ + 2, Math.min(nextZ, this.worldBounds.maxZ - 2));

    // 7. Static Obstacle Collision
    const carRadius = 1.35;
    for (const obs of this.staticColliders) {
      if (
        nextX + carRadius > obs.minX &&
        nextX - carRadius < obs.maxX &&
        nextZ + carRadius > obs.minZ &&
        nextZ - carRadius < obs.maxZ
      ) {
        car.speed = -car.speed * 0.35;
        if (window.soundEngine) {
          window.soundEngine.playCollision(0.8);
        }
        nextX = car.pos.x;
        nextZ = car.pos.z;
        break;
      }
    }

    car.pos.x = nextX;
    car.pos.z = nextZ;

    // 8. Ground Elevation & Air Physics
    const groundY = this.getGroundHeight(car.pos.x, car.pos.z);
    if (car.pos.y > groundY + 0.05) {
      car.vy -= 26.0 * dt;
      car.pos.y += car.vy * dt;
      if (car.pos.y <= groundY) {
        car.pos.y = groundY;
        car.vy = 0;
        car.chassisPitch = 0.12;
      }
    } else {
      car.pos.y = groundY;
      car.vy = 0;

      // Ramp air launch
      const rampSlope = this.getTerrainSlope(car.pos.x, car.pos.z, forwardVector);
      if (rampSlope > 0.15 && car.speed > 14) {
        car.vy = car.speed * 0.52;
        car.pos.y += 0.2;
      }
    }

    // 9. Trampoline Mega Bounce Check
    for (const tramp of this.trampolines) {
      const dx = car.pos.x - tramp.x;
      const dz = car.pos.z - tramp.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < tramp.radius && car.pos.y <= groundY + 0.5) {
        car.vy = tramp.power || 26.0;
        car.pos.y += 0.5;
        if (window.soundEngine) {
          window.soundEngine.playTrampolineSpring();
        }
        window.showToast('🚀 SUPER SPRING LAUNCH! 15M AIRTIME!');
      }
    }

    // 10. Suspension Pitch & Roll
    const targetPitch = (input.forward ? -0.06 : input.backward ? 0.09 : 0) * (Math.abs(car.speed) / car.maxSpeed);
    car.chassisPitch += (targetPitch - car.chassisPitch) * dt * 8.0;

    const targetRoll = -car.steering * (Math.abs(car.speed) / car.maxSpeed) * 0.28;
    car.chassisRoll += (targetRoll - car.chassisRoll) * dt * 9.0;

    // 11. Dynamic Blocks, Bowling Pins, Brick Wall Simulation
    this.updateBlocks(car, dt);

    // 12. Check Trigger Zones
    this.checkTriggers(car);
  }

  getTerrainSlope(x, z, forwardVec) {
    const h1 = this.getGroundHeight(x, z);
    const h2 = this.getGroundHeight(x + forwardVec.x * 1.5, z + forwardVec.z * 1.5);
    return (h2 - h1);
  }

  updateBlocks(car, dt) {
    const carRadius = 1.65;
    const carSpeed = Math.abs(car.speed);

    // Check Block vs Car & Block vs Block
    for (let i = 0; i < this.dynamicBlocks.length; i++) {
      const block = this.dynamicBlocks[i];

      if (block.isResetting) {
        block.resetProgress += dt * 1.8;
        const t = Math.min(block.resetProgress, 1.0);
        const ease = 1 - Math.pow(1 - t, 3);

        block.pos.x = block.originPos.x * ease + block.pos.x * (1 - ease);
        block.pos.y = block.originPos.y * ease + (block.pos.y + 2.0 * (1 - ease));
        block.pos.z = block.originPos.z * ease + block.pos.z * (1 - ease);

        block.rot.x = block.originRot.x * ease + block.rot.x * (1 - ease);
        block.rot.y = block.originRot.y * ease + block.rot.y * (1 - ease);
        block.rot.z = block.originRot.z * ease + block.rot.z * (1 - ease);

        if (t >= 1.0) {
          block.pos = { ...block.originPos };
          block.rot = { ...block.originRot };
          block.vel = { x: 0, y: 0, z: 0 };
          block.angVel = { x: 0, y: 0, z: 0 };
          block.isResetting = false;
          block.isSleeping = true;
        }

        block.mesh.position.set(block.pos.x, block.pos.y, block.pos.z);
        block.mesh.rotation.set(block.rot.x, block.rot.y, block.rot.z);
        continue;
      }

      // Check collision with Car
      const dx = block.pos.x - car.pos.x;
      const dz = block.pos.z - car.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const hitRadius = (block.type === 'ball' ? 1.4 : 1.0) + carRadius;

      if (dist < hitRadius) {
        const hitNormal = { x: dx / (dist || 1), z: dz / (dist || 1) };
        const impactForce = Math.max(carSpeed * (block.type === 'ball' ? 1.8 : 1.4), 6.0);

        block.vel.x = hitNormal.x * impactForce + (Math.random() - 0.5) * 3.0;
        block.vel.z = hitNormal.z * impactForce + (Math.random() - 0.5) * 3.0;
        block.vel.y = Math.min(impactForce * 0.4, 9.5);

        block.angVel.x = (Math.random() - 0.5) * 12.0;
        block.angVel.y = (Math.random() - 0.5) * 14.0;
        block.angVel.z = (Math.random() - 0.5) * 12.0;

        block.isSleeping = false;

        car.speed *= 0.84;

        if (window.soundEngine) {
          if (block.type === 'pin') {
            window.soundEngine.playBowlingStrike();
          } else if (block.type === 'brick') {
            window.soundEngine.playBrickSmash();
          } else {
            window.soundEngine.playCollision(Math.min(carSpeed / 18, 1.0));
          }
        }
      }

      // Ball pushing bowling pins
      if (block.type === 'ball' && !block.isSleeping) {
        for (let j = 0; j < this.dynamicBlocks.length; j++) {
          const pin = this.dynamicBlocks[j];
          if (pin.type === 'pin') {
            const pdx = pin.pos.x - block.pos.x;
            const pdz = pin.pos.z - block.pos.z;
            const pdist = Math.sqrt(pdx * pdx + pdz * pdz);
            if (pdist < 1.8) {
              const nx = pdx / (pdist || 1);
              const nz = pdz / (pdist || 1);
              const force = Math.hypot(block.vel.x, block.vel.z) * 1.2;
              pin.vel.x = nx * force + (Math.random() - 0.5) * 4.0;
              pin.vel.z = nz * force + (Math.random() - 0.5) * 4.0;
              pin.vel.y = Math.min(force * 0.35, 7.0);
              pin.isSleeping = false;
              if (window.soundEngine) window.soundEngine.playBowlingStrike();
            }
          }
        }
      }

      // Block Physics integration
      if (!block.isSleeping) {
        block.vel.x *= Math.pow(0.86, dt * 60);
        block.vel.z *= Math.pow(0.86, dt * 60);
        block.angVel.x *= Math.pow(0.88, dt * 60);
        block.angVel.y *= Math.pow(0.88, dt * 60);
        block.angVel.z *= Math.pow(0.88, dt * 60);

        block.vel.y -= 28.0 * dt;

        block.pos.x += block.vel.x * dt;
        block.pos.y += block.vel.y * dt;
        block.pos.z += block.vel.z * dt;

        block.rot.x += block.angVel.x * dt;
        block.rot.y += block.angVel.y * dt;
        block.rot.z += block.angVel.z * dt;

        const blockFloor = block.size.h * 0.5;
        if (block.pos.y <= blockFloor) {
          block.pos.y = blockFloor;
          block.vel.y = -block.vel.y * 0.35;
          if (Math.abs(block.vel.y) < 0.3) block.vel.y = 0;
        }

        const totalKinetic =
          Math.abs(block.vel.x) + Math.abs(block.vel.y) + Math.abs(block.vel.z) +
          Math.abs(block.angVel.x) + Math.abs(block.angVel.y) + Math.abs(block.angVel.z);

        if (totalKinetic < 0.08 && block.pos.y <= blockFloor + 0.05) {
          block.isSleeping = true;
          block.vel = { x: 0, y: 0, z: 0 };
          block.angVel = { x: 0, y: 0, z: 0 };
        }

        block.mesh.position.set(block.pos.x, block.pos.y, block.pos.z);
        block.mesh.rotation.set(block.rot.x, block.rot.y, block.rot.z);
      }
    }
  }

  resetAllBlocks() {
    if (window.soundEngine) {
      window.soundEngine.playResetMagic();
    }
    for (const block of this.dynamicBlocks) {
      block.isResetting = true;
      block.resetProgress = 0.0;
    }
  }

  checkTriggers(car) {
    for (const trigger of this.triggers) {
      const dx = car.pos.x - trigger.x;
      const dz = car.pos.z - trigger.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const isCurrentlyInside = dist <= trigger.radius;

      if (isCurrentlyInside && !trigger.isInside) {
        trigger.isInside = true;
        if (trigger.onEnter) trigger.onEnter(trigger, car);
      } else if (!isCurrentlyInside && trigger.isInside) {
        trigger.isInside = false;
        if (trigger.onExit) trigger.onExit(trigger, car);
      } else if (isCurrentlyInside && trigger.isInside) {
        if (trigger.onStay) trigger.onStay(trigger, car);
      }
    }
  }
}

window.physicsEngine = new PhysicsEngine();
