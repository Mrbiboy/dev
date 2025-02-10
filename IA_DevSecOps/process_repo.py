import os
import subprocess
import sys

# 🟢 Chemin des scripts dans ton dépôt
EXTRACTION_SCRIPT = "extraction.py"
ANALYZE_K8S_SCRIPT = "analyze_k8s.py"
ANALYZE_DOCKERFILE_SCRIPT = "analyze_dockerfile.py"
ANALYZE_TERRAFORM_SCRIPT = "analyze_terraform.py"


def run_script(script_name, repo_url=""):
    """Exécute un script Python avec un dépôt en entrée (si nécessaire)."""
    try:
        cmd = ["python3", script_name]
        if repo_url:
            cmd.append(repo_url)

        print(f"🚀 Exécution de {script_name} {'sur ' + repo_url if repo_url else ''}...")
        result = subprocess.run(cmd, capture_output=True, text=True)

        print(result.stdout)
        if result.stderr:
            print(f"⚠️ Erreur dans {script_name} : {result.stderr}")

    except Exception as e:
        print(f"❌ Erreur lors de l'exécution de {script_name} : {e}")


def main():
    # Vérifier si l'argument du dépôt est fourni
    if len(sys.argv) < 2:
        print("❌ Erreur : Aucun dépôt fourni en argument.")
        sys.exit(1)

    repo_url = sys.argv[1]

    if not repo_url.startswith("https://github.com/"):
        print("❌ URL invalide. Veuillez entrer une URL GitHub valide.")
        sys.exit(1)

    print(f"\n📥 Dépôt soumis : {repo_url}\n")

    # 🔹 Étape 1 : Extraction des fichiers
    run_script(EXTRACTION_SCRIPT, repo_url)

    # 🔹 Étape 2 : Exécution des analyses
    print("\n🔍 Analyse des fichiers extraits...\n")
    run_script(ANALYZE_K8S_SCRIPT)
    run_script(ANALYZE_DOCKERFILE_SCRIPT)
    run_script(ANALYZE_TERRAFORM_SCRIPT)

    print("\n✅ Analyse terminée. Consultez les rapports générés.\n")


if __name__ == "__main__":
    main()
