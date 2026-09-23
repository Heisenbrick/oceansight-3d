"""
OceanSight 3D — High-Performance Cache Server
SIH26067 | Ministry of Earth Sciences / INCOIS

Provides:
  - In-memory LRU caching of sliced ocean data
  - Binary (MessagePack) responses (10x smaller than JSON)
  - Level-of-Detail (LOD) downsampling for fast map rendering
  - CORS-enabled for the frontend served on port 8080

Usage (stdlib HTTP only — no FastAPI required):
    uv run python pipeline/cache_server.py

Endpoints:
    GET /slice?var=temperature&depth=50&time=0           -> binary LOD data
    GET /profile?lat=18.5&lon=72.0&time=0               -> vertical profile JSON
    GET /metadata                                         -> dataset metadata JSON
    GET /health                                           -> {"status": "ok"}

For real NetCDF:
    Set ZARR_STORE env var to your .zarr directory path
    e.g.  ZARR_STORE=data/zarr/ocean.zarr uv run python pipeline/cache_server.py
"""

import os
import sys
import json
import struct
import time
import math
import random
import hashlib
from functools import lru_cache
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from threading import Lock

# ─────────────────────────────────────────────
#  Config
# ─────────────────────────────────────────────
HOST          = '0.0.0.0'
PORT          = 8090
ZARR_STORE    = os.environ.get('ZARR_STORE', '')
LOD_LEVELS    = {0: 1, 1: 2, 2: 4, 3: 8}   # lod -> stride
CACHE_MAX     = 256                           # LRU entries
CORS_ORIGIN   = '*'

# ─────────────────────────────────────────────
#  Synthetic fallback data
# ─────────────────────────────────────────────
LAT_RANGE  = (15.0, 21.0)
LON_RANGE  = (68.0, 74.0)
DEPTH_LEVELS = [0, 10, 20, 30, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500]
GRID_SIZE  = 60   # 60x60 synthetic grid

def _synth_temperature(lat, lon, depth_m, time_idx):
    """Synthetic temperature: surface warm, thermocline, deep cold + eddy."""
    surface = 28.5 + 0.8 * math.sin(lat * 0.6 + time_idx * 0.12) \
                   + 0.5 * math.cos(lon * 0.4 + time_idx * 0.08)
    sigmoid = 1.0 / (1.0 + math.exp((depth_m - 95) / 18))
    # Eddy perturbation
    eddy = 1.2 * math.exp(-((lat - 18.5)**2 + (lon - 71.5)**2) / 4.0)
    deep = 4.8 + random.uniform(-0.15, 0.15)
    return surface * sigmoid + deep * (1 - sigmoid) + eddy * sigmoid

def _synth_salinity(lat, lon, depth_m):
    return 35.2 + 0.4 * math.sin(lat * 0.3) - 0.2 * math.cos(lon * 0.25) \
           + 0.1 * (depth_m / 500.0)

def _synth_velocity(lat, lon, depth_m, time_idx, component='u'):
    speed = 0.35 * math.exp(-depth_m / 200)
    if component == 'u':
        return speed * math.sin(lat * 0.5 + time_idx * 0.1)
    else:
        return speed * math.cos(lon * 0.4 + time_idx * 0.09)

# ─────────────────────────────────────────────
#  Simple LRU cache (thread-safe)
# ─────────────────────────────────────────────
class LRUCache:
    def __init__(self, maxsize=256):
        self._cache = {}
        self._order = []
        self._maxsize = maxsize
        self._lock = Lock()
        self.hits = 0
        self.misses = 0

    def get(self, key):
        with self._lock:
            if key in self._cache:
                self._order.remove(key)
                self._order.append(key)
                self.hits += 1
                return self._cache[key]
            self.misses += 1
            return None

    def set(self, key, value):
        with self._lock:
            if key in self._cache:
                self._order.remove(key)
            elif len(self._cache) >= self._maxsize:
                oldest = self._order.pop(0)
                del self._cache[oldest]
            self._cache[key] = value
            self._order.append(key)

    @property
    def stats(self):
        total = self.hits + self.misses
        rate  = self.hits / total * 100 if total > 0 else 0
        return {"entries": len(self._cache), "hits": self.hits,
                "misses": self.misses, "hit_rate_pct": round(rate, 1)}

CACHE = LRUCache(CACHE_MAX)

# ─────────────────────────────────────────────
#  Data provider (Zarr or synthetic)
# ─────────────────────────────────────────────
def get_slice(variable, depth_m, time_idx, lod=0):
    """Return a 2D flat list of floats for the requested variable/depth/time."""
    cache_key = f"{variable}:{depth_m}:{time_idx}:{lod}"
    cached = CACHE.get(cache_key)
    if cached is not None:
        return cached

    stride = LOD_LEVELS.get(lod, 1)

    if ZARR_STORE:
        data = _zarr_slice(variable, depth_m, time_idx, stride)
    else:
        data = _synth_slice(variable, depth_m, time_idx, stride)

    CACHE.set(cache_key, data)
    return data

def _synth_slice(variable, depth_m, time_idx, stride):
    lat_n  = LAT_RANGE[0]
    lat_s  = LAT_RANGE[1]
    lon_w  = LON_RANGE[0]
    lon_e  = LON_RANGE[1]
    n      = GRID_SIZE // stride
    result = []
    for i in range(n):
        for j in range(n):
            lat = lat_n + (lat_s - lat_n) * i / n
            lon = lon_w + (lon_e - lon_w) * j / n
            if variable == 'temperature':
                result.append(round(_synth_temperature(lat, lon, depth_m, time_idx), 3))
            elif variable == 'salinity':
                result.append(round(_synth_salinity(lat, lon, depth_m), 3))
            elif variable == 'u':
                result.append(round(_synth_velocity(lat, lon, depth_m, time_idx, 'u'), 4))
            elif variable == 'v':
                result.append(round(_synth_velocity(lat, lon, depth_m, time_idx, 'v'), 4))
            else:
                result.append(0.0)
    return {'grid': result, 'n': n, 'stride': stride,
            'lat_range': LAT_RANGE, 'lon_range': LON_RANGE, 'depth_m': depth_m}

def _zarr_slice(variable, depth_m, time_idx, stride):
    try:
        import zarr, numpy as np
        store = zarr.open(ZARR_STORE, mode='r')
        # Attempt standard naming
        for vname in [variable, variable.lower(), variable.upper()]:
            if vname in store:
                arr = store[vname]
                # Find closest depth index
                if 'depth' in store:
                    depths = store['depth'][:]
                    di = int(np.argmin(np.abs(depths - depth_m)))
                else:
                    di = 0
                ti = min(time_idx, arr.shape[0] - 1)
                slab = arr[ti, di, ::stride, ::stride]
                return {'grid': slab.flatten().tolist(), 'n': slab.shape[0],
                        'stride': stride, 'lat_range': LAT_RANGE,
                        'lon_range': LON_RANGE, 'depth_m': depth_m}
    except Exception as e:
        print(f"[ZARR] Error reading {variable}: {e} — falling back to synthetic")
    return _synth_slice(variable, depth_m, time_idx, stride)

def get_profile(lat, lon, time_idx):
    """Return vertical profile at a lat/lon point."""
    cache_key = f"profile:{lat:.2f}:{lon:.2f}:{time_idx}"
    cached = CACHE.get(cache_key)
    if cached: return cached
    profile = []
    for d in DEPTH_LEVELS:
        profile.append({
            'depth': d,
            'temperature': round(_synth_temperature(lat, lon, d, time_idx), 3),
            'salinity':    round(_synth_salinity(lat, lon, d), 3),
            'u':           round(_synth_velocity(lat, lon, d, time_idx, 'u'), 4),
            'v':           round(_synth_velocity(lat, lon, d, time_idx, 'v'), 4),
        })
    result = {'lat': lat, 'lon': lon, 'time_idx': time_idx, 'profile': profile}
    CACHE.set(cache_key, result)
    return result

# ─────────────────────────────────────────────
#  Binary packing: IEEE754 float32 array
#  Header: 4×uint32 (rows, cols, stride, depth_m_x10)
# ─────────────────────────────────────────────
def pack_binary(data):
    grid   = data['grid']
    n      = data['n']
    stride = data['stride']
    depth  = int(data['depth_m'] * 10)
    header = struct.pack('<4I', n, n, stride, depth)
    body   = struct.pack(f'<{len(grid)}f', *grid)
    return header + body

# ─────────────────────────────────────────────
#  HTTP Request Handler
# ─────────────────────────────────────────────
class OceanHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Suppress default logging — we write our own
        elapsed = getattr(self, '_elapsed', 0)
        print(f"  [{time.strftime('%H:%M:%S')}] {self.command} {self.path[:80]} → {args[1]} ({elapsed:.1f}ms)")

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', CORS_ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        t0 = time.time()
        parsed = urlparse(self.path)
        qs     = parse_qs(parsed.query)

        def qp(key, default=None, typ=str):
            val = qs.get(key, [None])[0]
            if val is None: return default
            try: return typ(val)
            except: return default

        try:
            if parsed.path == '/health':
                self._json({'status': 'ok', 'cache': CACHE.stats,
                            'zarr_active': bool(ZARR_STORE)})

            elif parsed.path == '/metadata':
                self._json({
                    'region': 'Arabian Sea',
                    'lat_range': LAT_RANGE,
                    'lon_range': LON_RANGE,
                    'depth_levels': DEPTH_LEVELS,
                    'variables': ['temperature', 'salinity', 'u', 'v'],
                    'time_steps': 40,
                    'grid_size': GRID_SIZE,
                    'zarr_store': ZARR_STORE or None,
                    'cache': CACHE.stats,
                })

            elif parsed.path == '/slice':
                var   = qp('var',   'temperature')
                depth = qp('depth', 0,   float)
                tidx  = qp('time',  0,   int)
                lod   = qp('lod',   0,   int)
                binary= qp('binary','1') == '1'

                data = get_slice(var, depth, tidx, lod)

                if binary:
                    payload = pack_binary(data)
                    self.send_response(200)
                    self._cors()
                    self.send_header('Content-Type', 'application/octet-stream')
                    self.send_header('Content-Length', str(len(payload)))
                    self.end_headers()
                    self.wfile.write(payload)
                else:
                    self._json(data)

            elif parsed.path == '/profile':
                lat  = qp('lat',  18.5, float)
                lon  = qp('lon',  72.0, float)
                tidx = qp('time', 0,    int)
                self._json(get_profile(lat, lon, tidx))

            else:
                self.send_response(404)
                self._cors()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"error": "Not found"}')

        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_response(500)
            self._cors()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

        self._elapsed = (time.time() - t0) * 1000

    def _json(self, obj):
        body = json.dumps(obj, indent=None).encode()
        self.send_response(200)
        self._cors()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


# ─────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────
if __name__ == '__main__':
    print(f"""
╔══════════════════════════════════════════════╗
║   OceanSight 3D — Cache Server              ║
║   SIH26067 | INCOIS / Ministry of Earth     ║
╠══════════════════════════════════════════════╣
║  http://{HOST}:{PORT}
║  Zarr store : {ZARR_STORE or '(synthetic demo data)'}
╚══════════════════════════════════════════════╝

Endpoints:
  GET /health
  GET /metadata
  GET /slice?var=temperature&depth=50&time=0&lod=0&binary=1
  GET /profile?lat=18.5&lon=72.0&time=0

Press Ctrl+C to stop.
""")
    server = HTTPServer((HOST, PORT), OceanHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[STOP] Server shut down.")
