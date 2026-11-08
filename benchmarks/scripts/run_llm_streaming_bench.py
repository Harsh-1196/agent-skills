import json
import time
import os
import sys
import numpy as np

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "agent-skills"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)
os.chdir(PROJECT_ROOT)

from llm_service import gemini_client, build_prompt
import config

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "raw_results", "llm_streaming_bench.json")

TEST_QUERIES = [
    "Explain BFS algorithm with code snippets.",
    "Describe 5G technology and its key features.",
    "Explain quicksort partitioning step by step with code.",
    "Explain Prometheus monitoring architecture.",
    "Explain the sliding window algorithm with an example in Python."
]

def benchmark_raw_llm_stream():
    results = []
    ttfts_ms = []
    total_latencies_ms = []
    tokens_per_sec_list = []
    output_tokens_list = []

    print(f"Running LLM raw streaming benchmark (5 queries) on {config.CHAT_MODEL}...", flush=True)

    for i, q in enumerate(TEST_QUERIES):
        prompt = build_prompt(q)
        t_start = time.perf_counter()
        first_chunk_time = None
        full_response = ""
        chunk_count = 0

        try:
            response = gemini_client.models.generate_content_stream(
                model=config.CHAT_MODEL,
                contents=prompt
            )
            for chunk in response:
                if chunk.text:
                    if first_chunk_time is None:
                        first_chunk_time = time.perf_counter()
                    full_response += chunk.text
                    chunk_count += 1
            t_end = time.perf_counter()

            if first_chunk_time is None:
                first_chunk_time = t_end

            ttft_ms = (first_chunk_time - t_start) * 1000
            total_duration_ms = (t_end - t_start) * 1000

            output_tokens = max(1, len(full_response) // 4)
            gen_duration_s = max(0.001, t_end - first_chunk_time)
            tokens_per_sec = output_tokens / gen_duration_s

            ttfts_ms.append(ttft_ms)
            total_latencies_ms.append(total_duration_ms)
            tokens_per_sec_list.append(tokens_per_sec)
            output_tokens_list.append(output_tokens)

            results.append({
                "id": i + 1,
                "query": q,
                "ttft_ms": round(ttft_ms, 2),
                "total_duration_ms": round(total_duration_ms, 2),
                "output_chars": len(full_response),
                "estimated_tokens": output_tokens,
                "tokens_per_second": round(tokens_per_sec, 2),
                "chunk_count": chunk_count
            })
            print(f"[{i+1}/{len(TEST_QUERIES)}] TTFT: {ttft_ms:.1f}ms | Total: {total_duration_ms:.1f}ms | Tokens: {output_tokens} | Speed: {tokens_per_sec:.1f} tok/s", flush=True)

        except Exception as e:
            print(f"Error on query {i+1}: {e}", flush=True)

    ttft_arr = np.array(ttfts_ms)
    total_arr = np.array(total_latencies_ms)
    rate_arr = np.array(tokens_per_sec_list)
    tokens_arr = np.array(output_tokens_list)

    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model": config.CHAT_MODEL,
        "sample_size": len(ttfts_ms),
        "ttft_ms": {
            "mean": float(np.mean(ttft_arr)),
            "median": float(np.median(ttft_arr)),
            "p95": float(np.percentile(ttft_arr, 95)),
            "min": float(np.min(ttft_arr)),
            "max": float(np.max(ttft_arr))
        },
        "total_latency_ms": {
            "mean": float(np.mean(total_arr)),
            "median": float(np.median(total_arr)),
            "p95": float(np.percentile(total_arr, 95)),
            "min": float(np.min(total_arr)),
            "max": float(np.max(total_arr))
        },
        "throughput_tokens_per_sec": {
            "mean": float(np.mean(rate_arr)),
            "median": float(np.median(rate_arr)),
            "p95": float(np.percentile(rate_arr, 95)),
            "min": float(np.min(rate_arr)),
            "max": float(np.max(rate_arr))
        },
        "runs": results
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("Raw LLM Streaming Benchmark Finished Successfully.", flush=True)

if __name__ == "__main__":
    benchmark_raw_llm_stream()
