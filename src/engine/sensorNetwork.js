/**
 * OceanSight 3D — In-Situ Sensor Network
 * Operational ARGO Buoy 3D Models, Surface Wave Bobbing & CTD Telemetry Raycasting
 */

export class SensorNetwork {
  constructor(scene, onSelectBuoy) {
    this.scene = scene;
    this.onSelectBuoy = onSelectBuoy;
    this.buoys = [];
    this.buoyGroup = new THREE.Group();

    this.init();
  }

  init() {
    // 3 Operational ARGO Floats in the Arabian Sea Model Domain
    const floatData = [
      {
        id: "ARGO-IND-6902781",
        name: "Argo Float #6902781",
        worldX: -45, worldZ: 25,
        lat: "18.42° N", lon: "71.18° E",
        depthMeters: 18.5, temp: "27.84 °C", salinity: "36.21 PSU",
        battery: "94%", status: "OPTIMAL", cycle: 142,
        sensors: "CTD (SBE-41CP) + Aanderaa Optode DO"
      },
      {
        id: "ARGO-IND-6902782",
        name: "Argo Float #6902782",
        worldX: 35, worldZ: -40,
        lat: "16.85° N", lon: "73.04° E",
        depthMeters: 45.0, temp: "25.12 °C", salinity: "36.45 PSU",
        battery: "88%", status: "OPTIMAL", cycle: 98,
        sensors: "CTD (Sea-Bird SBE-41CP)"
      },
      {
        id: "ARGO-IND-6902783",
        name: "Argo Float #6902783",
        worldX: -85, worldZ: -75,
        lat: "19.95° N", lon: "69.45° E",
        depthMeters: 120.0, temp: "15.65 °C", salinity: "35.80 PSU",
        battery: "76%", status: "TRANSMITTING", cycle: 215,
        sensors: "Bio-Argo (CTD, Chl-a, Backscatter)"
      }
    ];

    floatData.forEach(data => {
      const buoy = this.createBuoyMesh(data);
      this.buoys.push(buoy);
      this.buoyGroup.add(buoy);
    });

    this.scene.add(this.buoyGroup);
  }

  createBuoyMesh(data) {
    const buoy = new THREE.Group();

    // 1. Float Hull Cylinder (Bright Yellow Marine Coating)
    const hullGeo = new THREE.CylinderGeometry(1.6, 1.4, 6.0, 16);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      roughness: 0.35,
      metalness: 0.45
    });
    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.position.y = -2.0;
    buoy.add(hullMesh);

    // 2. Flotation Collar
    const collarGeo = new THREE.TorusGeometry(2.0, 0.4, 12, 24);
    const collarMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      roughness: 0.4
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = -0.5;
    buoy.add(collarMesh);

    // 3. Antenna Mast
    const mastGeo = new THREE.CylinderGeometry(0.12, 0.12, 5.0, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
    const mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.y = 2.5;
    buoy.add(mastMesh);

    // 4. Strobe Beacon (Flashing Red/Green)
    const beaconGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00ffaa });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.y = 5.0;
    buoy.add(beaconMesh);

    // 5. Radio Transmission Ring
    const ringGeo = new THREE.RingGeometry(2.5, 3.2, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.2;
    buoy.add(ringMesh);

    buoy.position.set(data.worldX, 0, data.worldZ);
    buoy.userData = {
      ...data,
      baseX: data.worldX,
      baseZ: data.worldZ,
      ringMesh: ringMesh,
      beaconMesh: beaconMesh,
      isArgoBuoy: true
    };

    return buoy;
  }

  update(time) {
    this.buoys.forEach((b, idx) => {
      // Realistic ocean swell bobbing & gentle roll
      const bob = Math.sin(time * 1.8 + idx * 1.4) * 0.7;
      const roll = Math.cos(time * 1.4 + idx * 0.8) * 0.08;
      b.position.y = bob;
      b.rotation.z = roll;

      // Expand & pulse telemetry radio ring
      if (b.userData.ringMesh) {
        const ringScale = 1.0 + (Math.sin(time * 3.0 + idx) * 0.5 + 0.5) * 1.5;
        b.userData.ringMesh.scale.set(ringScale, ringScale, ringScale);
        b.userData.ringMesh.material.opacity = Math.max(0.1, 0.6 - (ringScale - 1.0) * 0.35);
      }

      // Blink beacon light
      if (b.userData.beaconMesh) {
        const blink = Math.sin(time * 5.0 + idx) > 0.0;
        b.userData.beaconMesh.material.color.setHex(blink ? 0x00ffaa : 0x003322);
      }
    });
  }

  checkRaycast(raycaster) {
    const hits = raycaster.intersectObjects(this.buoyGroup.children, true);
    if (hits.length > 0) {
      let root = hits[0].object;
      while (root.parent && root.parent !== this.buoyGroup) {
        root = root.parent;
      }
      if (root.userData && root.userData.isArgoBuoy) {
        return root.userData;
      }
    }
    return null;
  }

  setVisible(visible) {
    this.buoyGroup.visible = visible;
  }
}
