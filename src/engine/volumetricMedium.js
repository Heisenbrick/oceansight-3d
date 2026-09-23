/**
 * OceanSight 3D — Volumetric Fluid Medium
 * Continuous 3D Temperature & Salinity Field with 20 Isotherm Slices & Deep Lighting
 */

export class VolumetricMedium {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.internalSlices = [];

    this.boxW = 280;
    this.boxD = 180;
    this.boxH = 480;

    this.init();
  }

  // 6-Stop Turbo Colormap Generator
  sampleTurbo(t) {
    t = Math.max(0, Math.min(1, t));
    let r, g, b;
    if (t < 0.18) {
      const u = t / 0.18;
      r = 5 + u * 15; g = 10 + u * 80; b = 80 + u * 135;
    } else if (t < 0.38) {
      const u = (t - 0.18) / 0.20;
      r = 20 - u * 20; g = 90 + u * 125; b = 215 - u * 15;
    } else if (t < 0.58) {
      const u = (t - 0.38) / 0.20;
      r = u * 95; g = 215 + u * 15; b = 200 - u * 140;
    } else if (t < 0.78) {
      const u = (t - 0.58) / 0.20;
      r = 95 + u * 155; g = 230 - u * 35; b = 60 - u * 50;
    } else if (t < 0.90) {
      const u = (t - 0.78) / 0.12;
      r = 250; g = 195 - u * 95; b = 10;
    } else {
      const u = (t - 0.90) / 0.10;
      r = 250 - u * 25; g = 100 - u * 85; b = 10 + u * 20;
    }
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }

  // Realistic ocean thermocline depth normalization (0=surface warm, 1=abyss cold)
  depthToNorm(depthRatio) {
    if (depthRatio < 0.10) return 0.98 - depthRatio * 0.30;
    if (depthRatio < 0.42) {
      const t = (depthRatio - 0.10) / 0.32;
      return 0.95 - t * 0.60;
    }
    const t = (depthRatio - 0.42) / 0.58;
    return 0.35 - t * 0.28;
  }

  init() {
    const { boxW, boxD, boxH } = this;

    // 1. Horizontal Sea Surface Temperature (SST) contour canvas texture
    const hCanvas = document.createElement('canvas');
    hCanvas.width = 512; hCanvas.height = 256;
    const hCtx = hCanvas.getContext('2d');
    for (let y = 0; y < hCanvas.height; y++) {
      for (let x = 0; x < hCanvas.width; x++) {
        const nx = x / hCanvas.width;
        const ny = y / hCanvas.height;
        const distFromCenter = Math.hypot(nx - 0.45, ny - 0.48);
        const warmEddy = Math.exp(-distFromCenter * 3.8) * 0.42;
        const wave = Math.sin(nx * 5.0 + ny * 2.2) * 0.07;
        let norm = Math.max(0.08, Math.min(1.0, 0.58 + warmEddy + wave - (nx * 0.12)));
        hCtx.fillStyle = this.sampleTurbo(norm);
        hCtx.fillRect(x, y, 1, 1);
      }
    }
    const hTex = new THREE.CanvasTexture(hCanvas);

    // 2. Vertical continuous depth gradient canvas (0m to -480m)
    const vCanvas = document.createElement('canvas');
    vCanvas.width = 128; vCanvas.height = 512;
    const vCtx = vCanvas.getContext('2d');
    for (let y = 0; y < vCanvas.height; y++) {
      const depthRatio = y / vCanvas.height;
      const norm = Math.max(0.05, Math.min(1.0, this.depthToNorm(depthRatio)));
      vCtx.fillStyle = this.sampleTurbo(norm);
      vCtx.fillRect(0, y, vCanvas.width, 1);
    }
    const vTex = new THREE.CanvasTexture(vCanvas);

    const faceMatArgs = (opacity) => ({
      transparent: true,
      opacity,
      roughness: 0.20,
      metalness: 0.0,
      emissive: new THREE.Color(0x001122),
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide
    });

    // Top Face (Sea Surface Temperature)
    const topGeo = new THREE.PlaneGeometry(boxW, boxD);
    topGeo.rotateX(-Math.PI / 2);
    const topMat = new THREE.MeshStandardMaterial({ map: hTex, ...faceMatArgs(0.88) });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.position.set(0, 0, 0);
    this.group.add(topMesh);

    // Front & Back Faces (Vertical Transects)
    const frontGeo = new THREE.PlaneGeometry(boxW, boxH);
    const frontMat = new THREE.MeshStandardMaterial({ map: vTex, ...faceMatArgs(0.85) });
    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.position.set(0, -boxH / 2, boxD / 2);
    this.group.add(frontMesh);

    const backMesh = new THREE.Mesh(frontGeo, frontMat);
    backMesh.position.set(0, -boxH / 2, -boxD / 2);
    this.group.add(backMesh);

    // Left & Right Faces
    const sideGeo = new THREE.PlaneGeometry(boxD, boxH);
    const sideMat = new THREE.MeshStandardMaterial({ map: vTex, ...faceMatArgs(0.82) });
    const leftMesh = new THREE.Mesh(sideGeo, sideMat);
    leftMesh.rotation.y = Math.PI / 2;
    leftMesh.position.set(-boxW / 2, -boxH / 2, 0);
    this.group.add(leftMesh);

    const rightMesh = new THREE.Mesh(sideGeo, sideMat);
    rightMesh.rotation.y = -Math.PI / 2;
    rightMesh.position.set(boxW / 2, -boxH / 2, 0);
    this.group.add(rightMesh);

    // Bottom Face (Sealed Seabed Interface)
    const botGeo = new THREE.PlaneGeometry(boxW, boxD);
    botGeo.rotateX(-Math.PI / 2);
    const botCanvas = document.createElement('canvas');
    botCanvas.width = 256; botCanvas.height = 128;
    const botCtx = botCanvas.getContext('2d');
    for (let by = 0; by < botCanvas.height; by++) {
      for (let bx = 0; bx < botCanvas.width; bx++) {
        const wave = Math.sin(bx * 0.06) * 0.04 + Math.cos(by * 0.09) * 0.03;
        const norm = Math.max(0.05, 0.09 + wave);
        botCtx.fillStyle = this.sampleTurbo(norm);
        botCtx.fillRect(bx, by, 1, 1);
      }
    }
    const botTex = new THREE.CanvasTexture(botCanvas);
    const botMat = new THREE.MeshStandardMaterial({ map: botTex, ...faceMatArgs(0.78) });
    const botMesh = new THREE.Mesh(botGeo, botMat);
    botMesh.position.set(0, -boxH, 0);
    this.group.add(botMesh);

    // 20 Dense Internal Isotherm Depth Slices for True Volumetric Appearance
    const numSlices = 20;
    for (let i = 1; i < numSlices; i++) {
      const depthRatio = i / numSlices;
      const yDepth = -depthRatio * boxH;
      const baseNorm = Math.max(0.05, this.depthToNorm(depthRatio));

      const sCanvas = document.createElement('canvas');
      sCanvas.width = 256; sCanvas.height = 128;
      const sCtx = sCanvas.getContext('2d');
      for (let sy = 0; sy < sCanvas.height; sy++) {
        for (let sx = 0; sx < sCanvas.width; sx++) {
          const spatial = Math.sin(sx * 0.10) * 0.04 + Math.cos(sy * 0.12 + sx * 0.05) * 0.03;
          const n = Math.max(0.05, Math.min(1.0, baseNorm + spatial));
          sCtx.fillStyle = this.sampleTurbo(n);
          sCtx.fillRect(sx, sy, 1, 1);
        }
      }
      const sTex = new THREE.CanvasTexture(sCanvas);

      // Deeper slices get higher opacity to preserve visibility in the abyss
      const sliceOpacity = depthRatio < 0.40 ? 0.28 : depthRatio < 0.70 ? 0.34 : 0.42;

      const sMat = new THREE.MeshStandardMaterial({
        map: sTex,
        transparent: true,
        opacity: sliceOpacity,
        roughness: 0.35,
        emissive: new THREE.Color(0x001133),
        emissiveIntensity: 0.45,
        side: THREE.DoubleSide
      });
      const sGeo = new THREE.PlaneGeometry(boxW - 1, boxD - 1);
      sGeo.rotateX(-Math.PI / 2);
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.position.set(0, yDepth, 0);
      sMesh.userData = { baseY: yDepth, speed: 0.4 + i * 0.05, phase: i * 0.35 };

      this.group.add(sMesh);
      this.internalSlices.push(sMesh);
    }

    // Deep-Zone Internal Point Lights (Prevents Abyss Blackout)
    const deepLight1 = new THREE.PointLight(0x1133cc, 2.8, 350);
    deepLight1.position.set(0, -370, 0);
    this.group.add(deepLight1);

    const deepLight2 = new THREE.PointLight(0x0022aa, 2.0, 280);
    deepLight2.position.set(90, -450, 50);
    this.group.add(deepLight2);

    const thermoLight = new THREE.PointLight(0x00ddcc, 1.8, 300);
    thermoLight.position.set(-60, -195, -45);
    this.group.add(thermoLight);

    this.scene.add(this.group);
  }

  update(time) {
    // Gentle internal wave oscillation on depth isotherm slices
    for (let i = 0; i < this.internalSlices.length; i++) {
      const slice = this.internalSlices[i];
      const offset = Math.sin(time * slice.userData.speed + slice.userData.phase) * 1.6;
      slice.position.y = slice.userData.baseY + offset;
    }
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
