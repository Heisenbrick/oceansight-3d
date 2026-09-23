

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const $ = id => document.getElementById(id);
const set = (id,v) => { const e=$(id); if(e) e.textContent=v; };

// Live Marine API Engine (Real-time Open-Meteo Arabian Sea observations & forecasts)
const LIVE_API = {
  active: false,
  lat: 18.9, lon: 70.8, // Arabian Sea off Mumbai / INCOIS grid
  sst: 28.6,
  waveHeight: 1.12,
  wavePeriod: 10.2,
  waveDirection: 238,
  currentKnots: 0.54,
  hourlySST: [],
  hourlyWaves: [],
  hourlyCurrent: []
};

async function fetchLiveOceanData() {
  const badge = $("mst");
  if (badge) {
    badge.textContent = "⏳ CONNECTING LIVE ARABIAN SEA API...";
    badge.style.color = "var(--amber)";
  }
  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${LIVE_API.lat}&longitude=${LIVE_API.lon}&current=wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction&hourly=sea_surface_temperature,wave_height,ocean_current_velocity&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    
    if (json.current) {
      LIVE_API.active = true;
      LIVE_API.waveHeight = json.current.wave_height != null ? json.current.wave_height : 1.1;
      LIVE_API.wavePeriod = json.current.wave_period != null ? json.current.wave_period : 10.0;
      LIVE_API.waveDirection = json.current.wave_direction != null ? json.current.wave_direction : 240;
      LIVE_API.currentKnots = ((json.current.ocean_current_velocity || 1.0) * 0.539957);
    }
    if (json.hourly && json.hourly.sea_surface_temperature) {
      LIVE_API.hourlySST = json.hourly.sea_surface_temperature;
      LIVE_API.hourlyWaves = json.hourly.wave_height || [];
      LIVE_API.hourlyCurrent = json.hourly.ocean_current_velocity || [];
      if (LIVE_API.hourlySST.length > 0 && LIVE_API.hourlySST[0] != null) {
        LIVE_API.sst = LIVE_API.hourlySST[0];
      }
    }
    if (badge) {
      badge.textContent = `🟢 LIVE API: ARABIAN SEA (${LIVE_API.sst}°C | ${LIVE_API.waveHeight}m WAVES | ${LIVE_API.currentKnots.toFixed(2)}kn)`;
      badge.style.color = "var(--green)";
      badge.style.background = "rgba(16,185,129,.15)";
      badge.style.borderColor = "rgba(16,185,129,.5)";
    }
    console.log("OceanSight 3D: Connected to live Arabian Sea Marine API successfully!", LIVE_API);
  } catch (e) {
    console.warn("Live API fallback:", e);
    if (badge) {
      badge.textContent = "● INCOIS-ROMS CLIMATOLOGY (FALLBACK)";
      badge.style.color = "var(--primary)";
    }
  }
}
fetchLiveOceanData();
setInterval(fetchLiveOceanData, 300000); // refresh every 5 minutes

function getTelemetry(cy, ti) {
  const dep = cy < 0 ? Math.abs(cy) : 0;
  const sig = 1 / (1 + Math.exp((dep - 95) / 18));
  
  let surfaceTemp = LIVE_API.sst;
  let waveHt = LIVE_API.waveHeight;
  let baseCur = LIVE_API.currentKnots;
  
  if (LIVE_API.hourlySST && LIVE_API.hourlySST.length > 0) {
    const idx = Math.min(ti, LIVE_API.hourlySST.length - 1);
    if (LIVE_API.hourlySST[idx] != null) surfaceTemp = LIVE_API.hourlySST[idx];
    if (LIVE_API.hourlyWaves[idx] != null) waveHt = LIVE_API.hourlyWaves[idx];
    if (LIVE_API.hourlyCurrent[idx] != null) baseCur = LIVE_API.hourlyCurrent[idx] * 0.539957;
  }
  
  const temp = (surfaceTemp + Math.sin(ti * .25) * 0.15) * sig + 4.8 * (1 - sig);
  const curSpeed = (baseCur * Math.exp(-dep / 180) + 0.05);
  
  return {
    dep,
    temp: temp.toFixed(2),
    sal: (36.1 - (dep / 480) * .9 + Math.sin(ti * .15) * .2).toFixed(2),
    vel: curSpeed.toFixed(2),
    pres: (dep < 1 ? 1.013 : dep / 10).toFixed(2),
    shadow: dep > 80 && dep < 180,
    waveHeight: waveHt != null ? waveHt.toFixed(2) : "1.12",
    wavePeriod: LIVE_API.wavePeriod != null ? LIVE_API.wavePeriod.toFixed(1) : "10.2"
  };
}

function turbo(t) {
  t=Math.max(0,Math.min(1,t));
  let r,g,b;
  if(t<.25){const u=t/.25;r=5+u*15;g=10+u*120;b=80+u*135;}
  else if(t<.5){const u=(t-.25)/.25;r=u*90;g=130+u*90;b=215-u*120;}
  else if(t<.75){const u=(t-.5)/.25;r=90+u*160;g=220-u*60;b=95-u*80;}
  else{const u=(t-.75)/.25;r=250;g=160-u*130;b=15;}
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}
function depthNorm(dr) {
  if(dr<.12) return .97-dr*.35;
  if(dr<.42){return .93-((dr-.12)/.30)*.58;}
  return .35-((dr-.42)/.58)*.28;
}

// Scene
const renderer = new THREE.WebGLRenderer({canvas:$("c"),antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.95;
renderer.outputColorSpace=THREE.SRGBColorSpace;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x060e1a);
scene.fog=new THREE.Fog(0x060e1a,600,2200);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.5,4000);
camera.position.set(180,80,260);camera.lookAt(0,-80,0);
const controls=new OrbitControls(camera,renderer.domElement);
controls.target.set(0,-80,0);controls.enableDamping=true;controls.dampingFactor=.06;
controls.minDistance=60;controls.maxDistance=1800;

const ambLight=new THREE.AmbientLight(0xb0cfe8,.65);scene.add(ambLight);
const sunLight=new THREE.DirectionalLight(0xfff4e0,1.2);sunLight.position.set(300,500,200);sunLight.castShadow=true;scene.add(sunLight);
const uwaLight=new THREE.HemisphereLight(0x006994,0x030a14,0);scene.add(uwaLight);
const cf=new THREE.PointLight(0x00bcd4,.4,300);cf.position.set(0,-30,0);scene.add(cf);

// Ocean surface
const surfGeo=new THREE.PlaneGeometry(700,700,80,80);surfGeo.rotateX(-Math.PI/2);
const sUni={uTime:{value:0}};
const surfMat=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,uniforms:sUni,
  vertexShader:`uniform float uTime;varying vec3 vP;
    vec3 gw(vec3 p,vec2 d,float A,float L,float sp,float ph){float k=6.2832/L,w=sqrt(9.8*k),f=k*dot(d,p.xz)-w*sp*uTime+ph;return vec3(d.x*A*cos(f),A*sin(f),d.y*A*cos(f));}
    void main(){vec3 p=position;p+=gw(p,normalize(vec2(1.,.8)),1.8,60.,1.,0.);p+=gw(p,normalize(vec2(.4,-1.)),1.2,35.,1.3,2.1);p+=gw(p,normalize(vec2(-.9,.6)),.6,18.,1.6,4.5);vP=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
  fragmentShader:`varying vec3 vP;void main(){float foam=pow(max(0.,vP.y/2.5),2.)*.4;vec3 col=mix(vec3(0.,.18,.35),vec3(.08,.52,.72),clamp(vP.y/4.+.5,0.,1.))+foam;gl_FragColor=vec4(col,.85);}`
});
const surfMesh=new THREE.Mesh(surfGeo,surfMat);scene.add(surfMesh);

// Seabed
const sbGeo=new THREE.PlaneGeometry(750,750,60,60);sbGeo.rotateX(-Math.PI/2);
const sbPos=sbGeo.attributes.position;
for(let i=0;i<sbPos.count;i++){const x=sbPos.getX(i),z=sbPos.getZ(i);sbPos.setY(i,-495+Math.sin(x*.015)*Math.cos(z*.02)*38+Math.sin(x*.04+z*.03)*15-Math.min(50,(Math.sqrt(x*x+z*z)/380)*70));}
sbGeo.computeVertexNormals();
const sbMesh=new THREE.Mesh(sbGeo,new THREE.MeshStandardMaterial({color:0x091824,roughness:.88,metalness:.12,flatShading:true}));scene.add(sbMesh);
const sbWire=new THREE.Mesh(sbGeo,new THREE.MeshBasicMaterial({color:0x004466,wireframe:true,transparent:true,opacity:.14}));scene.add(sbWire);

// Volumetric column
const volGrp=new THREE.Group();scene.add(volGrp);
function makeCanvas(w,h,fn){const cv=document.createElement("canvas");cv.width=w;cv.height=h;const ctx=cv.getContext("2d");fn(ctx,w,h);return new THREE.CanvasTexture(cv);}
const sstTex=makeCanvas(512,256,(ctx,w,h)=>{for(let y=0;y<h;y++)for(let x=0;x<w;x++){const nx=x/w,ny=y/h,dc=Math.hypot(nx-.45,ny-.48);ctx.fillStyle=turbo(Math.max(.08,Math.min(1,.6+Math.exp(-dc*3.8)*.38+Math.sin(nx*5+ny*2.2)*.07)));ctx.fillRect(x,y,1,1);}});
const vTex=makeCanvas(128,512,(ctx,w,h)=>{for(let y=0;y<h;y++){ctx.fillStyle=turbo(Math.max(.05,depthNorm(y/h)));ctx.fillRect(0,y,w,1);}});
const fma=(op,map)=>new THREE.MeshStandardMaterial({transparent:true,opacity:op,roughness:.2,emissive:new THREE.Color(0x001122),emissiveIntensity:.35,side:THREE.DoubleSide,map});
const VW=280,VD=180,VH=480;
const tg=new THREE.PlaneGeometry(VW,VD);tg.rotateX(-Math.PI/2);volGrp.add(new THREE.Mesh(tg,fma(.88,sstTex)));
const fg=new THREE.PlaneGeometry(VW,VH);
[[VD/2,0],[-(VD/2),Math.PI]].forEach(([z,ry])=>{const m=new THREE.Mesh(fg,fma(.84,vTex));m.position.set(0,-VH/2,z);if(ry)m.rotation.y=ry;volGrp.add(m);});
const sg=new THREE.PlaneGeometry(VD,VH);
[[-VW/2,Math.PI/2],[VW/2,-Math.PI/2]].forEach(([x,ry])=>{const m=new THREE.Mesh(sg,fma(.82,vTex));m.position.set(x,-VH/2,0);m.rotation.y=ry;volGrp.add(m);});
const slices=[];
for(let i=1;i<19;i++){
  const dr=i/19,yD=-dr*VH,bn=Math.max(.05,depthNorm(dr));
  const stx=makeCanvas(256,128,(ctx,w,h)=>{for(let sy=0;sy<h;sy++)for(let sx=0;sx<w;sx++){ctx.fillStyle=turbo(Math.max(.05,Math.min(1,bn+Math.sin(sx*.1)*.04+Math.cos(sy*.12)*.03)));ctx.fillRect(sx,sy,1,1);}});
  const sg2=new THREE.PlaneGeometry(VW-1,VD-1);sg2.rotateX(-Math.PI/2);
  const sm=new THREE.Mesh(sg2,new THREE.MeshStandardMaterial({map:stx,transparent:true,opacity:dr<.4?.3:dr<.7?.36:.44,roughness:.3,emissive:new THREE.Color(0x001133),emissiveIntensity:.45,side:THREE.DoubleSide}));
  sm.position.set(0,yD,0);sm.userData={baseY:yD,spd:.4+i*.05,ph:i*.35};volGrp.add(sm);slices.push(sm);
}
const dl1=new THREE.PointLight(0x1133cc,2.8,350);dl1.position.set(0,-370,0);volGrp.add(dl1);
const dl2=new THREE.PointLight(0x0022aa,2.0,280);dl2.position.set(90,-450,50);volGrp.add(dl2);
const dl3=new THREE.PointLight(0x00ddcc,1.8,300);dl3.position.set(-60,-195,-45);volGrp.add(dl3);

// Grid
const gridGrp=new THREE.Group();scene.add(gridGrp);
const bh=new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(VW,VH,VD)),0x00f0ff);
bh.position.set(0,-VH/2,0);bh.material.opacity=.5;bh.material.transparent=true;gridGrp.add(bh);
const gpts=[],gmat=new THREE.LineBasicMaterial({color:0x00f0ff,transparent:true,opacity:.2});
for(let ix=0;ix<=6;ix++)for(let iz=0;iz<=4;iz++){const x=-VW/2+(ix/6)*VW,z=-VD/2+(iz/4)*VD;gpts.push(new THREE.Vector3(x,0,z),new THREE.Vector3(x,-VH,z));}
for(let iy=1;iy<6;iy++){const y=-(iy/6)*VH;for(let iz=0;iz<=4;iz++){const z=-VD/2+(iz/4)*VD;gpts.push(new THREE.Vector3(-VW/2,y,z),new THREE.Vector3(VW/2,y,z));}for(let ix=0;ix<=6;ix++){const x=-VW/2+(ix/6)*VW;gpts.push(new THREE.Vector3(x,y,-VD/2),new THREE.Vector3(x,y,VD/2));}}
gridGrp.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gpts),gmat));

// Particles
const pN=2400,pPos=new Float32Array(pN*3),pVel=new Float32Array(pN*3),pSeed=new Float32Array(pN);
for(let i=0;i<pN;i++){const x=(Math.random()-.5)*400,y=-Math.random()*460,z=(Math.random()-.5)*400;pPos.set([x,y,z],i*3);const dist=Math.sqrt(x*x+z*z),ang=Math.atan2(z,x)+Math.PI/2,spd=Math.exp(y/190)*(.4+1.2*Math.exp(-Math.pow(dist-80,2)/2600));pVel.set([Math.cos(ang)*spd,(Math.random()-.5)*.05,Math.sin(ang)*spd],i*3);pSeed[i]=Math.random();}
const pGeo=new THREE.BufferGeometry();pGeo.setAttribute("position",new THREE.BufferAttribute(pPos,3));pGeo.setAttribute("velocity",new THREE.BufferAttribute(pVel,3));pGeo.setAttribute("seed",new THREE.BufferAttribute(pSeed,1));
const pUni={uTime:{value:0}};
const pMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:pUni,
  vertexShader:`uniform float uTime;attribute vec3 velocity;attribute float seed;varying vec3 vC;varying float vA;void main(){vec3 p=position;float t=mod(uTime*18.+seed*100.,100.);p+=velocity*t;if(p.x>210.)p.x-=420.;if(p.x<-210.)p.x+=420.;if(p.z>210.)p.z-=420.;if(p.z<-210.)p.z+=420.;float dr=clamp(-p.y/450.,0.,1.);vC=mix(vec3(0.,.898,1.),vec3(0.,.267,.733),dr);vA=(1.-dr*.45)*.85;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=(12./-mv.z)*(3.5-dr*1.5);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying vec3 vC;varying float vA;void main(){vec2 c=gl_PointCoord-.5;if(length(c)>.5)discard;gl_FragColor=vec4(vC,vA*(1.-length(c)*2.));}`
});
const pMesh=new THREE.Points(pGeo,pMat);scene.add(pMesh);

// ARGO buoys
const sensorGrp=new THREE.Group();scene.add(sensorGrp);
const buoys=[];
[{id:"ARGO-IND-6902781",name:"Argo Float #6902781",x:-45,z:25,lat:"18.42N",lon:"71.18E",depthMeters:18.5,temp:"27.84 C",salinity:"36.21 PSU",battery:"94%",status:"OPTIMAL",cycle:142,sensors:"CTD (SBE-41CP)+Aanderaa Optode DO"},
 {id:"ARGO-IND-6902782",name:"Argo Float #6902782",x:35,z:-40,lat:"16.85N",lon:"73.04E",depthMeters:45.0,temp:"25.12 C",salinity:"36.45 PSU",battery:"88%",status:"OPTIMAL",cycle:98,sensors:"CTD (Sea-Bird SBE-41CP)"},
 {id:"ARGO-IND-6902783",name:"Argo Float #6902783",x:-85,z:-75,lat:"19.95N",lon:"69.45E",depthMeters:120.0,temp:"15.65 C",salinity:"35.80 PSU",battery:"76%",status:"TRANSMITTING",cycle:215,sensors:"Bio-Argo (CTD+Chl-a+Backscatter)"}
].forEach(d=>{
  const bg=new THREE.Group();bg.position.set(d.x,0,d.z);
  const h=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.4,6,16),new THREE.MeshStandardMaterial({color:0xffaa00,roughness:.35,metalness:.45}));h.position.y=-2;bg.add(h);
  const co=new THREE.Mesh(new THREE.TorusGeometry(2,.4,12,24),new THREE.MeshStandardMaterial({color:0xff3300,roughness:.4}));co.rotation.x=Math.PI/2;co.position.y=-.5;bg.add(co);
  const ma=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,5,8),new THREE.MeshStandardMaterial({color:0xcccccc,metalness:.8}));ma.position.y=2.5;bg.add(ma);
  const beacon=new THREE.Mesh(new THREE.SphereGeometry(.35,12,12),new THREE.MeshBasicMaterial({color:0x00ffaa}));beacon.position.y=5;bg.add(beacon);
  const rg=new THREE.RingGeometry(2.5,3.2,32);rg.rotateX(-Math.PI/2);
  const ring=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({color:0x00e5ff,transparent:true,opacity:.45,side:THREE.DoubleSide}));ring.position.y=.2;bg.add(ring);
  bg.userData={...d,isArgoBuoy:true,beacon,ring};sensorGrp.add(bg);buoys.push(bg);
});

// State
let targetY=80,timeIndex=0,isPlaying=false,playTimer=null,cameraMode="ORBIT",pointerLocked=false;
const fpsKeys={},raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
const layers={surface:true,volume:true,grid:true,particles:true,seabed:true,sensors:true};

// HUD bindings
$("dslide").addEventListener("input",e=>{targetY=parseFloat(e.target.value);syncQ(targetY);if(cameraMode==="ORBIT")controls.target.y=Math.min(targetY-40,-20);});
document.querySelectorAll(".qb").forEach(b=>b.addEventListener("click",()=>{const a=parseFloat(b.dataset.alt);targetY=a;$("dslide").value=a;syncQ(a);if(cameraMode==="ORBIT")controls.target.y=Math.min(a-40,-20);}));
function syncQ(v){document.querySelectorAll(".qb").forEach(b=>b.classList.toggle("act",parseFloat(b.dataset.alt)===v));}
$("m-orb").addEventListener("click",()=>{cameraMode="ORBIT";controls.enabled=true;document.exitPointerLock?.();pointerLocked=false;$("m-orb").classList.add("act");$("m-fps").classList.remove("act");});
$("m-fps").addEventListener("click",()=>{cameraMode="FPS";controls.enabled=false;camera.rotation.order="YXZ";renderer.domElement.requestPointerLock();$("m-fps").classList.add("act");$("m-orb").classList.remove("act");});
document.querySelectorAll(".lbtn").forEach(b=>b.addEventListener("click",()=>{
  const k=b.dataset.layer;layers[k]=!layers[k];const a=layers[k];b.classList.toggle("act",a);
  if(k==="surface")surfMesh.visible=a;else if(k==="volume")volGrp.visible=a;else if(k==="grid")gridGrp.visible=a;
  else if(k==="particles")pMesh.visible=a;else if(k==="seabed"){sbMesh.visible=a;sbWire.visible=a;}else if(k==="sensors")sensorGrp.visible=a;
}));
$("tpb").addEventListener("click",()=>{isPlaying=!isPlaying;if(isPlaying)playTimer=setInterval(()=>{timeIndex=(timeIndex+1)%40;},800);else clearInterval(playTimer);});
$("tslide").addEventListener("input",e=>{timeIndex=parseInt(e.target.value);});
$("mcls").addEventListener("click",()=>$("modal").classList.remove("open"));
$("dz").addEventListener("click",()=>$("dfi").click());
$("dfi").addEventListener("change",e=>{if(e.target.files[0]){$("mst").textContent="FILE: "+e.target.files[0].name.slice(0,16).toUpperCase();}});
$("dz").addEventListener("dragover",e=>{e.preventDefault();$("dz").style.borderColor="var(--glow)";});
$("dz").addEventListener("dragleave",()=>$("dz").style.borderColor="");
$("dz").addEventListener("drop",e=>{e.preventDefault();$("dz").style.borderColor="";});
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
window.addEventListener("keydown",e=>fpsKeys[e.code]=true);
window.addEventListener("keyup",e=>fpsKeys[e.code]=false);
document.addEventListener("pointerlockchange",()=>{pointerLocked=document.pointerLockElement===renderer.domElement;});
document.addEventListener("mousemove",e=>{if(!pointerLocked)return;camera.rotation.y-=e.movementX*.002;camera.rotation.x-=e.movementY*.002;camera.rotation.x=Math.max(-Math.PI/2+.05,Math.min(Math.PI/2-.05,camera.rotation.x));});
window.addEventListener("click",e=>{
  if(cameraMode==="FPS")return;
  const rect=renderer.domElement.getBoundingClientRect();
  mouse.x=((e.clientX-rect.left)/rect.width)*2-1;mouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(mouse,camera);
  const hits=raycaster.intersectObjects(sensorGrp.children,true);
  if(hits.length){let root=hits[0].object;while(root.parent&&root.parent!==sensorGrp)root=root.parent;if(root.userData?.isArgoBuoy)showModal(root.userData);}
});
function showModal(d){$("m-name").textContent=d.name;$("m-id").textContent="ID: "+d.id;$("m-coords").textContent=d.lat+", "+d.lon;$("m-dep").textContent=d.depthMeters+" m";$("m-tmp").textContent=d.temp;$("m-sal").textContent=d.salinity;$("m-bat").textContent=d.battery;$("m-stat").textContent=d.status;$("m-cyc").textContent=d.cycle+" cycles";const chips=$("m-sens");chips.innerHTML="";d.sensors.split("+").forEach(s=>{const c=document.createElement("div");c.className="sch";c.textContent=s.trim();chips.appendChild(c);});$("modal").classList.add("open");}
setInterval(()=>{const e=$("clk");if(e)e.textContent=new Date().toUTCString().replace("GMT","UTC");},1000);
$("clk").textContent=new Date().toUTCString().replace("GMT","UTC");

// Canvas 2D
const tcCtx=$("tc-canvas").getContext("2d");
const mmCtx=$("mmc").getContext("2d");
function drawThermo(cy){
  const cv=$("tc-canvas"),w=cv.width,h=cv.height;
  tcCtx.clearRect(0,0,w,h);
  const bg=tcCtx.createLinearGradient(0,0,0,h);bg.addColorStop(0,"rgba(0,200,180,.08)");bg.addColorStop(.35,"rgba(0,80,200,.12)");bg.addColorStop(1,"rgba(0,10,40,.25)");
  tcCtx.fillStyle=bg;tcCtx.fillRect(0,0,w,h);
  tcCtx.fillStyle="rgba(255,160,0,.07)";tcCtx.fillRect(0,0,w,h*.32);
  tcCtx.fillStyle="rgba(56,189,248,.05)";tcCtx.fillRect(0,h*.32,w,h*.33);
  tcCtx.fillStyle="rgba(80,0,200,.06)";tcCtx.fillRect(0,h*.65,w,h*.35);
  tcCtx.font="7px monospace";tcCtx.fillStyle="rgba(245,158,11,.7)";tcCtx.fillText("MIXED LAYER",4,13);
  tcCtx.fillStyle="rgba(56,189,248,.7)";tcCtx.fillText("THERMOCLINE",4,h*.32+13);
  tcCtx.fillStyle="rgba(130,80,255,.7)";tcCtx.fillText("DEEP WATER",4,h*.65+13);
  tcCtx.beginPath();
  for(let py=0;py<h;py++){const dr=py/h,sig=1/(1+Math.exp((dr-.32)/.07)),temp=28.5*sig+4.8*(1-sig),tx=8+((temp-4.8)/(28.5-4.8))*(w-16);if(py===0)tcCtx.moveTo(tx,py);else tcCtx.lineTo(tx,py);}
  const gr=tcCtx.createLinearGradient(0,0,0,h);gr.addColorStop(0,"#f59e0b");gr.addColorStop(.35,"#38bdf8");gr.addColorStop(1,"#6d28d9");tcCtx.strokeStyle=gr;tcCtx.lineWidth=2.5;tcCtx.stroke();
  const dep=cy<0?Math.abs(cy):0,py=(dep/480)*h;
  tcCtx.strokeStyle="rgba(255,255,255,.7)";tcCtx.lineWidth=1;tcCtx.setLineDash([3,3]);tcCtx.beginPath();tcCtx.moveTo(0,py);tcCtx.lineTo(w,py);tcCtx.stroke();tcCtx.setLineDash([]);
  tcCtx.fillStyle="#fff";tcCtx.beginPath();tcCtx.arc(8,py,3,0,Math.PI*2);tcCtx.fill();
  tcCtx.font="7px monospace";tcCtx.fillStyle="rgba(148,163,184,.8)";tcCtx.textAlign="right";
  [["0m",2],["100m",h*.208],["200m",h*.416],["300m",h*.625],["480m",h-2]].forEach(([l,y])=>tcCtx.fillText(l,w-1,y+7));
  tcCtx.textAlign="left";
}
function drawMinimap(cy){
  const w=140,h=104;mmCtx.clearRect(0,0,w,h);
  mmCtx.fillStyle="rgba(6,14,26,.95)";mmCtx.fillRect(0,0,w,h);
  mmCtx.fillStyle="rgba(0,100,180,.25)";mmCtx.fillRect(0,0,w,h);
  mmCtx.beginPath();mmCtx.moveTo(0,0);mmCtx.lineTo(22,0);mmCtx.lineTo(28,h*.35);mmCtx.lineTo(20,h*.55);mmCtx.lineTo(10,h*.75);mmCtx.lineTo(0,h);mmCtx.closePath();mmCtx.fillStyle="rgba(56,120,60,.5)";mmCtx.fill();
  mmCtx.strokeStyle="rgba(56,189,248,.6)";mmCtx.lineWidth=1.2;mmCtx.setLineDash([3,2]);mmCtx.strokeRect(30,10,w-38,h-20);mmCtx.setLineDash([]);
  [{x:42,y:26,c:"#10b981"},{x:86,y:57,c:"#38bdf8"},{x:53,y:73,c:"#f59e0b"}].forEach(b=>{mmCtx.beginPath();mmCtx.arc(b.x,b.y,3,0,Math.PI*2);mmCtx.fillStyle=b.c;mmCtx.fill();mmCtx.globalAlpha=.35;mmCtx.strokeStyle=b.c;mmCtx.lineWidth=1;mmCtx.beginPath();mmCtx.arc(b.x,b.y,6,0,Math.PI*2);mmCtx.stroke();mmCtx.globalAlpha=1;});
  mmCtx.font="8px sans-serif";mmCtx.fillStyle="#fff";mmCtx.fillText("C",w*.62,cy<0?h*.52:h*.32);
  mmCtx.font="6px monospace";mmCtx.fillStyle="rgba(148,163,184,.7)";mmCtx.fillText("68E",30,h-2);mmCtx.fillText("74E",w-20,h-2);
}

// Render loop
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const t=clock.getElapsedTime();
  camera.position.y+=(targetY-camera.position.y)*.04;
  if(cameraMode==="FPS"&&pointerLocked){
    const mv=new THREE.Vector3();
    if(fpsKeys["KeyW"])mv.z-=1;if(fpsKeys["KeyS"])mv.z+=1;if(fpsKeys["KeyA"])mv.x-=1;if(fpsKeys["KeyD"])mv.x+=1;if(fpsKeys["Space"])mv.y+=1;if(fpsKeys["ShiftLeft"])mv.y-=1;
    if(mv.lengthSq()>0){mv.normalize().applyQuaternion(camera.quaternion);camera.position.addScaledVector(mv,2.5);}
    camera.position.y=Math.max(-465,Math.min(200,camera.position.y));
  }
  const cy=camera.position.y;
  if(cy<0){const d=Math.abs(cy)/480;scene.background.setRGB(THREE.MathUtils.lerp(.008,.003,d),THREE.MathUtils.lerp(.04,.01,d),THREE.MathUtils.lerp(.09,.04,d));scene.fog.near=THREE.MathUtils.lerp(90,60,d);scene.fog.far=THREE.MathUtils.lerp(460,380,d);ambLight.intensity=THREE.MathUtils.lerp(.65,.18,d);sunLight.intensity=THREE.MathUtils.lerp(1.2,0,d);uwaLight.intensity=THREE.MathUtils.lerp(0,.7,d);}
  else{scene.background.set(0x060e1a);scene.fog.near=600;scene.fog.far=2200;ambLight.intensity=.65;sunLight.intensity=1.2;uwaLight.intensity=0;}
  sUni.uTime.value=t;
  slices.forEach(s=>{s.position.y=s.userData.baseY+Math.sin(t*s.userData.spd+s.userData.ph)*1.6;});
  pUni.uTime.value=t;
  buoys.forEach((b,i)=>{b.position.y=Math.sin(t*1.8+i*1.4)*.7;b.rotation.z=Math.cos(t*1.4+i*.8)*.08;if(b.userData.ring){const rs=1+(Math.sin(t*3+i)*.5+.5)*1.5;b.userData.ring.scale.setScalar(rs);b.userData.ring.material.opacity=Math.max(.1,.6-(rs-1)*.35);}if(b.userData.beacon)b.userData.beacon.material.color.setHex(Math.sin(t*5+i)>0?0x00ffaa:0x003322);});
  if(cameraMode==="ORBIT")controls.update();
  const tel=getTelemetry(cy,timeIndex);
  const as=cy>=0?"+":" ";set("hd-alt",as+Math.abs(Math.round(cy)).toString().padStart(3,"0")+" m");
  set("hd-dep",tel.dep.toString().padStart(3,"0")+" m");
  set("hd-tmp",tel.temp+" \u00B0C");
  set("hd-vel",tel.vel+" kn");
  set("hd-sal",tel.sal+" PSU");
  set("hd-prs",tel.pres+" bar");
  set("hd-wav",tel.waveHeight+" m");
  set("hd-per",tel.wavePeriod+" s");
  $("pd").textContent=cy<0?"DEPTH: "+Math.abs(Math.round(cy))+" m":"ALT: +"+Math.round(cy)+" m";
  $("pt").textContent=tel.temp+" \u00B0C";
  const np=1-(parseFloat(tel.temp)-4.8)/(29.5-4.8);$("cbn").style.top=Math.max(0,Math.min(100,np*100))+"%";
  $("awarn").style.opacity=tel.shadow?"1":".3";
  const hrs=timeIndex*6,days=Math.floor(hrs/24),hh=hrs%24;set("tdisplay","T+"+days.toString().padStart(2,"0")+"d "+hh.toString().padStart(2,"0")+"h");
  $("tslide").value=timeIndex;$("tpb").textContent=isPlaying?"|| ":">";
  drawThermo(cy);drawMinimap(cy);
  renderer.render(scene,camera);
}
// ==========================================
// 2D MYOCEAN PRO GIS INTERACTIVE MODULE
// ==========================================
let map2D = null;
let sstLayerGroup = null;
let currentsLayerGroup = null;
let buoysLayerGroup = null;
let selectionRect = null;
let selectedBounds = [[16.8, 69.8], [20.4, 73.2]];

function init2DMap() {
  if (typeof L === "undefined") {
    setTimeout(init2DMap, 300);
    return;
  }
  const mapContainer = $("leaflet-map");
  if (!mapContainer) return;

  map2D = L.map("leaflet-map", {
    center: [18.6, 71.5],
    zoom: 6,
    minZoom: 4,
    maxZoom: 12,
    zoomControl: true,
    attributionControl: false
  });

  // High-performance Dark Ocean Basemap
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19
  }).addTo(map2D);

  sstLayerGroup = L.layerGroup().addTo(map2D);
  currentsLayerGroup = L.layerGroup().addTo(map2D);
  buoysLayerGroup = L.layerGroup().addTo(map2D);

  // 1. Generate 2D Sea Surface Temperature (SST) Layer
  const lats = [14, 16, 18, 20, 22, 24];
  const lons = [66, 68, 70, 72, 74, 76];
  for (let i = 0; i < lats.length - 1; i++) {
    for (let j = 0; j < lons.length - 1; j++) {
      const lat1 = lats[i], lat2 = lats[i+1];
      const lon1 = lons[j], lon2 = lons[j+1];
      const latMid = (lat1 + lat2) / 2;
      const tVal = 29.8 - (latMid - 14) * 0.45 + (Math.sin(lon1 * 0.5) * 0.4);
      let col = "#ff3b30";
      if (tVal < 26.8) col = "#00c8ff";
      else if (tVal < 27.8) col = "#00e676";
      else if (tVal < 28.6) col = "#ffdd00";
      else if (tVal < 29.2) col = "#ff7700";

      const poly = L.rectangle([[lat1, lon1], [lat2, lon2]], {
        color: "rgba(56,189,248,0.15)",
        weight: 1,
        fillColor: col,
        fillOpacity: 0.38
      });
      poly.bindTooltip(`<div style="font-family:'JetBrains Mono',monospace;font-size:11px"><b>SST:</b> ${tVal.toFixed(1)} &deg;C<br><span style="color:#94a3b8">Arabian Sea Grid (${lat1}&deg;N, ${lon1}&deg;E)</span></div>`, {sticky: true});
      sstLayerGroup.addLayer(poly);
    }
  }

  // 2. Generate 2D Current Vector Direction & Velocity Arrows
  const arrowPoints = [
    [15.5, 68.2, 0.75, 45], [17.0, 69.5, 0.95, 60], [18.8, 70.8, 0.82, 90],
    [20.5, 71.2, 0.65, 120], [16.2, 72.4, 1.15, 330], [18.2, 73.1, 0.90, 315],
    [19.5, 72.8, 0.70, 300], [21.8, 69.2, 0.55, 110], [15.0, 70.5, 1.05, 50],
    [17.5, 68.0, 0.60, 40], [19.2, 67.5, 0.45, 70], [21.0, 68.0, 0.50, 95]
  ];
  arrowPoints.forEach(([lat, lon, speed, angle]) => {
    const arrowIcon = L.divIcon({
      className: "custom-arrow-icon",
      html: `<div style="transform:rotate(${angle}deg);color:#38bdf8;font-size:17px;text-shadow:0 0 8px #00e5ff;font-weight:bold;line-height:1;cursor:pointer">&rarr;</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
    const m = L.marker([lat, lon], {icon: arrowIcon});
    m.bindTooltip(`<div style="font-family:'JetBrains Mono',monospace;font-size:11px"><b>Current:</b> ${speed} kn<br><b>Flow Direction:</b> ${angle}&deg;</div>`, {sticky: true});
    currentsLayerGroup.addLayer(m);
  });

  // 3. ARGO Float In-Situ Buoys on 2D Map
  const buoys2D = [
    {id: "ARGO-IND-6902781", name: "Argo Float #6902781", lat: 18.42, lon: 71.18, temp: "27.8 &deg;C", dep: "18.5m", status: "OPTIMAL"},
    {id: "ARGO-IND-6902782", name: "Argo Float #6902782", lat: 16.85, lon: 73.04, temp: "25.1 &deg;C", dep: "45.0m", status: "OPTIMAL"},
    {id: "ARGO-IND-6902783", name: "Argo Float #6902783", lat: 19.95, lon: 69.45, temp: "15.6 &deg;C", dep: "120.0m", status: "TRANSMITTING"}
  ];
  buoys2D.forEach(b => {
    const buoyIcon = L.divIcon({
      className: "buoy-marker",
      html: `<div style="background:#ffaa00;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 12px #ffaa00;cursor:pointer"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
    const bm = L.marker([b.lat, b.lon], {icon: buoyIcon});
    bm.bindPopup(`
      <div style="font-family:'Plus Jakarta Sans',sans-serif;padding:6px;min-width:180px">
        <b style="color:#38bdf8;font-size:13px">${b.name}</b><br>
        <span style="font-size:10px;color:#94a3b8">ID: ${b.id}</span>
        <hr style="border:0;border-top:1px solid rgba(56,189,248,.3);margin:6px 0">
        <div style="font-size:11px;line-height:1.7;color:#f1f5f9">
          <b>Coordinates:</b> ${b.lat}&deg;N, ${b.lon}&deg;E<br>
          <b>Live Depth:</b> ${b.dep}<br>
          <b>Surface Temp:</b> ${b.temp}<br>
          <b>Status:</b> <span style="color:#10b981;font-weight:700">${b.status}</span>
        </div>
      </div>
    `);
    buoysLayerGroup.addLayer(bm);
  });

  // 4. Region Selection Bounding Box (Click on map to pick target volume)
  selectionRect = L.rectangle(selectedBounds, {
    color: "#38bdf8",
    weight: 2.5,
    dashArray: "6, 6",
    fillColor: "#38bdf8",
    fillOpacity: 0.16
  }).addTo(map2D);

  updateCoordsDisplay(selectedBounds);

  map2D.on("click", function(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    const dLat = 1.8, dLng = 1.7;
    selectedBounds = [
      [Math.max(10, lat - dLat), Math.max(60, lng - dLng)],
      [Math.min(25, lat + dLat), Math.min(78, lng + dLng)]
    ];
    selectionRect.setBounds(selectedBounds);
    updateCoordsDisplay(selectedBounds);
  });

  // Layer Toggles
  document.querySelectorAll(".layer2d-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const lyr = btn.dataset.layer2d;
      btn.classList.toggle("active");
      const isActive = btn.classList.contains("active");
      if (lyr === "sst") {
        if (isActive) map2D.addLayer(sstLayerGroup); else map2D.removeLayer(sstLayerGroup);
      } else if (lyr === "currents") {
        if (isActive) map2D.addLayer(currentsLayerGroup); else map2D.removeLayer(currentsLayerGroup);
      } else if (lyr === "buoys") {
        if (isActive) map2D.addLayer(buoysLayerGroup); else map2D.removeLayer(buoysLayerGroup);
      }
      updateActiveLayerLabel();
    });
  });
}

function updateCoordsDisplay(bounds) {
  const sLat = bounds[0][0].toFixed(1), nLat = bounds[1][0].toFixed(1);
  const wLng = bounds[0][1].toFixed(1), eLng = bounds[1][1].toFixed(1);
  const txt = `${sLat}\u00B0N - ${nLat}\u00B0N, ${wLng}\u00B0E - ${eLng}\u00B0E`;
  const el = $("m2d-coords");
  if (el) el.textContent = txt;
}

function updateActiveLayerLabel() {
  const activeNames = [];
  document.querySelectorAll(".layer2d-toggle.active").forEach(b => {
    activeNames.push(b.querySelector("span:last-child").textContent);
  });
  const el = $("lbl-active-layer");
  if (el) el.textContent = activeNames.join(" + ") || "BASEMAP ONLY";
}

function switchTo2D() {
  const overlay = $("map-2d-overlay");
  if (overlay) overlay.classList.remove("hidden");
  $("btn-mode-2d")?.classList.add("active");
  $("btn-mode-3d")?.classList.remove("active");
  if (map2D) {
    setTimeout(() => {
      map2D.invalidateSize();
    }, 200);
  }
}

function switchTo3D() {
  const overlay = $("map-2d-overlay");
  if (overlay) overlay.classList.add("hidden");
  $("btn-mode-3d")?.classList.add("active");
  $("btn-mode-2d")?.classList.remove("active");
  // Smooth descent into 3D volume
  targetY = 80;
  camera.position.set(180, 200, 260);
  controls.target.set(0, -80, 0);
  controls.update();
}

$("btn-mode-2d")?.addEventListener("click", switchTo2D);
$("btn-mode-3d")?.addEventListener("click", switchTo3D);
$("btn-launch-3d")?.addEventListener("click", switchTo3D);

// Initialize 2D map on start
setTimeout(init2DMap, 500);

animate();
setTimeout(()=>{const ls=$("ls");if(ls){ls.style.opacity="0";setTimeout(()=>ls.remove(),900);}},1600);

