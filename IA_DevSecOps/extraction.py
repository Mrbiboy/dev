import requests
import os
import sys

# 🟢 Extensions à extraire
TARGET_EXTENSIONS = [".tf", "Dockerfile", ".yaml", ".yml"]
OUTPUT_DIR = "configurations"


def clean_repo_url(repo_url):
    """ Nettoie l'URL du dépôt GitHub et retourne owner/repo """
    repo_url = repo_url.rstrip("/")
    if repo_url.endswith(".git"):
        repo_url = repo_url[:-4]

    repo_owner, repo_name = repo_url.split("/")[-2:]
    return repo_owner, repo_name


def get_github_files(repo_owner, repo_name, path=""):
    """ Récupère tous les fichiers d'un dépôt GitHub récursivement """
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{path}"
    response = requests.get(url)

    if response.status_code == 200:
        return response.json()
    else:
        print(f"⚠️ Erreur ({response.status_code}) : {response.text}")
        return []


def download_file(file_url, output_path):
    """ Télécharge un fichier depuis GitHub """
    response = requests.get(file_url)

    if response.status_code == 200:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "wb") as file:
            file.write(response.content)
        print(f"✅ Fichier téléchargé : {output_path}")
    else:
        print(f"⚠️ Impossible de télécharger {file_url}")


def extract_config_files(repo_url):
    """ Télécharge récursivement les fichiers Terraform, Dockerfile et YAML """
    repo_owner, repo_name = clean_repo_url(repo_url)
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"📥 Extraction des fichiers du dépôt : {repo_url}")

    def fetch_files_recursive(path=""):
        files = get_github_files(repo_owner, repo_name, path)
        if not files:
            return

        for file in files:
            file_name = file["name"]
            file_path = file["path"]  # Chemin complet dans le repo
            file_url = file.get("download_url")

            if file_url and any(file_name.endswith(ext) or file_name in TARGET_EXTENSIONS for ext in TARGET_EXTENSIONS):
                output_path = os.path.join(OUTPUT_DIR, file_name)
                download_file(file_url, output_path)
            elif file["type"] == "dir":
                fetch_files_recursive(file_path)  # 🔄 Récursion dans le dossier

    fetch_files_recursive()  # Lancer la récupération des fichiers


# 🟢 Exécuter l'extraction avec l'URL en argument
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Erreur : Aucun dépôt GitHub fourni.")
        sys.exit(1)

    repo_url = sys.argv[1]
    extract_config_files(repo_url)
