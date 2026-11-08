import json
import time
import os
import sys
import asyncio
import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "agent-skills"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
os.chdir(PROJECT_ROOT)

from skills.observer import run_observer
from skills.mongodb_store import candidates_col
import config

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "raw_results", "observer_bench.json")

TEST_CONVERSATIONS = [
    {
        "query": "Refactor this Python code to use list comprehensions, remove all comments, and keep functions pure.",
        "response": "Here is the refactored code without comments using pure functions and comprehensions: `def get_evens(nums): return [x for x in nums if x % 2 == 0]`"
    },
    {
        "query": "Format this database query output into a markdown table with columns ID, Name, and Status. Do not include markdown preamble.",
        "response": "| ID | Name | Status |\n|---|---|---|\n| 1 | Alpha | Active |\n| 2 | Beta | Inactive |"
    },
    {
        "query": "Write a bash one-liner to find all files ending in .log older than 7 days and delete them. No explanations, just code.",
        "response": "find /var/log -name '*.log' -type f -mtime +7 -delete"
    },
    {
        "query": "Summarize this bug report into exactly 3 bullet points, each under 15 words.",
        "response": "- Memory leak detected in worker thread pool.\n- High CPU spike occurs on concurrent socket disconnects.\n- Patch applied to garbage collection handler."
    },
    {
        "query": "Convert this JSON data to TypeScript interface types with camelCase keys.",
        "response": "interface UserProfile {\n  userId: string;\n  accountAgeYears: number;\n  isActive: boolean;\n}"
    }
]

async def benchmark_observer():
    print(f"Running Observer Benchmark (5 conversations) using {config.OBSERVER_MODEL}...", flush=True)
    results = []
    latencies_ms = []
    success_count = 0

    for i, pair in enumerate(TEST_CONVERSATIONS):
        q = pair["query"]
        r = pair["response"]

        t0 = time.perf_counter()
        candidate_id = await run_observer(query=q, response=r, session_id=f"bench_sess_{i}")
        t1 = time.perf_counter()
        lat_ms = (t1 - t0) * 1000
        latencies_ms.append(lat_ms)

        if candidate_id:
            success_count += 1
            # Retrieve candidate from MongoDB to verify stored structure
            from bson import ObjectId
            doc = await candidates_col.find_one({"_id": ObjectId(candidate_id)})
            has_embedding = bool(doc.get("embedding"))
            intent_core = doc.get("intent_core", "")
            extracted_logic = doc.get("extracted_logic", "")

            results.append({
                "id": i + 1,
                "candidate_id": candidate_id,
                "latency_ms": round(lat_ms, 2),
                "intent_core": intent_core,
                "extracted_logic": extracted_logic,
                "has_embedding": has_embedding,
                "embedding_dim": len(doc.get("embedding", [])) if has_embedding else 0,
                "success": True
            })
            print(f"[{i+1}/5] Extracted: '{intent_core}' in {lat_ms:.1f}ms | Mongo Insert ID: {candidate_id}", flush=True)
        else:
            results.append({
                "id": i + 1,
                "latency_ms": round(lat_ms, 2),
                "success": False
            })
            print(f"[{i+1}/5] Observer Extraction Failed in {lat_ms:.1f}ms", flush=True)

    lat_arr = np.array(latencies_ms)
    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model": config.OBSERVER_MODEL,
        "sample_size": len(latencies_ms),
        "success_rate": success_count / len(TEST_CONVERSATIONS),
        "latency_ms": {
            "mean": float(np.mean(lat_arr)),
            "median": float(np.median(lat_arr)),
            "p95": float(np.percentile(lat_arr, 95)),
            "min": float(np.min(lat_arr)),
            "max": float(np.max(lat_arr))
        },
        "runs": results
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("\n=== OBSERVER BENCHMARK COMPLETE ===", flush=True)
    print(f"Success Rate: {summary['success_rate']*100:.1f}%")
    print(f"Observer Latency: Mean={summary['latency_ms']['mean']:.2f}ms | Median={summary['latency_ms']['median']:.2f}ms | p95={summary['latency_ms']['p95']:.2f}ms", flush=True)

if __name__ == "__main__":
    asyncio.run(benchmark_observer())
