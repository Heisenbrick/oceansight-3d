/**
 * OceanSight 3D — Ocean Surface Engine
 * Dynamic Gerstner Waves with Custom GLSL Shader & Translucent Optics
 */

import { OceanShaders } from './oceanShaders.js';

export class OceanSurface {
  constructor(scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    // 700x700 plane with 160x160 segments for high-fidelity wave displacement
    const geometry = new THREE.PlaneGeometry(700, 700, 160, 160);
    geometry.rotateX(-Math.PI / 2);

    this.uniforms = THREE.UniformsUtils.clone(OceanShaders.GerstnerWave.uniforms);

    const material = new THREE.ShaderMaterial({
      vertexShader: OceanShaders.GerstnerWave.vertexShader,
      fragmentShader: OceanShaders.GerstnerWave.fragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      side: THREE.DoubleSide
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.y = 0.0;
    this.scene.add(this.mesh);
  }

  update(time) {
    if (this.uniforms) {
      this.uniforms.uTime.value = time;
    }
  }

  setVisible(visible) {
    if (this.mesh) this.mesh.visible = visible;
  }
}
