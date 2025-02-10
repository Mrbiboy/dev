import requests
import os

# 🟢 Remplace ces valeurs par celles de ton dépôt GitHub
GITHUB_OWNER = "YoussefElbadouri"
GITHUB_REPO = "IA_DevSecOps"
OUTPUT_DIR = "configurations"  # Dossier où seront enregistrés les fichiers

# Extensions des fichiers de configuration à extraire
TARGET_EXTENSIONS = [".tf", "Dockerfile", ".yaml", ".yml"]

def get_github_files(repo_owner, repo_name, path=""):
    """Récupère la liste des fichiers dans un dépôt GitHub public."""
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{path}"

    response = requests.get(url)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"⚠️ Erreur de récupération ({response.status_code}) : {response.text}")
        return []

def download_file(file_url, output_path):
    """Télécharge un fichier depuis GitHub et l'enregistre localement."""
    response = requests.get(file_url)

    if response.status_code == 200:
        with open(output_path, "wb") as file:
            file.write(response.content)
        print(f"✅ Fichier téléchargé : {output_path}")
    else:
        print(f"⚠️ Impossible de télécharger {file_url}")

def extract_config_files(repo_owner, repo_name, path=""):
    """Télécharge les fichiers Terraform, Dockerfile et Kubernetes YAML depuis un dépôt GitHub public."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    files = get_github_files(repo_owner, repo_name, path)

    if not files:
        print("❌ Aucun fichier trouvé.")
        return

    for file in files:
        file_name = file["name"]
        file_url = file.get("download_url")  # Certains fichiers peuvent ne pas avoir d'URL

        if not file_url:
            continue  # Ignore les dossiers et les fichiers non téléchargeables

        if any(file_name.endswith(ext) or file_name in TARGET_EXTENSIONS for ext in TARGET_EXTENSIONS):
            output_path = os.path.join(OUTPUT_DIR, file_name)
            download_file(file_url, output_path)

# 🟢 Exécution du script avec un dépôt GitHub public
extract_config_files(GITHUB_OWNER, GITHUB_REPO)
