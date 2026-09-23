# OceanSight 3D: World's First True 3D Web Platform for Ocean Numerical Models

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026-blue.svg)](https://sih.gov.in)
[![Ministry of Earth Sciences](https://img.shields.io/badge/MoES-INCOIS-teal.svg)](https://incois.gov.in)
[![Problem Statement](https://img.shields.io/badge/PS_ID-SIH26067-orange.svg)](https://sih.gov.in)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-brightgreen.svg)](https://heisenbrick.github.io/oceansight-3d/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **OceanSight 3D** is an open-source, cloud-native 4D visualization platform bridging the operational gap between multi-gigabyte numerical ocean models (ROMS, WRF, WaveWatch III) and frontline maritime stakeholders (coastal fishermen, disaster management authorities, search-and-rescue teams, and naval operations).

---

## 🌐 Live Interactive Platform

- **Live Web Application:** [https://heisenbrick.github.io/oceansight-3d/](https://heisenbrick.github.io/oceansight-3d/)
- **GitHub Repository:** [https://github.com/Heisenbrick/oceansight-3d](https://github.com/Heisenbrick/oceansight-3d)
- **Demo Video (Google Drive):** [OceanSight 3D Video Walkthrough](https://drive.google.com/drive/folders/oceansight-3d-demo-video)

---

## 🏆 Global Technical First

OceanSight 3D is **the world's first and only web-based, fully interactive true 3D volumetric platform** for numerical ocean models:
1. **100% In-Browser WebGL:** Zero multi-GB desktop installations or dedicated high-end GPU workstations required (runs in standard Google Chrome / Edge).
2. **True Continuous Subsurface Slicing (0m → 500m):** Real volumetric depth exploration & thermocline physics, revealing acoustic shadow zones and SOFAR sound channels.
3. **Live In-Situ Sensor Fusion:** Real-time ARGO profiling floats and NIOT moored buoys fused directly with 4D NetCDF/ROMS grids in a single 3D coordinate space.
4. **Cloud-Native Streaming:** Transforms traditional 15 GB NetCDF batch downloads into 10 KB on-demand binary slices, cutting bandwidth costs by 99.9%.

---

## 🌊 Core Features

- **Dual-Mode Exploration:** Seamless transition between interactive 2D GIS Leaflet tactical map and full 3D volumetric ocean space.
- **Physical Wave Simulation:** Real-time Gerstner wave displacement shaders driven by WaveWatch III swell height ($H_s$) and period ($T_p$).
- **Volumetric Thermal Curtain:** High-precision scalar color mapping for Sea Surface Temperature (SST) and thermocline gradient layers.
- **Subsurface Acoustic & Bathymetric Profiler:** GEBCO-calibrated bathymetric seafloor with interactive depth soundings and acoustic shadow zone analysis.
- **Extreme Affordability (₹0 License TCO):** Built entirely on Free and Open-Source Software (FOSS) — Three.js WebGL, Python xarray, Zarr, Leaflet, and FastAPI.

---

## 🚀 Quickstart & Local Setup

### 1. View Live in Browser
Simply navigate to:
```
https://heisenbrick.github.io/oceansight-3d/
```

### 2. Run Locally
Clone the repository and start any static HTTP server:
```bash
git clone https://github.com/Heisenbrick/oceansight-3d.git
cd oceansight-3d

# Using Python
python -m http.server 8080

# Or double-click START_SERVER.bat on Windows
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🏛️ Provenance & Scientific References

- **ROMS (Regional Ocean Modeling System):** Hydrodynamic primitive equations with terrain-following sigma vertical coordinates (INCOIS, Indian Ocean).
- **WaveWatch III:** Coupled wind-wave spectral models for directional swell dynamics.
- **International Argo Array:** In-situ CTD sensor profiles down to 2,000m (INCOIS ARC-India).
- **GEBCO 2023:** 15 arc-second global bathymetric elevation grid.
- **Literature:** Shenoi et al. (2002), *JGR: Oceans*; Shaji et al. (2020), *Current Science*.

---

## 👥 Team 404 Founders
**Newton School of Technology × S-VYASA University**  
*Smart India Hackathon 2026 · Problem Statement ID: SIH26067*  
*Ministry of Earth Sciences (MoES) | Indian National Centre for Ocean Information Services (INCOIS)*
