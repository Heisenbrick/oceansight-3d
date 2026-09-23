/**
 * OceanSight 3D — Current Particles Engine
 * 3,200 Dynamic Ocean Current Velocity Streamlines (u, v, w)
 */

export class CurrentParticles {
  constructor(scene) {
    this.scene = scene;
    this.particleCount = 3200;
    this.init();
  }

  init() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const velocities = new Float32Array(this.particleCount * 3);
    const seeds = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      const px = (Math.random() - 0.5) * 420;
      const py = -Math.random() * 450;
      const pz = (Math.random() - 0.5) * 420;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      // Realistic eddy circulation flow vector
      const dist = Math.sqrt(px * px + pz * pz);
      const angle = Math.atan2(pz, px) + Math.PI / 2;
      const speed = Math.exp(py / 190.0) * (0.45 + 1.35 * Math.exp(-Math.pow(dist - 90, 2) / 2800));

      velocities[i * 3] = Math.cos(angle) * speed;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.05; // Gentle upwelling/downwelling
      velocities[i * 3 + 2] = Math.sin(angle) * speed;

      seeds[i] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));

    // Custom ShaderMaterial for particle current trails
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0.0 },
        uColorSurface: { value: new THREE.Color(0x00e5ff) }, // Cyan surface current
        uColorDeep: { value: new THREE.Color(0x0044bb) }     // Deep abyssal current
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uColorSurface;
        uniform vec3 uColorDeep;
        attribute vec3 velocity;
        attribute float seed;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          // Animate particle along velocity vector
          float t = mod(uTime * 18.0 + seed * 100.0, 100.0);
          pos += velocity * t;

          // Wrap particles in bounding box
          if (pos.x > 210.0) pos.x -= 420.0;
          if (pos.x < -210.0) pos.x += 420.0;
          if (pos.z > 210.0) pos.z -= 420.0;
          if (pos.z < -210.0) pos.z += 420.0;

          // Depth-dependent color interpolation
          float depthRatio = clamp(-pos.y / 450.0, 0.0, 1.0);
          vColor = mix(uColorSurface, uColorDeep, depthRatio);
          vAlpha = (1.0 - depthRatio * 0.45) * 0.85;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (12.0 / -mvPosition.z) * (3.5 - depthRatio * 1.5);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          // Circular particle shape
          vec2 coord = gl_PointCoord - vec2(0.5);
          if (length(coord) > 0.5) discard;
          gl_FragColor = vec4(vColor, vAlpha * (1.0 - length(coord) * 2.0));
        }
      `
    });

    this.points = new THREE.Points(geometry, material);
    this.material = material;
    this.scene.add(this.points);
  }

  update(time) {
    if (this.material) {
      this.material.uniforms.uTime.value = time;
    }
  }

  setVisible(visible) {
    if (this.points) this.points.visible = visible;
  }
}
