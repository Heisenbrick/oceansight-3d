/**
 * OceanSight 3D — Custom GLSL Shaders
 * Gerstner Waves, Turbo/Jet Thermal Gradients, and Bathymetry
 */

export const OceanShaders = {
  // Gerstner Wave Vertex & Fragment Shaders
  GerstnerWave: {
    uniforms: {
      uTime: { value: 0.0 },
      uSunDirection: { value: new THREE.Vector3(0.7, 0.7, 0.0).normalize() },
      uSunColor: { value: new THREE.Color(0xfff6e5) },
      uWaterColor: { value: new THREE.Color(0x003d5c) },
      uWaterDeepColor: { value: new THREE.Color(0x020a18) },
      uWaveHeight: { value: 1.2 },
      uWaveSpeed: { value: 0.85 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWaveHeight;
      uniform float uWaveSpeed;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;

      vec3 gerstnerWave(vec4 wave, vec3 p, inout vec3 tangent, inout vec3 binormal) {
        float steepness = wave.z;
        float wavelength = wave.w;
        float k = 2.0 * 3.14159265 / wavelength;
        float c = sqrt(9.8 / k) * uWaveSpeed;
        vec2 d = normalize(wave.xy);
        float f = k * (dot(d, p.xz) - c * uTime);
        float a = (steepness / k) * uWaveHeight;

        tangent += vec3(
          -d.x * d.x * (steepness * sin(f)),
          d.x * (steepness * cos(f)),
          -d.x * d.y * (steepness * sin(f))
        );
        binormal += vec3(
          -d.x * d.y * (steepness * sin(f)),
          d.y * (steepness * cos(f)),
          -d.y * d.y * (steepness * sin(f))
        );
        return vec3(
          d.x * (a * cos(f)),
          a * sin(f),
          d.y * (a * cos(f))
        );
      }

      void main() {
        vUv = uv;
        vec3 gridPoint = position;
        vec3 tangent = vec3(1.0, 0.0, 0.0);
        vec3 binormal = vec3(0.0, 0.0, 1.0);
        vec3 p = gridPoint;

        // 4 Gerstner Wave Components for realistic open sea interference
        p += gerstnerWave(vec4(1.0, 0.2, 0.25, 45.0), gridPoint, tangent, binormal);
        p += gerstnerWave(vec4(0.6, 0.8, 0.20, 26.0), gridPoint, tangent, binormal);
        p += gerstnerWave(vec4(-0.4, 0.9, 0.15, 14.0), gridPoint, tangent, binormal);
        p += gerstnerWave(vec4(0.2, -0.9, 0.12, 8.0), gridPoint, tangent, binormal);

        vec3 normal = normalize(cross(binormal, tangent));
        vNormal = normal;

        vec4 worldPos = modelMatrix * vec4(p, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uSunDirection;
      uniform vec3 uSunColor;
      uniform vec3 uWaterColor;
      uniform vec3 uWaterDeepColor;

      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      varying vec2 vUv;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);

        // Fresnel reflection factor
        float fresnel = 0.04 + 0.96 * pow(1.0 - max(0.0, dot(viewDir, normal)), 4.0);

        // Specular highlight from sun
        vec3 halfDir = normalize(uSunDirection + viewDir);
        float spec = pow(max(0.0, dot(normal, halfDir)), 140.0) * 1.8;

        // Deep vs Shallow color mixing based on eye angle
        vec3 baseWater = mix(uWaterDeepColor, uWaterColor, dot(normal, vec3(0.0, 1.0, 0.0)));
        vec3 skyReflect = vec3(0.25, 0.65, 0.95);
        vec3 finalColor = mix(baseWater, skyReflect, fresnel * 0.7) + uSunColor * spec;

        // Translucent water surface
        gl_FragColor = vec4(finalColor, 0.88);
      }
    `
  },

  // Vertical Thermal Curtain Shader
  VerticalThermalCurtain: {
    uniforms: {
      uTime: { value: 0.0 },
      uCurtainWidth: { value: 450.0 },
      uCurtainDepth: { value: 500.0 },
      uOpacity: { value: 0.82 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vPosition;

      // 6-Stop Vibrant Turbo/Jet Scientific Colormap
      vec3 getThermalColor(float t) {
        t = clamp(t, 0.0, 1.0);
        vec3 c0 = vec3(0.04, 0.08, 0.45); // Deep Indigo
        vec3 c1 = vec3(0.08, 0.38, 0.85); // Royal Blue
        vec3 c2 = vec3(0.00, 0.85, 0.92); // Bright Cyan
        vec3 c3 = vec3(0.35, 0.92, 0.22); // Lime Green
        vec3 c4 = vec3(0.98, 0.75, 0.05); // Amber Yellow
        vec3 c5 = vec3(0.95, 0.15, 0.08); // Fiery Red

        if (t < 0.20) return mix(c0, c1, t / 0.20);
        if (t < 0.40) return mix(c1, c2, (t - 0.20) / 0.20);
        if (t < 0.60) return mix(c2, c3, (t - 0.40) / 0.20);
        if (t < 0.80) return mix(c3, c4, (t - 0.60) / 0.20);
        return mix(c4, c5, (t - 0.80) / 0.20);
      }

      void main() {
        // vUv.y: 1.0 = surface, 0.0 = deep ocean
        float depthNorm = vUv.y;

        // Sigmoid thermocline curve around depth 0.75 (approx 100m depth)
        float thermocline = 1.0 / (1.0 + exp(-(depthNorm - 0.75) * 16.0));

        // Spatial internal wave ripples
        float wave = sin(vUv.x * 18.0 + uTime * 0.8) * 0.025 +
                     cos(vUv.x * 32.0 - uTime * 0.5) * 0.015;
        float tempVal = clamp(thermocline + wave, 0.0, 1.0);

        vec3 color = getThermalColor(tempVal);

        // Subtle grid lines on curtain
        float gridY = step(0.98, fract(vUv.y * 10.0));
        float gridX = step(0.98, fract(vUv.x * 10.0));
        vec3 finalColor = mix(color, vec3(1.0), (gridX + gridY) * 0.15);

        gl_FragColor = vec4(finalColor, uOpacity);
      }
    `
  },

  // Horizontal Temperature Depth Slice Shader
  TemperatureSlice: {
    uniforms: {
      uTime: { value: 0.0 },
      uDepthRatio: { value: 0.0 },
      uOpacity: { value: 0.85 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uDepthRatio;
      uniform float uOpacity;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      vec3 getColormap(float t) {
        t = clamp(t, 0.0, 1.0);
        vec3 c0 = vec3(0.04, 0.08, 0.45);
        vec3 c1 = vec3(0.08, 0.38, 0.85);
        vec3 c2 = vec3(0.00, 0.85, 0.92);
        vec3 c3 = vec3(0.35, 0.92, 0.22);
        vec3 c4 = vec3(0.98, 0.75, 0.05);
        vec3 c5 = vec3(0.95, 0.15, 0.08);

        if (t < 0.20) return mix(c0, c1, t / 0.20);
        if (t < 0.40) return mix(c1, c2, (t - 0.20) / 0.20);
        if (t < 0.60) return mix(c2, c3, (t - 0.40) / 0.20);
        if (t < 0.80) return mix(c3, c4, (t - 0.60) / 0.20);
        return mix(c4, c5, (t - 0.80) / 0.20);
      }

      void main() {
        // Base temp from depth: Surface = 1.0 (warm), Deep = 0.0 (cold)
        float baseTemp = 1.0 - uDepthRatio;

        // Mesoscale eddy structures (warm core and cold core rings)
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);
        float eddy = sin(dist * 14.0 - uTime * 0.4) * 0.08 * (1.0 - uDepthRatio * 0.6);

        float temp = clamp(baseTemp + eddy, 0.0, 1.0);
        vec3 color = getColormap(temp);

        // Isotherm contour lines
        float contour = step(0.92, fract(temp * 12.0));
        color = mix(color, vec3(1.0), contour * 0.3);

        gl_FragColor = vec4(color, uOpacity);
      }
    `
  }
};
