import json
import time
import os
import sys
import numpy as np

# Add project root to sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "agent-skills"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
os.chdir(PROJECT_ROOT)

from retrieval.skill_retriever import match_skills_locally, get_skills_context
from skills.skill_store import load_skills

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "eval_dataset.json")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "raw_results", "retrieval_bench.json")

def evaluate_retrieval():
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    all_skills = load_skills()
    full_skills_dump = "\n".join([str(s) for s in all_skills])
    full_dump_tokens = len(full_skills_dump) // 4

    latencies_ms = []
    results = []

    top1_correct = 0
    top3_correct = 0
    mrr_sum = 0.0
    ood_total = 0
    ood_rejected = 0
    in_domain_total = 0

    tokens_injected_list = []
    tokens_saved_pct_list = []

    # Warmup
    for _ in range(5):
        _ = match_skills_locally("warmup query BFS algorithm")

    # Benchmark runs: 10 runs per query for statistical significance
    NUM_RUNS = 10
    for item in dataset:
        qid = item["id"]
        query = item["query"]
        expected = item["expected_skill"]
        category = item["category"]

        query_latencies = []
        matches = None

        for _ in range(NUM_RUNS):
            t0 = time.perf_counter()
            matches = match_skills_locally(query)
            t1 = time.perf_counter()
            query_latencies.append((t1 - t0) * 1000)

        latencies_ms.extend(query_latencies)

        matched_names = [m.get("name") for m in matches]
        
        # Calculate context tokens injected
        context_str = get_skills_context(query)
        injected_tokens = len(context_str) // 4
        tokens_injected_list.append(injected_tokens)
        saved_pct = ((full_dump_tokens - injected_tokens) / full_dump_tokens) * 100 if full_dump_tokens > 0 else 0
        tokens_saved_pct_list.append(saved_pct)

        # Accuracy checks
        if expected is not None:
            in_domain_total += 1
            if matched_names and matched_names[0] == expected:
                top1_correct += 1
                mrr_sum += 1.0
            elif expected in matched_names:
                rank = matched_names.index(expected) + 1
                mrr_sum += 1.0 / rank
            else:
                mrr_sum += 0.0

            if expected in matched_names[:3]:
                top3_correct += 1
        else:
            ood_total += 1
            if len(matches) == 0:
                ood_rejected += 1

        results.append({
            "id": qid,
            "query": query,
            "category": category,
            "expected_skill": expected,
            "matched_skills": [
                {"name": m.get("name"), "score": m.get("_match_score")} for m in matches
            ],
            "latency_p50_ms": float(np.percentile(query_latencies, 50)),
            "latency_p95_ms": float(np.percentile(query_latencies, 95)),
            "injected_tokens": injected_tokens,
            "saved_tokens_pct": saved_pct
        })

    latencies_arr = np.array(latencies_ms)
    
    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_queries": len(dataset),
        "total_executions": len(latencies_ms),
        "in_domain_count": in_domain_total,
        "out_of_domain_count": ood_total,
        "latency_stats_ms": {
            "sample_size": len(latencies_ms),
            "mean": float(np.mean(latencies_arr)),
            "median": float(np.median(latencies_arr)),
            "p95": float(np.percentile(latencies_arr, 95)),
            "min": float(np.min(latencies_arr)),
            "max": float(np.max(latencies_arr))
        },
        "accuracy_metrics": {
            "recall_at_1": float(top1_correct / in_domain_total) if in_domain_total else 0.0,
            "recall_at_3": float(top3_correct / in_domain_total) if in_domain_total else 0.0,
            "mrr": float(mrr_sum / in_domain_total) if in_domain_total else 0.0,
            "precision_at_1": float(top1_correct / in_domain_total) if in_domain_total else 0.0,
            "out_of_domain_rejection_rate": float(ood_rejected / ood_total) if ood_total else 0.0
        },
        "token_efficiency": {
            "full_dump_baseline_tokens": full_dump_tokens,
            "avg_injected_tokens": float(np.mean(tokens_injected_list)),
            "avg_token_reduction_pct": float(np.mean(tokens_saved_pct_list)),
            "p95_injected_tokens": float(np.percentile(tokens_injected_list, 95))
        },
        "per_query_details": results
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("=== RETRIEVAL BENCHMARK COMPLETE ===")
    print(f"Sample Size (Runs): {summary['latency_stats_ms']['sample_size']}")
    print(f"Latency Mean: {summary['latency_stats_ms']['mean']:.3f} ms | Median: {summary['latency_stats_ms']['median']:.3f} ms | p95: {summary['latency_stats_ms']['p95']:.3f} ms | Min: {summary['latency_stats_ms']['min']:.3f} ms | Max: {summary['latency_stats_ms']['max']:.3f} ms")
    print(f"Recall@1: {summary['accuracy_metrics']['recall_at_1']*100:.1f}%")
    print(f"Recall@3: {summary['accuracy_metrics']['recall_at_3']*100:.1f}%")
    print(f"MRR: {summary['accuracy_metrics']['mrr']:.3f}")
    print(f"OOD Rejection Rate: {summary['accuracy_metrics']['out_of_domain_rejection_rate']*100:.1f}%")
    print(f"Token Reduction vs Baseline: {summary['token_efficiency']['avg_token_reduction_pct']:.1f}% (Avg {summary['token_efficiency']['avg_injected_tokens']:.1f} tokens vs {full_dump_tokens} baseline)")

if __name__ == "__main__":
    evaluate_retrieval()
