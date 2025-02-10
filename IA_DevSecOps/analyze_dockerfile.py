import os
import json
from dockerfile_parse import DockerfileParser

# 📂 Dossier contenant le fichier Dockerfile extrait
CONFIG_DIR = "configurations"
DOCKERFILE_PATH = os.path.join(CONFIG_DIR, "Dockerfile")  # 🔹 Lecture depuis le dossier configuré

def check_compliance(dfp):
    """Vérifie toutes les conformités et non-conformités d'un Dockerfile."""
    compliance = {
        "Conforme": [],
        "Non Conforme": []
    }

    # ✅ Vérifier si l'image de base est sécurisée et non latest
    if dfp.baseimage:
        if ":" not in dfp.baseimage or dfp.baseimage.endswith(":latest"):
            compliance["Non Conforme"].append(f"L'image `{dfp.baseimage}` utilise `:latest` ou ne spécifie pas de version.")
        else:
            compliance["Conforme"].append(f"L'image `{dfp.baseimage}` spécifie une version correcte.")

    # ✅ Vérifier si un utilisateur non-root est utilisé
    user_entries = [entry['value'] for entry in dfp.structure if entry['instruction'] == "USER"]
    if user_entries and user_entries[0] != "root":
        compliance["Conforme"].append(f"Utilisateur non-root détecté: {user_entries[0]}")
    else:
        compliance["Non Conforme"].append("L'utilisateur root est utilisé.")

    # ✅ Vérifier si les ports sensibles sont exposés
    sensitive_ports = {22, 23, 3389, 1521, 3306, 5432, 8080, 8443, 6379, 9200}
    exposed_ports = [entry['value'] for entry in dfp.structure if entry['instruction'] == "EXPOSE"]
    if any(int(port) in sensitive_ports for ports in exposed_ports for port in ports.split()):
        compliance["Non Conforme"].append("Un port sensible est exposé.")
    else:
        compliance["Conforme"].append("Aucun port sensible n'est exposé.")

    # ✅ Vérifier la gestion des secrets dans ENV
    secret_keywords = ["password", "secret", "key", "token"]
    has_secrets = any(any(secret in entry['value'].lower() for secret in secret_keywords) for entry in dfp.structure if entry['instruction'] == "ENV")
    if has_secrets:
        compliance["Non Conforme"].append("Un secret a été trouvé dans ENV.")
    else:
        compliance["Conforme"].append("Aucun secret détecté dans ENV.")

    # ✅ Vérifier si le cache est nettoyé après `apt-get install`
    apt_cleaned = any("apt-get install" in entry['value'] and "&& rm -rf /var/lib/apt/lists/*" in entry['value'] for entry in dfp.structure if entry['instruction'] == "RUN")
    if apt_cleaned:
        compliance["Conforme"].append("Le cache est bien nettoyé après `apt-get install`.")
    else:
        compliance["Non Conforme"].append("Le cache n'est pas nettoyé après `apt-get install`.")

    # ✅ Vérifier si le multi-stage build est utilisé
    from_entries = [entry['value'] for entry in dfp.structure if entry['instruction'] == "FROM"]
    if len(from_entries) > 1:
        compliance["Conforme"].append("Le multi-stage build est utilisé.")
    else:
        compliance["Non Conforme"].append("Le multi-stage build n'est pas utilisé.")

    # 📄 Enregistrer le rapport JSON dans configurations/
    save_report_json(compliance, "DockerFile_vulnerabilities.json")

def extract_dockerfile_info(dfp):
    """Analyse un Dockerfile et extrait les informations utiles."""
    results = {
        "Instructions": {},
        "Sécurité": [],
        "Bonne Pratique": [],
        "Version": [],
        "Labels": {},
        "Ports Exposés": [],
        "Dépendances": [],
    }

    # 🔹 1. Lister toutes les instructions utilisées
    for entry in dfp.structure:
        instr = entry['instruction']
        if instr not in results["Instructions"]:
            results["Instructions"][instr] = []
        results["Instructions"][instr].append(entry['value'])

    # 🔹 2. Vérifier l'utilisateur root
    if any(entry['instruction'] == "USER" and entry['value'].strip() == "root" for entry in dfp.structure):
        results["Sécurité"].append("L'utilisateur root est utilisé, ce qui est une faille de sécurité.")

    # 🔹 3. Vérifier les ports exposés
    sensitive_ports = {22, 23, 3389, 1521, 3306, 5432, 8080, 8443, 6379, 9200}
    for entry in dfp.structure:
        if entry['instruction'] == "EXPOSE":
            ports = entry['value'].split()
            results["Ports Exposés"].extend(ports)
            for port in ports:
                if port.isdigit() and int(port) in sensitive_ports:
                    results["Sécurité"].append(f"Port sensible exposé ({port}).")

    # 🔹 4. Vérifier les secrets dans ENV
    secret_keywords = ["password", "secret", "key", "token"]
    for entry in dfp.structure:
        if entry['instruction'] == "ENV":
            env_var = entry['value'].lower()
            if any(secret in env_var for secret in secret_keywords):
                results["Sécurité"].append(f"Secret détecté dans ENV : {entry['value']}.")

    # 🔹 5. Vérifier l'image utilisée
    if dfp.baseimage:
        results["Version"].append(f"Image utilisée : {dfp.baseimage}")
        if ":" not in dfp.baseimage:
            results["Version"].append(f"L'image `{dfp.baseimage}` ne spécifie pas de version.")
        if dfp.baseimage.endswith(":latest"):
            results["Version"].append(f"L'image `{dfp.baseimage}` utilise `:latest`, ce qui est déconseillé.")

    # 🔹 6. Vérifier l'installation des dépendances
    for entry in dfp.structure:
        if entry['instruction'] == "RUN":
            results["Dépendances"].append(entry['value'])

    # 📄 Enregistrer le rapport JSON dans configurations/
    save_report_json(results, "dockerfile_infos.json")

def save_report_json(report, filename):
    """Sauvegarde le rapport JSON dans configurations/."""
    os.makedirs(CONFIG_DIR, exist_ok=True)
    filepath = os.path.join(CONFIG_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as json_file:
        json.dump(report, json_file, indent=4, ensure_ascii=False)

    print(f"📄 Rapport JSON généré : {filepath}")

def analyze_dockerfile(dockerfile_path):
    """Exécute l'analyse du Dockerfile."""
    if not os.path.exists(dockerfile_path):
        print(f"❌ Erreur : Le fichier {dockerfile_path} est introuvable.")
        return

    with open(dockerfile_path, 'r', encoding="utf-8", errors="ignore") as f:
        content = f.read()

    dfp = DockerfileParser()
    dfp.content = content
    extract_dockerfile_info(dfp)
    check_compliance(dfp)

# 🟢 Exécuter l'analyse du Dockerfile extrait
analyze_dockerfile(DOCKERFILE_PATH)
