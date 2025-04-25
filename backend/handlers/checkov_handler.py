import subprocess
import json
import os
import logging
import shutil

# Configuration du logging pour le débogage
logging.basicConfig(level=logging.DEBUG)

def run_checkov_on_dir(path, is_file=False):
    if is_file:
        return run_checkov_on_single_file(path)
    
    if not os.path.exists(path):
        return {
            "results": {
                "status": "error",
                "message": f"Le chemin {path} n'existe pas",
                "passed_checks": [],
                "failed_checks": [],
                "summary": {"passed": 0, "failed": 0}
            }
        }

    files_found = []
    for root, dirs, files in os.walk(path):
        for file in files:
            file_path = os.path.join(root, file)
            if file.endswith('.tf') or file.endswith('.yaml') or file.endswith('.yml') or file == 'Dockerfile':
                files_found.append(file_path)
    
    results = {
        "status": "completed",
        "path_scanned": path,
        "files_found": files_found,
        "passed_checks": [],
        "failed_checks": [],
        "summary": {"passed": 0, "failed": 0}
    }
    
    total_passed = 0
    total_failed = 0
    
    for file_path in files_found:
        file_result = run_checkov_on_single_file(file_path)
        total_passed += len(file_result.get("passed_checks", 0))
        total_failed += len(file_result.get("failed_checks", 0))
        results["failed_checks"].extend(file_result.get("failed_checks", []))
        results["passed_checks"].extend(file_result.get("passed_checks", []))
    
    results["summary"]["passed"] = total_passed
    results["summary"]["failed"] = total_failed
    total_checks = total_passed + total_failed
    score = round((total_passed / total_checks) * 100) if total_checks > 0 else 0
    
    results["score"] = score
    results["compliant"] = (score == 100)
    
    return {"results": results}

def run_checkov_on_single_file(file_path):
    if not os.path.exists(file_path):
        return {
            "file_path": file_path,
            "status": "error",
            "message": f"Le fichier {file_path} n'existe pas",
            "passed_checks": [],
            "failed_checks": []
        }

    # Déterminer le framework basé sur l'extension
    framework = "terraform"
    if file_path.endswith('.yaml') or file_path.endswith('.yml'):
        framework = "kubernetes"
    elif file_path == 'Dockerfile' or file_path.endswith('/Dockerfile'):
        framework = "dockerfile"

    # Trouver checkov dynamiquement
    checkov_path = shutil.which("checkov")
    if not checkov_path:
        return {
            "file_path": file_path,
            "status": "error",
            "message": "Checkov n'est pas installé ou introuvable",
            "passed_checks": [],
            "failed_checks": []
        }

    cmd = [
        checkov_path,
        "-f", file_path,
        "--framework", framework,
        "-o", "json",
        "--quiet"
    ]

    try:
        process = subprocess.run(cmd, capture_output=True, text=True, timeout=60)

        if not process.stdout.strip():
            return {
                "file_path": file_path,
                "status": "no_output",
                "passed_checks": [],
                "failed_checks": []
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

            filtered_failed = [
                {
                    "check_id": item.get("check_id"),
                    "check_name": item.get("check_name"),
                    "file_path": item.get("file_path") or file_path,
                    "guideline": item.get("guideline"),
                    "file_line_range": item.get("file_line_range"),
                    "resource": item.get("resource")
                }
                for item in failed
            ]

            filtered_passed = [
                {
                    "check_id": item.get("check_id"),
                    "check_name": item.get("check_name"),
                    "file_path": item.get("file_path") or file_path,
                    "file_line_range": item.get("file_line_range"),
                    "resource": item.get("resource")
                }
                for item in passed
            ]

            return {
                "file_path": file_path,
                "status": "success",
                "passed_checks": filtered_passed,
                "failed_checks": filtered_failed
            }

        except json.JSONDecodeError:
            return {
                "file_path": file_path,
                "status": "json_error",
                "passed_checks": [],
                "failed_checks": [],
                "stdout": process.stdout[:500]
            }

    except Exception as e:
        return {
            "file_path": file_path,
            "status": "error",
            "message": str(e),
            "passed_checks": [],
            "failed_checks": []
        }