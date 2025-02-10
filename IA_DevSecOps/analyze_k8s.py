import os
import json
import yaml

# 📂 Dossier contenant les fichiers extraits
CONFIG_DIR = "configurations"

def read_file(file_path):
    """Lit un fichier et retourne son contenu."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"❌ Erreur lors de la lecture du fichier {file_path} : {e}")
        return None

def parse_yaml(file_content):
    """Parse un fichier YAML et retourne son contenu sous forme de liste."""
    try:
        return list(yaml.safe_load_all(file_content))
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse YAML : {e}")
        return []

def extract_yaml_info(yaml_data):
    """Extrait les informations principales du fichier YAML."""
    if not isinstance(yaml_data, dict):
        return None

    return {
        "API Versions Utilisées": yaml_data.get("apiVersion", "Non spécifié"),
        "Types d'objets Kubernetes": yaml_data.get("kind", "Non spécifié"),
        "Nom de la ressource": yaml_data.get("metadata", {}).get("name", "Non spécifié"),
        "Namespace": yaml_data.get("metadata", {}).get("namespace", "default"),
        "Ports exposés": yaml_data.get("spec", {}).get("ports", []),
        "Utilisation des privilèges": yaml_data.get("spec", {}).get("securityContext", {}).get("privileged", "Non spécifié"),
        "Élévation de privilèges": yaml_data.get("spec", {}).get("securityContext", {}).get("allowPrivilegeEscalation", "Non spécifié"),
    }

def detect_vulnerabilities(yaml_data):
    """Détecte les vulnérabilités dans le fichier YAML."""
    vulnerabilities = []
    if not yaml_data:
        return vulnerabilities

    if "spec" in yaml_data:
        if "containers" in yaml_data["spec"]:
            for container in yaml_data["spec"]["containers"]:
                if "image" in container and ":latest" in container["image"]:
                    vulnerabilities.append("⚠️ Utilisation de l'image 'latest', risque de mise à jour instable.")
                if "securityContext" not in container:
                    vulnerabilities.append("⚠️ Absence de securityContext, manque de restrictions de sécurité.")
                if container.get("securityContext", {}).get("privileged", False):
                    vulnerabilities.append("⚠️ Conteneur en mode privilégié, risque élevé de compromission.")
                if container.get("securityContext", {}).get("allowPrivilegeEscalation", True):
                    vulnerabilities.append("⚠️ allowPrivilegeEscalation activé, risque d'élévation de privilèges.")
                if container.get("securityContext", {}).get("runAsUser", 0) == 0:
                    vulnerabilities.append("⚠️ Le conteneur s'exécute en tant que root, risque élevé.")
                if not container.get("securityContext", {}).get("readOnlyRootFilesystem", False):
                    vulnerabilities.append("⚠️ Le système de fichiers n'est pas en lecture seule, risque de modification malveillante.")

    if "networkPolicy" not in yaml_data:
        vulnerabilities.append("⚠️ Aucune NetworkPolicy définie, risque de mouvements latéraux non contrôlés.")

    return vulnerabilities

def save_report_json(report, filename):
    """Sauvegarde le rapport en JSON dans configurations/."""
    os.makedirs(CONFIG_DIR, exist_ok=True)
    filepath = os.path.join(CONFIG_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as json_file:
        json.dump(report, json_file, indent=4, ensure_ascii=False)

    print(f"📄 Rapport JSON généré : {filepath}")

def analyze_all_yaml_files():
    """Analyse tous les fichiers YAML dans configurations/ et génère des rapports."""
    extracted_data, vulnerability_report = [], []

    yaml_files = [f for f in os.listdir(CONFIG_DIR) if f.endswith((".yaml", ".yml"))]

    if not yaml_files:
        print("❌ Aucun fichier YAML trouvé dans configurations/.")
        return

    for file_name in yaml_files:
        file_path = os.path.join(CONFIG_DIR, file_name)
        file_content = read_file(file_path)
        if not file_content:
            print(f"❌ Impossible de lire le fichier : {file_name}")
            continue

        yaml_content = parse_yaml(file_content)

        extracted_data.extend([extract_yaml_info(doc) for doc in yaml_content if doc])
        vulnerability_report.extend([detect_vulnerabilities(doc) for doc in yaml_content if doc])

    save_report_json(extracted_data, "yaml_extraction.json")
    save_report_json(vulnerability_report, "yaml_vulnerabilities.json")

# 🟢 Exécution du script
if __name__ == "__main__":
    analyze_all_yaml_files()
