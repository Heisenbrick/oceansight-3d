/**
 * OceanSight 3D — Simulation Grid Matrix
 * 3D Numerical Coordinate Lattice (Matches NetCDF Computational Cells)
 */

export class GridMatrix {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.boxW = 280;
    this.boxD = 180;
    this.boxH = 480;

    this.init();
  }

  init() {
    const { boxW, boxD, boxH } = this;

    // 1. Exterior Bounding Box Wireframe
    const boxGeo = new THREE.BoxGeometry(boxW, boxH, boxD);
    const boxMesh = new THREE.Mesh(boxGeo);
    const wireBox = new THREE.BoxHelper(boxMesh, 0x00f0ff);
    wireBox.position.set(0, -boxH / 2, 0);
    wireBox.material.opacity = 0.55;
    wireBox.material.transparent = true;
    this.group.add(wireBox);

    // 2. 3D Internal Coordinate Lattice Matrix Lines
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.25
    });
    const pts = [];

    // Vertical column grid lines (6 x 4 resolution)
    const xSteps = 6;
    const zSteps = 4;
    for (let ix = 0; ix <= xSteps; ix++) {
      const gx = -boxW / 2 + (ix / xSteps) * boxW;
      for (let iz = 0; iz <= zSteps; iz++) {
        const gz = -boxD / 2 + (iz / zSteps) * boxD;
        pts.push(new THREE.Vector3(gx, 0, gz));
        pts.push(new THREE.Vector3(gx, -boxH, gz));
      }
    }

    // Horizontal depth frames (every 80m across 6 vertical tiers)
    const ySteps = 6;
    for (let iy = 1; iy < ySteps; iy++) {
      const gy = -(iy / ySteps) * boxH;
      for (let iz = 0; iz <= zSteps; iz++) {
        const gz = -boxD / 2 + (iz / zSteps) * boxD;
        pts.push(new THREE.Vector3(-boxW / 2, gy, gz));
        pts.push(new THREE.Vector3(boxW / 2, gy, gz));
      }
      for (let ix = 0; ix <= xSteps; ix++) {
        const gx = -boxW / 2 + (ix / xSteps) * boxW;
        pts.push(new THREE.Vector3(gx, gy, -boxD / 2));
        pts.push(new THREE.Vector3(gx, gy, boxD / 2));
      }
    }

    const gridGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const gridLines = new THREE.LineSegments(gridGeo, gridMat);
    this.group.add(gridLines);

    this.scene.add(this.group);
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
