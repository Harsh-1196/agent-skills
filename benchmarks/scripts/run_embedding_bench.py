import json
import time
import os
import sys
import math
import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "agent-skills"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
os.chdir(PROJECT_ROOT)

from llm_service import get_embedding
from skills.skill_store import load_skills

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "eval_dataset.json")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "raw_results", "embedding_bench.json")

def cosine_similarity(v1, v2):
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(x * y for x, y in zip(v1, v2))
    mag1 = math.sqrt(sum(x * x for x in v1))
    mag2 = math.sqrt(sum(x * x for x in v2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)

def evaluate_embeddings():
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    skills = load_skills()
    print(f"Loaded {len(skills)} skills for vector embedding indexing...")

    # Pre-embed the skills
    skill_embeddings = {}
    for s in skills:
        name = s.get("name")
        text = f"{s.get('name', '')} {s.get('description', '')} {' '.join(s.get('triggers', []))} {s.get('prompt_template', '')}"
        print(f"Embedding skill: {name}...")
        emb = get_embedding(text)
        skill_embeddings[name] = emb

    embedding_latencies_ms = []
    vector_results = []
    top1_correct = 0
    top3_correct = 0
    in_domain_total = 0
    ood_total = 0
    ood_rejected = 0

    # Minimum cosine threshold for vector match
    VECTOR_THRESHOLD = 0.55

    # Run embedding calls
    for item in dataset:
        qid = item["id"]
        query = item["query"]
        expected = item["expected_skill"]
        category = item["category"]

        t0 = time.perf_counter()
        query_emb = get_embedding(query)
        t1 = time.perf_counter()
        lat_ms = (t1 - t0) * 1000
        embedding_latencies_ms.append(lat_ms)

        # Compute cosine similarity against all skills
        scores = []
        for s_name, s_emb in skill_embeddings.items():
            sim = cosine_similarity(query_emb, s_emb)
            if sim >= VECTOR_THRESHOLD:
                scores.append({"name": s_name, "similarity": round(sim, 4)})
        scores.sort(key=lambda x: x["similarity"], reverse=True)

        matched_names = [s["name"] for s in scores]

        if expected is not None:
            in_domain_total += 1
            if matched_names and matched_names[0] == expected:
                top1_correct += 1
            if expected in matched_names[:3]:
                top3_correct += 1
        else:
            ood_total += 1
            if len(scores) == 0:
                ood_rejected += 1

        vector_results.append({
            "id": qid,
            "query": query,
            "expected": expected,
            "matched": scores,
            "embedding_latency_ms": lat_ms
        })

    lat_arr = np.array(embedding_latencies_ms)
    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model": "models/gemini-embedding-001",
        "sample_size": len(embedding_latencies_ms),
        "embedding_dimensions": len(query_emb),
        "latency_stats_ms": {
            "mean": float(np.mean(lat_arr)),
            "median": float(np.median(lat_arr)),
            "p95": float(np.percentile(lat_arr, 95)),
            "min": float(np.min(lat_arr)),
            "max": float(np.max(lat_arr)),
            "std": float(np.std(lat_arr))
        },
        "accuracy_with_embeddings": {
            "cosine_threshold": VECTOR_THRESHOLD,
            "recall_at_1": float(top1_correct / in_domain_total) if in_domain_total else 0.0,
            "recall_at_3": float(top3_correct / in_domain_total) if in_domain_total else 0.0,
            "ood_rejection_rate": float(ood_rejected / ood_total) if ood_total else 0.0
        },
        "per_query_details": vector_results
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("=== EMBEDDING BENCHMARK COMPLETE ===")
    print(f"Sample Size: {summary['sample_size']}")
    print(f"Latency: Mean={summary['latency_stats_ms']['mean']:.2f}ms | Median={summary['latency_stats_ms']['median']:.2f}ms | p95={summary['latency_stats_ms']['p95']:.2f}ms | Min={summary['latency_stats_ms']['min']:.2f}ms | Max={summary['latency_stats_ms']['max']:.2f}ms")
    print(f"Vector Recall@1: {summary['accuracy_with_embeddings']['recall_at_1']*100:.1f}%")
    print(f"Vector Recall@3: {summary['accuracy_with_embeddings']['recall_at_3']*100:.1f}%")

if __name__ == "__main__":
    evaluate_embeddings()
