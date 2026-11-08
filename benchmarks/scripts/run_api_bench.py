import subprocess
import time
import os
import sys
import json
import asyncio
import httpx
import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "agent-skills"))
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "raw_results", "api_bench.json")
BASE_URL = "http://127.0.0.1:8008"

async def benchmark_endpoint(client, url, method="GET", json_body=None, count=30, concurrency=1):
    latencies = []
    errors = 0
    sem = asyncio.Semaphore(concurrency)

    async def single_req():
        nonlocal errors
        async with sem:
            t0 = time.perf_counter()
            try:
                if method == "POST":
                    resp = await client.post(url, json=json_body, timeout=5.0)
                else:
                    resp = await client.get(url, timeout=5.0)
                t1 = time.perf_counter()
                if resp.status_code == 200:
                    latencies.append((t1 - t0) * 1000)
                else:
                    errors += 1
            except Exception as e:
                errors += 1

    t_start = time.perf_counter()
    tasks = [asyncio.create_task(single_req()) for _ in range(count)]
    await asyncio.gather(*tasks)
    total_time = time.perf_counter() - t_start

    arr = np.array(latencies) if latencies else np.array([0.0])
    return {
        "count": count,
        "concurrency": concurrency,
        "successful": len(latencies),
        "errors": errors,
        "error_rate_pct": round((errors / count) * 100, 2),
        "total_duration_s": round(total_time, 2),
        "throughput_req_per_sec": round(len(latencies) / total_time, 2) if total_time > 0 else 0,
        "latency_ms": {
            "mean": float(np.mean(arr)),
            "median": float(np.median(arr)),
            "p90": float(np.percentile(arr, 90)),
            "p95": float(np.percentile(arr, 95)),
            "p99": float(np.percentile(arr, 99)),
            "min": float(np.min(arr)),
            "max": float(np.max(arr))
        }
    }

async def run_api_suite():
    print("Launching FastAPI server on port 8008...", flush=True)
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    server_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "api:app", "--host", "127.0.0.1", "--port", "8008"],
        cwd=PROJECT_ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        env=env
    )

    time.sleep(3)  # wait for uvicorn to boot

    results = {}
    async with httpx.AsyncClient() as client:
        # Check health / root
        try:
            health = await client.get(f"{BASE_URL}/api/benchmarks", timeout=5.0)
            print(f"Server check: /api/benchmarks returned {health.status_code}", flush=True)
        except Exception as e:
            print(f"Failed to connect to server: {e}", flush=True)
            server_proc.kill()
            return

        # Warmup
        await client.post(f"{BASE_URL}/api/skills/search", json={"query": "algorithm"})

        # 1. Benchmark /api/skills/search (Fast Text Match)
        print("Testing /api/skills/search (Concurrency: 1, 5, 10)...", flush=True)
        results["search_c1"] = await benchmark_endpoint(
            client, f"{BASE_URL}/api/skills/search", method="POST",
            json_body={"query": "algorithm"}, count=30, concurrency=1
        )
        results["search_c5"] = await benchmark_endpoint(
            client, f"{BASE_URL}/api/skills/search", method="POST",
            json_body={"query": "algorithm"}, count=30, concurrency=5
        )
        results["search_c10"] = await benchmark_endpoint(
            client, f"{BASE_URL}/api/skills/search", method="POST",
            json_body={"query": "algorithm"}, count=30, concurrency=10
        )

        # 2. Benchmark /api/patterns/candidates (MongoDB queue read)
        print("Testing /api/patterns/candidates (Concurrency: 5)...", flush=True)
        results["candidates_c5"] = await benchmark_endpoint(
            client, f"{BASE_URL}/api/patterns/candidates", method="GET",
            count=30, concurrency=5
        )

        # 3. Benchmark /api/benchmarks
        print("Testing /api/benchmarks (Concurrency: 5)...", flush=True)
        results["benchmarks_c5"] = await benchmark_endpoint(
            client, f"{BASE_URL}/api/benchmarks", method="GET",
            count=30, concurrency=5
        )

    server_proc.terminate()
    try:
        server_proc.wait(timeout=3)
    except:
        server_proc.kill()

    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "base_url": BASE_URL,
        "results": results
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n=== API BENCHMARK COMPLETE ===", flush=True)
    for name, r in results.items():
        print(f"[{name}] Throughput: {r['throughput_req_per_sec']} req/s | p50: {r['latency_ms']['median']:.2f}ms | p95: {r['latency_ms']['p95']:.2f}ms | Errors: {r['error_rate_pct']}%")

if __name__ == "__main__":
    asyncio.run(run_api_suite())
