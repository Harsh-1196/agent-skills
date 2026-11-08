import subprocess
import os
import json
import time

UI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "agent-skills", "ui"))
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "raw_results", "static_checks.json")

def run_checks():
    results = {}

    # 1. TypeScript build check
    print("Running TypeScript check (tsc -b)...", flush=True)
    ts_proc = subprocess.run(["npx.cmd", "tsc", "-b"], cwd=UI_DIR, capture_output=True, text=True, shell=True)
    results["typescript"] = {
        "exit_code": ts_proc.returncode,
        "clean": ts_proc.returncode == 0,
        "output": ts_proc.stdout + ts_proc.stderr
    }

    # 2. ESLint
    print("Running ESLint (npm run lint)...", flush=True)
    lint_proc = subprocess.run(["npm.cmd", "run", "lint"], cwd=UI_DIR, capture_output=True, text=True, shell=True)
    results["eslint"] = {
        "exit_code": lint_proc.returncode,
        "clean": lint_proc.returncode == 0,
        "output": lint_proc.stdout + lint_proc.stderr
    }

    # 3. npm audit
    print("Running npm audit...", flush=True)
    audit_proc = subprocess.run(["npm.cmd", "audit", "--json"], cwd=UI_DIR, capture_output=True, text=True, shell=True)
    try:
        audit_json = json.loads(audit_proc.stdout)
        vuln_summary = audit_json.get("metadata", {}).get("vulnerabilities", {})
    except:
        vuln_summary = "Parse error"
    results["npm_audit"] = {
        "exit_code": audit_proc.returncode,
        "vulnerabilities": vuln_summary
    }

    # 4. pip check
    print("Running pip check...", flush=True)
    pip_proc = subprocess.run(["pip", "check"], capture_output=True, text=True, shell=True)
    results["pip_check"] = {
        "exit_code": pip_proc.returncode,
        "clean": pip_proc.returncode == 0,
        "output": pip_proc.stdout.strip() if pip_proc.stdout else pip_proc.stderr.strip()
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    print("\n=== STATIC CHECKS COMPLETE ===", flush=True)
    print(f"TypeScript Clean: {results['typescript']['clean']}")
    print(f"ESLint Clean: {results['eslint']['clean']}")
    print(f"npm Audit Vulnerabilities: {results['npm_audit']['vulnerabilities']}")
    print(f"pip Check: {results['pip_check']['output'] or 'No broken requirements found'}")

if __name__ == "__main__":
    run_checks()
