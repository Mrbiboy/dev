import os
import requests

CONFIG_DIR = "configurations"
TARGET_EXTENSIONS = [".tf", "Dockerfile", ".yaml", ".yml"]

def get_github_files(repo_owner, repo_name, path=""):
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{path}"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else []

def download_file(file_url, output_path):
    response = requests.get(file_url)
    if response.status_code == 200:
        with open(output_path, "wb") as file:
            file.write(response.content)
        print(f"✅ Fichier téléchargé : {output_path}")
    else:
        print(f"⚠️ Impossible de télécharger {file_url}")

def extract_config_files(repo_url):
    os.makedirs(CONFIG_DIR, exist_ok=True)

    repo_owner, repo_name = repo_url.replace("https://github.com/", "").split("/")[:2]
    files = get_github_files(repo_owner, repo_name)

    for file in files:
        file_name = file["name"]
        file_url = file.get("download_url")
        if file_url and any(file_name.endswith(ext) or file_name in TARGET_EXTENSIONS for ext in TARGET_EXTENSIONS):
            output_path = os.path.join(CONFIG_DIR, file_name)
            download_file(file_url, output_path)

if __name__ == "__main__":
    repo_url = input("🔗 Entrez le lien du dépôt GitHub à analyser : ").strip()
    extract_config_files(repo_url)
