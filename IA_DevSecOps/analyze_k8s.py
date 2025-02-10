import os
import json
import yaml
import re

# Dossier contenant les fichiers YAML
OUTPUT_DIR = "configurations"

def read_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        return None

def parse_yaml(file_content):
    try:
        return list(yaml.safe_load_all(file_content))
    except:
        return []

def extract_yaml_info(yaml_data):
    if not isinstance(yaml_data, dict):
        return None

    return {
        "API Versions Utilisées": yaml_data.get("apiVersion", "Non spécifié"),
        "Types d'objets Kubernetes": yaml_data.get("kind", "Non spécifié"),
        "Nom de la ressource": yaml_data.get("metadata", {}).get("name", "Non spécifié"),
        "Namespace": yaml_data.get("metadata", {}).get("namespace", "default"),
        "Ports exposés": yaml_data.get("spec", {}).get("ports", "Non spécifié"),
        "Variables d'environnement": yaml_data.get("spec", {}).get("env", "Non spécifié"),
        "Secrets": yaml_data.get("spec", {}).get("secrets", "Non spécifié"),
        "Utilisation des privilèges": yaml_data.get("spec", {}).get("securityContext", {}).get("privileged", "Non spécifié"),
        "Élévation de privilèges": yaml_data.get("spec", {}).get("securityContext", {}).get("allowPrivilegeEscalation", "Non spécifié"),
    }

def detect_vulnerabilities(yaml_data):
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

    if yaml_data.get("spec", {}).get("secrets", "Non spécifié") != "Non spécifié":
        vulnerabilities.append("⚠️ Présence de secrets potentiellement exposés.")

    return vulnerabilities

def generate_reports(extracted_data, vulnerability_report):
    with open("yaml_extraction.json", "w", encoding="utf-8") as json_file:
        json.dump(extracted_data, json_file, indent=4, ensure_ascii=False)
    print("📄 Rapport d'extraction généré : yaml_extraction.json")

    with open("yaml_vulnerabilities.json", "w", encoding="utf-8") as json_file:
        json.dump(vulnerability_report, json_file, indent=4, ensure_ascii=False)
    print("📄 Rapport des vulnérabilités généré : yaml_vulnerabilities.json")

def analyze_all_yaml_files():
    extracted_data, vulnerability_report = [], []

    for file_name in os.listdir(OUTPUT_DIR):
        if file_name.endswith((".yaml", ".yml")):
            file_path = os.path.join(OUTPUT_DIR, file_name)
            file_content = read_file(file_path)
            if not file_content:
                print(f"❌ Impossible de lire le fichier : {file_name}")
                continue

            yaml_content = parse_yaml(file_content)
            extracted_data.extend([extract_yaml_info(doc) for doc in yaml_content if doc])
            vulnerability_report.extend([detect_vulnerabilities(doc) for doc in yaml_content if doc])

    generate_reports(extracted_data, vulnerability_report)

# 🟢 Exécution du script
if __name__ == "__main__":
    analyze_all_yaml_files()
