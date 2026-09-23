/**
 * OceanSight 3D — Seabed Bathymetry Floor
 * Procedural Submarine Topography, Continental Slope, and Depth Contours
 */

export class SeabedBathymetry {
  constructor(scene) {
    this.scene = scene;
    this.init();
  }

  init() {
    const seabedGeo = new THREE.PlaneGeometry(750, 750, 80, 80);
    seabedGeo.rotateX(-Math.PI / 2);
    const pos = seabedGeo.attributes.position;

    // Procedural submarine ridges, trenches, and continental shelf drop-off
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const dist = Math.sqrt(x * x + z * z);
      const canyon = Math.sin(x * 0.015) * Math.cos(z * 0.02) * 45.0;
      const ridge = Math.sin(x * 0.04 + z * 0.03) * 18.0;
      const slope = Math.min(60.0, (dist / 380.0) * 80.0);
      const depth = -495.0 + canyon + ridge - slope;
      pos.setY(i, depth);
    }
    seabedGeo.computeVertexNormals();

    const seabedMat = new THREE.MeshStandardMaterial({
      color: 0x091824,
      roughness: 0.88,
      metalness: 0.15,
      wireframe: false,
      flatShading: true
    });

    this.mesh = new THREE.Mesh(seabedGeo, seabedMat);
    this.scene.add(this.mesh);

    // Subtle bathymetry wireframe contour overlay
    const contourMat = new THREE.MeshBasicMaterial({
      color: 0x004466,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    this.contourMesh = new THREE.Mesh(seabedGeo, contourMat);
    this.scene.add(this.contourMesh);
  }

  setVisible(visible) {
    if (this.mesh) this.mesh.visible = visible;
    if (this.contourMesh) this.contourMesh.visible = visible;
  }
}
