import hcl2
import re
import json
import os

# 📂 Dossier où se trouvent les fichiers extraits
CONFIG_DIR = "configurations"


def load_terraform_config(file_path):
    """Charge un fichier Terraform et retourne son contenu analysé en évitant les erreurs d'encodage."""
    if not os.path.exists(file_path):
        print(f"❌ Erreur : Le fichier {file_path} n'existe pas.")
        return {}

    with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
        return hcl2.load(file)


def format_details(data):
    """Transforme un dictionnaire ou une liste en texte lisible."""
    if isinstance(data, dict):
        return ", ".join([f"{key}: {value}" for key, value in data.items()])
    elif isinstance(data, list):
        return ", ".join([str(item) for item in data])
    return str(data)


def check_security_groups(terraform_config):
    """Vérifie les ports ouverts dans les Security Groups AWS."""
    issues, details = [], []
    for resource in terraform_config.get("resource", []):
        if "aws_security_group" in resource:
            for sg_name, sg_config in resource["aws_security_group"].items():
                for rule in sg_config.get("ingress", []):
                    details.append(
                        f"Security Group '{sg_name}' autorise {rule.get('from_port', 'Unknown')} à {rule.get('cidr_blocks', 'Unknown')}")
                    if "cidr_blocks" in rule and "0.0.0.0/0" in rule["cidr_blocks"]:
                        issues.append(f"⚠️ {sg_name} : Ouverture du port {rule['from_port']} à tout le monde.")
    return details, issues


def check_iam_policies(terraform_config):
    """Vérifie si des permissions IAM excessives sont utilisées."""
    issues, details = [], []
    for resource in terraform_config.get("resource", []):
        if "aws_iam_policy" in resource:
            for policy_name, policy_config in resource["aws_iam_policy"].items():
                formatted_policy = format_details(policy_config)
                details.append(f"Policy IAM '{policy_name}' - {formatted_policy}")
                if '"Action": "*"' in str(policy_config):
                    issues.append(f"⚠️ {policy_name} : Permission excessive (*).")
    return details, issues


def check_s3_encryption(terraform_config):
    """Vérifie si le chiffrement S3 est activé."""
    issues, details = [], []
    for resource in terraform_config.get("resource", []):
        if "aws_s3_bucket" in resource:
            for bucket_name, bucket_config in resource["aws_s3_bucket"].items():
                formatted_bucket = format_details(bucket_config)
                details.append(f"Bucket S3 '{bucket_name}' - {formatted_bucket}")
                if "server_side_encryption_configuration" not in bucket_config:
                    issues.append(f"⚠️ {bucket_name} : Pas de chiffrement activé.")
    return details, issues


def check_vpc_isolation(terraform_config):
    """Vérifie si des sous-réseaux sont publics sans passer par un NAT."""
    issues, details = [], []
    for resource in terraform_config.get("resource", []):
        if "aws_subnet" in resource:
            for subnet_name, subnet_config in resource["aws_subnet"].items():
                formatted_subnet = format_details(subnet_config)
                details.append(f"Subnet '{subnet_name}' - {formatted_subnet}")
                if subnet_config.get("map_public_ip_on_launch", False):
                    issues.append(f"⚠️ {subnet_name} : Subnet public sans protection.")
    return details, issues


def check_exposed_credentials(file_path):
    """Vérifie si des identifiants AWS sont exposés en dur."""
    issues, details = [], []
    if not os.path.exists(file_path):
        return details, issues

    with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
        for line in file:
            if re.search(r'AKIA[0-9A-Z]{16}', line):
                issues.append("⚠️ Clé AWS Access Key trouvée en dur.")
            if re.search(r'aws_secret_access_key\s*=\s*\".{40}\"', line):
                issues.append("⚠️ Clé AWS Secret Key trouvée en dur.")
            if "aws_access_key" in line or "aws_secret_key" in line:
                details.append(line.strip())

    return details, issues


def check_logging(terraform_config):
    """Vérifie si CloudTrail ou CloudWatch est activé."""
    issues, details = [], []
    details.append("Vérification des services CloudTrail et CloudWatch.")
    if not any("aws_cloudtrail" in resource for resource in terraform_config.get("resource", [])):
        issues.append("⚠️ CloudTrail n'est pas activé.")
    return details, issues


def save_report_json(report, filename):
    """Sauvegarde le rapport au format JSON dans configurations/"""
    os.makedirs(CONFIG_DIR, exist_ok=True)
    filepath = os.path.join(CONFIG_DIR, filename)

    with open(filepath, "w", encoding="utf-8") as file:
        json.dump(report, file, indent=4, ensure_ascii=False)

    print(f"📄 Rapport JSON généré : {filepath}")


def run_analysis():
    """Exécute l'analyse et génère deux rapports : complet et vulnérabilités."""
    terraform_files = [f for f in os.listdir(CONFIG_DIR) if f.endswith(".tf")]

    if not terraform_files:
        print("❌ Aucun fichier Terraform trouvé dans configurations/.")
        return

    for terraform_file in terraform_files:
        file_path = os.path.join(CONFIG_DIR, terraform_file)
        print(f"🔍 Analyse du fichier Terraform : {file_path}")

        terraform_config = load_terraform_config(file_path)

        full_report = {}
        vulnerability_report = {}

        checks = {
            "Security Groups": check_security_groups(terraform_config),
            "Permissions IAM": check_iam_policies(terraform_config),
            "Chiffrement S3": check_s3_encryption(terraform_config),
            "Isolation VPC": check_vpc_isolation(terraform_config),
            "Identifiants exposés": check_exposed_credentials(file_path),
            "Logs et Audit": check_logging(terraform_config)
        }

        for check_name, (details, issues) in checks.items():
            full_report[check_name] = details
            if issues:
                vulnerability_report[check_name] = issues

        # Générer les rapports avec le nom du fichier analysé
        save_report_json(full_report, f"{terraform_file}_rapport_complet.json")
        save_report_json(vulnerability_report, f"{terraform_file}_rapport_vulnerabilites.json")


# Lancer l'analyse
run_analysis()
