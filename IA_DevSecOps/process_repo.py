import os
import subprocess
import shutil

CONFIG_DIR = "configurations"
EXTRACTION_SCRIPT = "extraction.py"
ANALYZE_K8S_SCRIPT = "analyze_k8s.py"
ANALYZE_DOCKERFILE_SCRIPT = "analyze_dockerfile.py"
ANALYZE_TERRAFORM_SCRIPT = "analyze_terraform.py"

def run_script(script_name, repo_url=""):
    """ Exécute un script Python et passe l'URL si nécessaire. """
    cmd = ["python", script_name]
    if repo_url:
        cmd.append(repo_url)

    print(f"🚀 Lancement de {script_name} avec la commande : {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        print(f"🔍 Sortie standard ({script_name}):\n{result.stdout}")
        print(f"⚠️ Erreurs ({script_name}):\n{result.stderr}")
    except Exception as e:
        print(f"❌ Erreur lors de l'exécution de {script_name}: {e}")

def main():
    # 🔹 Récupération de l'URL du dépôt (Jenkins ou exécution locale)
    repo_url = os.getenv("GITHUB_REPO_URL")  # Récupération depuis une variable d'environnement (Jenkins)

    if not repo_url:
        repo_url = input("🔗 Entrez le lien du dépôt GitHub à analyser : ").strip()

    if not repo_url.startswith("https://github.com/"):
        print("❌ URL invalide.")
        return

    print(f"\n📥 Dépôt soumis : {repo_url}")

    # 📌 Nettoyage des anciens fichiers extraits et des anciens rapports
    if os.path.exists(CONFIG_DIR):
        shutil.rmtree(CONFIG_DIR)
    os.makedirs(CONFIG_DIR, exist_ok=True)

    # ✅ Extraction des fichiers du dépôt utilisateur
    run_script(EXTRACTION_SCRIPT, repo_url)

    # ✅ Vérification des fichiers extraits
    extracted_files = os.listdir(CONFIG_DIR)
    if not extracted_files:
        print("❌ Aucun fichier trouvé. Arrêt de l'analyse.")
        return
    print(f"📂 Fichiers extraits : {extracted_files}")

    # ✅ Exécution des analyses
    run_script(ANALYZE_K8S_SCRIPT)
    run_script(ANALYZE_DOCKERFILE_SCRIPT)
    run_script(ANALYZE_TERRAFORM_SCRIPT)

    print("\n✅ Analyse terminée. Vérifie les rapports générés.")

if __name__ == "__main__":
    main()
