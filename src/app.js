/**
 * OceanSight 3D — Main Application Coordinator
 * SIH26067 | Ministry of Earth Sciences / INCOIS
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { OceanSurface }       from './engine/oceanSurface.js';
import { SeabedBathymetry }   from './engine/bathymetry.js';
import { VolumetricMedium }   from './engine/volumetricMedium.js';
import { GridMatrix }         from './engine/gridMatrix.js';
import { CurrentParticles }   from './engine/currentParticles.js';
import { SensorNetwork }      from './engine/sensorNetwork.js';
import { NetCDFEngine }       from './data/netcdfEngine.js';
import { HUDController }      from './ui/hudController.js';

const CAMERA_LERP_SPEED  = 0.04;
const SURFACE_Y          = 0;
const SEABED_Y           = -480;
const FOG_SURFACE_NEAR   = 600;
const FOG_SURFACE_FAR    = 2200;
const FOG_DEEP_NEAR      = 60;
const FOG_DEEP_FAR       = 380;
const FPS_SPEED          = 2.8;
const FORECAST_INTERVAL  = 800;

export class OceanWorldApp {
  constructor() {
    this.scene    = null;
    this.renderer = null;
    this.camera   = null;
    this.orbitControls = null;

    this.cameraMode     = 'SLIDER';
    this.cameraAltitude = 80;
    this.targetAltitude = 80;
    this.fpsKeys        = {};
    this.fpsMoveDir     = new THREE.Vector3();
    this.pointerLocked  = false;

    this.timeIndex  = 0;
    this.isPlaying  = false;
    this._playTimer = null;

    this.layers = {
      surface: true, volume: true, grid: true,
      particles: true, seabed: true, sensors: true,
    };

    this.oceanSurface     = null;
    this.seabed           = null;
    this.volumeMedium     = null;
    this.gridMatrix       = null;
    this.currentParticles = null;
    this.sensorNetwork    = null;
    this.netcdfEngine     = null;
    this.hud              = null;

    this.raycaster = new THREE.Raycaster();
    this.mouse     = new THREE.Vector2();
    this.clock     = new THREE.Clock();
    this._animFrameId = null;

    this.ambientLight      = null;
    this.sunLight          = null;
    this.underwaterAmbient = null;
  }

  async init() {
    this._initThree();
    this._initLighting();
    this._initEngines();
    this._initHUD();
    this._bindWindowEvents();
    this._startRenderLoop();
    this._showLoadingComplete();
  }

  _initThree() {
    const canvas = document.getElementById('ocean-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled   = true;
    this.renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace    = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060e1a);
    this.scene.fog = new THREE.Fog(0x060e1a, FOG_SURFACE_NEAR, FOG_SURFACE_FAR);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 4000);
    this.camera.position.set(180, 80, 260);
    this.camera.lookAt(0, -60, 0);

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.target.set(0, -60, 0);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.06;
    this.orbitControls.minDistance   = 50;
    this.orbitControls.maxDistance   = 1800;
    this.orbitControls.enabled       = true;
  }

  _initLighting() {
    this.ambientLight = new THREE.AmbientLight(0xb0cfe8, 0.65);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff4e0, 1.2);
    this.sunLight.position.set(300, 500, 200);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far  = 2000;
    this.sunLight.shadow.camera.left = -400;
    this.sunLight.shadow.camera.right = 400;
    this.sunLight.shadow.camera.top   = 400;
    this.sunLight.shadow.camera.bottom = -400;
    this.scene.add(this.sunLight);

    this.underwaterAmbient = new THREE.HemisphereLight(0x006994, 0x030a14, 0.0);
    this.scene.add(this.underwaterAmbient);

    const causticFill = new THREE.PointLight(0x00bcd4, 0.4, 300);
    causticFill.position.set(0, -30, 0);
    this.scene.add(causticFill);
  }

  _initEngines() {
    this.netcdfEngine = new NetCDFEngine();
    this.netcdfEngine.init();

    this.oceanSurface = new OceanSurface(this.scene);
    this.oceanSurface.init();

    this.seabed = new SeabedBathymetry(this.scene);
    this.seabed.init();

    this.volumeMedium = new VolumetricMedium(this.scene);
    this.volumeMedium.init();

    this.gridMatrix = new GridMatrix(this.scene);
    this.gridMatrix.init();

    this.currentParticles = new CurrentParticles(this.scene);
    this.currentParticles.init();

    this.sensorNetwork = new SensorNetwork(this.scene, this);
    this.sensorNetwork.init();
  }

  _initHUD() {
    this.hud = new HUDController(this);
    this.hud.init();
  }

  _bindWindowEvents() {
    window.addEventListener('resize', () => this._onResize());
    window.addEventListener('click',  (e) => this._onCanvasClick(e));
    window.addEventListener('keydown', (e) => { this.fpsKeys[e.code] = true;  });
    window.addEventListener('keyup',   (e) => { this.fpsKeys[e.code] = false; });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.renderer.domElement;
    });
    document.addEventListener('mousemove', (e) => this._onFPSMouseMove(e));
  }

  _onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _onCanvasClick(e) {
    if (this.cameraMode === 'FPS') return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = this.sensorNetwork.checkRaycast(this.raycaster);
    if (hit) this.sensorNetwork.showBuoyInspectionModal(hit);
  }

  _onFPSMouseMove(e) {
    if (!this.pointerLocked) return;
    this.camera.rotation.y -= e.movementX * 0.002;
    this.camera.rotation.x -= e.movementY * 0.002;
    this.camera.rotation.x = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.camera.rotation.x));
  }

  _startRenderLoop() {
    const loop = () => {
      this._animFrameId = requestAnimationFrame(loop);
      const elapsed = this.clock.getElapsedTime();
      this._update(elapsed);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  _update(time) {
    if (this.cameraMode === 'FPS' && this.pointerLocked) this._updateFPSMovement();

    if (this.cameraMode === 'SLIDER') {
      this.camera.position.y += (this.targetAltitude - this.camera.position.y) * CAMERA_LERP_SPEED;
    }

    this.cameraAltitude = this.camera.position.y;
    this._updateEnvironment();

    if (this.oceanSurface)     this.oceanSurface.update(time);
    if (this.volumeMedium)     this.volumeMedium.update(time);
    if (this.currentParticles) this.currentParticles.update(time);
    if (this.sensorNetwork)    this.sensorNetwork.update(time);

    if (this.cameraMode === 'SLIDER') this.orbitControls.update();

    if (this.hud) {
      const telemetry = this.netcdfEngine.getTelemetryAt(this.camera.position.y, this.timeIndex);
      this.hud.update(telemetry);
    }
  }

  _updateFPSMovement() {
    this.fpsMoveDir.set(0, 0, 0);
    if (this.fpsKeys['KeyW'] || this.fpsKeys['ArrowUp'])    this.fpsMoveDir.z -= 1;
    if (this.fpsKeys['KeyS'] || this.fpsKeys['ArrowDown'])  this.fpsMoveDir.z += 1;
    if (this.fpsKeys['KeyA'] || this.fpsKeys['ArrowLeft'])  this.fpsMoveDir.x -= 1;
    if (this.fpsKeys['KeyD'] || this.fpsKeys['ArrowRight']) this.fpsMoveDir.x += 1;
    if (this.fpsKeys['Space'])                              this.fpsMoveDir.y += 1;
    if (this.fpsKeys['ShiftLeft'])                          this.fpsMoveDir.y -= 1;
    if (this.fpsMoveDir.lengthSq() > 0) {
      this.fpsMoveDir.normalize().applyQuaternion(this.camera.quaternion);
      this.camera.position.addScaledVector(this.fpsMoveDir, FPS_SPEED);
      this.camera.position.y = Math.max(SEABED_Y + 10, Math.min(200, this.camera.position.y));
    }
  }

  _updateEnvironment() {
    const alt = this.camera.position.y;
    if (alt < SURFACE_Y) {
      const d = Math.abs(alt) / Math.abs(SEABED_Y);
      const bgR = THREE.MathUtils.lerp(0.008, 0.003, d);
      const bgG = THREE.MathUtils.lerp(0.040, 0.010, d);
      const bgB = THREE.MathUtils.lerp(0.090, 0.040, d);
      this.scene.background.setRGB(bgR, bgG, bgB);
      this.scene.fog.near = THREE.MathUtils.lerp(FOG_DEEP_NEAR + 30, FOG_DEEP_NEAR, d);
      this.scene.fog.far  = THREE.MathUtils.lerp(FOG_DEEP_FAR  + 80, FOG_DEEP_FAR,  d);
      this.scene.fog.color.setRGB(bgR * 1.5, bgG * 1.5, bgB * 1.8);
      this.ambientLight.intensity      = THREE.MathUtils.lerp(0.65, 0.18, d);
      this.sunLight.intensity          = THREE.MathUtils.lerp(1.2,  0.0,  d);
      this.underwaterAmbient.intensity = THREE.MathUtils.lerp(0.0,  0.7,  d);
    } else {
      this.scene.background.set(0x060e1a);
      this.scene.fog.near = FOG_SURFACE_NEAR;
      this.scene.fog.far  = FOG_SURFACE_FAR;
      this.scene.fog.color.set(0x060e1a);
      this.ambientLight.intensity      = 0.65;
      this.sunLight.intensity          = 1.2;
      this.underwaterAmbient.intensity = 0.0;
    }
  }

  _showLoadingComplete() {
    const loader = document.getElementById('loading-screen');
    if (!loader) return;
    setTimeout(() => {
      loader.style.opacity    = '0';
      loader.style.transition = 'opacity 0.8s ease';
      setTimeout(() => loader.remove(), 900);
    }, 1400);
  }

  // ══════════ Public API ════════════════════════

  setTargetAltitude(alt) {
    this.targetAltitude = alt;
    if (this.cameraMode === 'SLIDER') {
      this.orbitControls.target.y = Math.min(alt - 40, -20);
    }
  }

  toggleTimePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this._playTimer = setInterval(() => {
        this.timeIndex = (this.timeIndex + 1) % 40;
      }, FORECAST_INTERVAL);
    } else {
      clearInterval(this._playTimer);
      this._playTimer = null;
    }
  }

  switchMode(mode) {
    this.cameraMode = mode;
    if (mode === 'FPS') {
      this.orbitControls.enabled = false;
      this.camera.rotation.order = 'YXZ';
      this.renderer.domElement.requestPointerLock();
    } else {
      this.orbitControls.enabled = true;
      document.exitPointerLock?.();
      this.pointerLocked = false;
    }
  }

  toggleLayer(key) {
    this.layers[key] = !this.layers[key];
    const active = this.layers[key];
    const map = {
      surface:   () => this.oceanSurface?.setVisible?.(active),
      volume:    () => this.volumeMedium?.setVisible?.(active),
      grid:      () => this.gridMatrix?.setVisible?.(active),
      particles: () => this.currentParticles?.setVisible?.(active),
      seabed:    () => this.seabed?.setVisible?.(active),
      sensors:   () => this.sensorNetwork?.setVisible?.(active),
    };
    map[key]?.();
    return active;
  }

  async handleNetCDFFile(file) {
    const tag = document.getElementById('model-status-tag');
    if (tag) { tag.textContent = '⏳ LOADING…'; tag.style.color = 'var(--accent-amber)'; }
    try {
      await this.netcdfEngine.loadFromFile(file);
      if (tag) { tag.textContent = `✓ ${file.name.slice(0, 18).toUpperCase()}`; tag.style.color = 'var(--accent-emerald)'; }
    } catch (err) {
      console.error('NetCDF load error:', err);
      if (tag) { tag.textContent = '✗ LOAD FAILED'; tag.style.color = 'var(--accent-coral)'; }
    }
  }
}

export async function bootOceanSight() {
  const app = new OceanWorldApp();
  window.__oceanApp = app;
  await app.init();
  return app;
}

