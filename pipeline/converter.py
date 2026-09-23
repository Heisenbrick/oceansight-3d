"""
OceanSight 3D — NetCDF → Zarr Converter
SIH26067 | Ministry of Earth Sciences / INCOIS

Usage:
    uv run python pipeline/converter.py --input data/raw/ocean.nc --output data/zarr/ocean.zarr

Requires:
    pip install xarray zarr netcdf4 dask[array] numpy
"""

import argparse
import os
import sys
import time
import json
from pathlib import Path


def check_deps():
    """Verify required packages are importable."""
    missing = []
    for pkg in ['xarray', 'zarr', 'netCDF4', 'numpy']:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)
    if missing:
        print(f"[ERROR] Missing packages: {', '.join(missing)}")
        print("        Run: pip install xarray zarr netcdf4 dask[array] numpy")
        sys.exit(1)


def convert(input_path: str, output_path: str, chunk_time=1, chunk_depth=10,
            chunk_lat=50, chunk_lon=50, compress_level=5):
    """Convert a NetCDF file to chunked, compressed Zarr store."""
    import xarray as xr
    import numpy as np
    import zarr

    t0 = time.time()
    input_path  = Path(input_path)
    output_path = Path(output_path)

    if not input_path.exists():
        print(f"[ERROR] Input file not found: {input_path}")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"  OceanSight NetCDF → Zarr Converter")
    print(f"  Input : {input_path}")
    print(f"  Output: {output_path}")
    print(f"{'='*60}\n")

    # ── Open dataset ────────────────────────────────────────────
    print("[1/4] Opening NetCDF dataset…")
    ds = xr.open_dataset(input_path, chunks='auto', engine='netcdf4')

    # Pretty-print structure
    print(f"      Dimensions : {dict(ds.dims)}")
    print(f"      Variables  : {list(ds.data_vars)}")
    print(f"      Coordinates: {list(ds.coords)}")
    print()

    # ── Detect spatial/temporal dimension names ──────────────────
    dim_map = {}
    for dim in ds.dims:
        dl = dim.lower()
        if 'time' in dl or dl == 't':
            dim_map['time'] = dim
        elif 'depth' in dl or 'level' in dl or dl in ('z', 'lev', 'depth_t'):
            dim_map['depth'] = dim
        elif 'lat' in dl or dl == 'y':
            dim_map['lat'] = dim
        elif 'lon' in dl or dl == 'x':
            dim_map['lon'] = dim

    print(f"      Detected dim map: {dim_map}")

    # ── Build chunk dict ─────────────────────────────────────────
    chunks = {}
    if 'time'  in dim_map: chunks[dim_map['time']]  = chunk_time
    if 'depth' in dim_map: chunks[dim_map['depth']] = chunk_depth
    if 'lat'   in dim_map: chunks[dim_map['lat']]   = chunk_lat
    if 'lon'   in dim_map: chunks[dim_map['lon']]   = chunk_lon

    if chunks:
        print(f"[2/4] Re-chunking: {chunks}")
        ds = ds.chunk(chunks)
    else:
        print("[2/4] Could not detect standard dims — using auto chunking")
        ds = ds.chunk('auto')

    # ── Encoding (compression) ────────────────────────────────────
    print(f"[3/4] Configuring Blosc compression (level {compress_level})…")
    try:
        import numcodecs
        compressor = numcodecs.Blosc(cname='zstd', clevel=compress_level, shuffle=numcodecs.Blosc.BITSHUFFLE)
    except ImportError:
        print("      numcodecs not available — using zarr default compression")
        compressor = None

    encoding = {}
    for var in ds.data_vars:
        enc = {}
        if compressor:
            enc['compressor'] = compressor
        # Cast float64 → float32 to halve storage
        if ds[var].dtype == 'float64':
            enc['dtype'] = 'float32'
        if enc:
            encoding[var] = enc

    # ── Write Zarr ────────────────────────────────────────────────
    print(f"[4/4] Writing Zarr store…")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if output_path.exists():
        import shutil
        shutil.rmtree(output_path)

    ds.to_zarr(output_path, encoding=encoding, consolidated=True, mode='w')

    elapsed = time.time() - t0

    # ── Stats ─────────────────────────────────────────────────────
    input_size  = sum(f.stat().st_size for f in input_path.parent.glob('**/*') if f.is_file() and str(input_path) in str(f))
    if input_path.is_file():
        input_size = input_path.stat().st_size

    output_size = sum(f.stat().st_size for f in output_path.rglob('*') if f.is_file())

    ratio = (1 - output_size / input_size) * 100 if input_size > 0 else 0

    # Write metadata sidecar
    meta = {
        "source":       str(input_path),
        "zarr_store":   str(output_path),
        "variables":    list(ds.data_vars),
        "dims":         {k: int(v) for k, v in ds.dims.items()},
        "dim_map":      dim_map,
        "chunks":       {k: int(v) for k, v in chunks.items()},
        "input_bytes":  input_size,
        "output_bytes": output_size,
        "compression_ratio_pct": round(ratio, 1),
        "elapsed_sec":  round(elapsed, 2),
    }
    meta_path = output_path.parent / (output_path.stem + '_meta.json')
    meta_path.write_text(json.dumps(meta, indent=2))

    print(f"\n{'='*60}")
    print(f"  ✓ Conversion complete in {elapsed:.1f}s")
    print(f"  Input size : {input_size / 1e6:.1f} MB")
    print(f"  Zarr size  : {output_size / 1e6:.1f} MB  (saved {ratio:.0f}%)")
    print(f"  Metadata   : {meta_path}")
    print(f"{'='*60}\n")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='OceanSight NetCDF → Zarr Converter')
    parser.add_argument('--input',   required=True,  help='Input NetCDF file path')
    parser.add_argument('--output',  required=True,  help='Output Zarr store path')
    parser.add_argument('--chunk-time',  type=int, default=1,  help='Time chunk size (default: 1)')
    parser.add_argument('--chunk-depth', type=int, default=10, help='Depth chunk size (default: 10)')
    parser.add_argument('--chunk-lat',   type=int, default=50, help='Lat chunk size (default: 50)')
    parser.add_argument('--chunk-lon',   type=int, default=50, help='Lon chunk size (default: 50)')
    parser.add_argument('--compress',    type=int, default=5,  help='Blosc compression level 1-9 (default: 5)')

    args = parser.parse_args()
    check_deps()
    convert(
        input_path    = args.input,
        output_path   = args.output,
        chunk_time    = args.chunk_time,
        chunk_depth   = args.chunk_depth,
        chunk_lat     = args.chunk_lat,
        chunk_lon     = args.chunk_lon,
        compress_level= args.compress,
    )
