import os
import sys
import time
import subprocess
import json
import gzip
import numpy as np

UI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "agent-skills", "ui"))
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "raw_results", "frontend_bench.json")

def benchmark_frontend_build():
    print(f"Benchmarking Frontend Build inside {UI_DIR}...", flush=True)

    build_durations_s = []
    NUM_RUNS = 5

    for i in range(NUM_RUNS):
        t0 = time.perf_counter()
        proc = subprocess.run(
            ["npm.cmd", "run", "build"],
            cwd=UI_DIR,
            capture_output=True,
            text=True,
            shell=True
        )
        t1 = time.perf_counter()
        duration_s = t1 - t0

        if proc.returncode != 0:
            print(f"Build failed on run {i+1}:\n{proc.stderr}", flush=True)
            return

        build_durations_s.append(duration_s)
        print(f"Run {i+1}/{NUM_RUNS}: Build completed in {duration_s:.2f}s", flush=True)

    dur_arr = np.array(build_durations_s)

    # Inspect dist/assets
    dist_assets_dir = os.path.join(UI_DIR, "dist", "assets")
    bundle_files = []
    total_raw_bytes = 0
    total_gzip_bytes = 0

    if os.path.exists(dist_assets_dir):
        for f in os.listdir(dist_assets_dir):
            fpath = os.path.join(dist_assets_dir, f)
            if os.path.isfile(fpath):
                raw_size = os.path.getsize(fpath)
                with open(fpath, "rb") as bf:
                    gzip_size = len(gzip.compress(bf.read()))

                total_raw_bytes += raw_size
                total_gzip_bytes += gzip_size

                ext = os.path.splitext(f)[1]
                bundle_files.append({
                    "file": f,
                    "type": "javascript" if ext == ".js" else "stylesheet" if ext == ".css" else "other",
                    "raw_bytes": raw_size,
                    "raw_kb": round(raw_size / 1024, 2),
                    "gzip_bytes": gzip_size,
                    "gzip_kb": round(gzip_size / 1024, 2)
                })

    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "runs_count": NUM_RUNS,
        "build_duration_seconds": {
            "mean": float(np.mean(dur_arr)),
            "median": float(np.median(dur_arr)),
            "p95": float(np.percentile(dur_arr, 95)),
            "min": float(np.min(dur_arr)),
            "max": float(np.max(dur_arr))
        },
        "bundle_totals": {
            "total_raw_bytes": total_raw_bytes,
            "total_raw_kb": round(total_raw_bytes / 1024, 2),
            "total_gzip_bytes": total_gzip_bytes,
            "total_gzip_kb": round(total_gzip_bytes / 1024, 2)
        },
        "bundle_artifacts": bundle_files
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n=== FRONTEND BENCHMARK COMPLETE ===", flush=True)
    print(f"Build Time: Mean={summary['build_duration_seconds']['mean']:.2f}s | Median={summary['build_duration_seconds']['median']:.2f}s | p95={summary['build_duration_seconds']['p95']:.2f}s")
    print(f"Total Bundle: {summary['bundle_totals']['total_raw_kb']} KB ({summary['bundle_totals']['total_gzip_kb']} KB gzipped)")
    for b in bundle_files:
        print(f" - {b['file']}: {b['raw_kb']} KB (gzip: {b['gzip_kb']} KB)")

if __name__ == "__main__":
    benchmark_frontend_build()
