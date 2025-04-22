import subprocess
import json
import os
import logging

# Configuration du logging pour le débogage
logging.basicConfig(level=logging.DEBUG)

def run_checkov_on_dir(path, is_file=False):
    if is_file:
        return run_checkov_on_single_file(path)
    
    files_found = []
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            if file.endswith('.tf') or file.endswith('.yaml') or file.endswith('.yml') or file == 'Dockerfile':
                files_found.append(file_path)
    
    all_results = {
        "status": "completed",
        "path_scanned": path,
        "files_found": files_found,
        "all_violations": []
    }
    
    total_passed = 0
    total_failed = 0
    
    for file_path in files_found:
        file_result = run_checkov_on_single_file(file_path)
        total_passed += file_result.get("passed_checks", 0)
        total_failed += file_result.get("failed_checks", 0)
        all_results["all_violations"].extend(file_result.get("top_violations", []))
    
    total_checks = total_passed + total_failed
    score = round((total_passed / total_checks) * 100) if total_checks > 0 else 0
    
    all_results["score"] = score
    all_results["compliant"] = (score == 100)
    all_results["passed_checks"] = total_passed
    all_results["failed_checks"] = total_failed
    all_results["top_violations"] = all_results["all_violations"]
    del all_results["all_violations"]
    
    return all_results

def run_checkov_on_single_file(file_path):
    # Déterminer le framework basé sur l'extension
    framework = "terraform"
    if file_path.endswith('.yaml') or file_path.endswith('.yml'):
        framework = "kubernetes"
    elif file_path == 'Dockerfile' or file_path.endswith('/Dockerfile'):
        framework = "dockerfile"

    # ✅ Chemin correct basé sur ta structure (dans Pytest/backend, .venv est dans Pytest)
    checkov_path = os.path.abspath(os.path.join("..", ".venv", "Scripts", "checkov.cmd"))

    cmd = [
        checkov_path,
        "-f", file_path,
        "--framework", framework,
        "-o", "json",
        "--quiet"
    ]

    try:
        process = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

        if not process.stdout.strip():
            return {
                "file_path": file_path,
                "status": "no_output",
                "passed_checks": 0,
                "failed_checks": 0,
                "top_violations": []
            }

        try:
            output = json.loads(process.stdout)

            if isinstance(output, dict):
                results = output.get("results", {})
                failed = results.get("failed_checks", [])
                passed = results.get("passed_checks", [])
            elif isinstance(output, list):
                failed = [r for r in output if r.get("check_result", {}).get("result") == "FAILED"]
                passed = [r for r in output if r.get("check_result", {}).get("result") == "PASSED"]
            else:
                failed, passed = [], []

            filtered_violations = [
                {
                    "check_id": item.get("check_id"),
                    "check_name": item.get("check_name"),
                    "file": item.get("file_path") or file_path,
                    "guideline": item.get("guideline"),
                    "line_range": item.get("file_line_range"),
                    "resource": item.get("resource")
                }
                for item in failed
            ]

            return {
                "file_path": file_path,
                "passed_checks": len(passed),
                "failed_checks": len(failed),
                "top_violations": filtered_violations
            }

        except json.JSONDecodeError:
            return {
                "file_path": file_path,
                "status": "json_error",
                "passed_checks": 0,
                "failed_checks": 0,
                "top_violations": [],
                "stdout": process.stdout[:500]
            }

    except Exception as e:
        return {
            "file_path": file_path,
            "status": "error",
            "message": str(e),
            "passed_checks": 0,
            "failed_checks": 0,
            "top_violations": []
        }
