from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
)
import psycopg2
import os
from dotenv import load_dotenv
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch
import tempfile
import subprocess
import json

# Charger les variables d'environnement
load_dotenv()

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# Vérification de la clé secrète JWT
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
if not app.config["JWT_SECRET_KEY"]:
    raise RuntimeError("Erreur : JWT_SECRET_KEY n'est pas défini dans le fichier .env")

# Configuration du JWT
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600  # Token expire en 1 heure
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = 86400  # Refresh token expire en 24 heures
jwt = JWTManager(app)

# Charger le modèle fine-tuné pour la correction de Dockerfile
MODEL_PATH = "./model"  # chemin relatif dans ton projet
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH)

@app.route("/correct-dockerfile", methods=["POST"])
@jwt_required()
def correct_dockerfile():
    data = request.get_json()
    dockerfile = data.get("dockerfile", "")

    if not dockerfile.strip():
        return jsonify({"error": "Le champ 'dockerfile' est requis"}), 400



    # Prompt optimisé
    prompt = (
        "Corrige ce Dockerfile pour qu'il soit valide et conforme aux bonnes pratiques. "
        "Retourne uniquement le Dockerfile corrigé, avec une instruction par ligne, sans texte explicatif ni paragraphe. "
        "Assure-toi que chaque instruction (comme FROM, RUN, COPY, etc.) est sur une ligne séparée et respecte la syntaxe correcte d'un Dockerfile. "
        "Voici le Dockerfile à corriger :\n\n"
        f"{dockerfile}"
    )

    # Tokenisation et génération
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)

    with torch.no_grad():
        outputs = model.generate(**inputs, max_length=256)
        correction = tokenizer.decode(outputs[0], skip_special_tokens=True)

    # Post-traitement pour s'assurer que l'output est bien formaté
    lines = correction.splitlines()
    formatted_correction = "\n".join(line.strip() for line in lines if line.strip())

    return jsonify({"correction": formatted_correction}), 200

# Connexion à PostgreSQL
def get_db_connection():
    try:
        return psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
        )
    except psycopg2.Error as e:
        print("❌ Erreur de connexion à la base de données :", e)
        return None

@app.route("/stats", methods=["GET"])
@jwt_required()
def stats():
    return jsonify({
        "policies": 12,
        "alerts": 5,
        "securityScore": 85
    }), 200

# Route pour l'inscription
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    name, email, password = data.get("name"), data.get("email"), data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "Tous les champs sont obligatoires"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Impossible de se connecter à la base de données"}), 500

    try:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO users (name, email, password) VALUES (%s, %s, %s) RETURNING id",
                        (name, email, hashed_password))
            user_id = cur.fetchone()[0]
            conn.commit()
            return jsonify({"message": "Inscription réussie", "user_id": user_id}), 201
    except psycopg2.Error as e:
        print("❌ Erreur lors de l'inscription :", e)
        return jsonify({"error": "Erreur lors de l'inscription"}), 500
    finally:
        conn.close()

# Route pour la connexion
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email, password = data.get("email"), data.get("password")

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erreur de connexion à la base de données"}), 500

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, email, password FROM users WHERE email = %s", (email,))
            user = cur.fetchone()

            if user and bcrypt.check_password_hash(user[3], password):
                access_token = create_access_token(identity=str(user[0]))
                refresh_token = create_refresh_token(identity=str(user[0]))
                return jsonify({
                    "message": "Connexion réussie",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "user": {"id": user[0], "name": user[1], "email": user[2]}
                })
            else:
                return jsonify({"error": "Identifiants incorrects"}), 401
    except psycopg2.Error as e:
        print("❌ Erreur lors de la connexion :", e)
        return jsonify({"error": "Erreur lors de la connexion"}), 500
    finally:
        conn.close()

# Route pour rafraîchir le token JWT
@app.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=user_id)
    return jsonify({"access_token": new_access_token})

# Route protégée (Dashboard)
@app.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    return jsonify({"message": f"Bienvenue, utilisateur {user_id} !"})

# Route pour récupérer les risques de sécurité
@app.route("/risks", methods=["GET"])
@jwt_required()
def get_risks():
    risks = [
        {"name": "Injection SQL", "level": 85},
        {"name": "Cross-Site Scripting (XSS)", "level": 70},
        {"name": "Fuite de données sensibles", "level": 90},
        {"name": "Attaque Man-in-the-Middle (MITM)", "level": 60},
        {"name": "Exploitation de vulnérabilités Zero-Day", "level": 95},
    ]
    return jsonify(risks), 200

# Route pour scanner un dépôt GitHub avec Semgrep
@app.route('/scan', methods=['POST'])
@jwt_required()
def scan_repo():
    try:
        data = request.get_json()
        repo_url = data.get('repo_url')

        if not repo_url:
            return jsonify({"status": "failed", "error": "Le champ 'repo_url' est requis"}), 400

        with tempfile.TemporaryDirectory() as temp_dir:
            # 1. Cloner le repo GitHub
            subprocess.run(['git', 'clone', repo_url, temp_dir], check=True)

            # 2. Exécuter Semgrep
            semgrep_result = subprocess.run(
                ['semgrep', 'scan', temp_dir, '--config=auto', '--json'],
                capture_output=True, text=True
            )

            # 3. Vérification si Semgrep s'est mal exécuté
            if semgrep_result.returncode >= 2:
                return jsonify({"status": "failed", "error": "Semgrep execution error"}), 500

            result_json = json.loads(semgrep_result.stdout)

            # 4. Vérification des vulnérabilités détectées
            findings = result_json.get("results", [])
            exit_code = 1 if findings else 0
            status = "failed" if findings else "success"

            return jsonify({
                "status": status,
                "exit_code": exit_code,
                "findings": findings
            }), 200

    except Exception as e:
        print(f"Erreur serveur: {e}")
        return jsonify({"status": "failed", "error": str(e)}), 500

# Lancer le serveur Flask
if __name__ == "__main__":
    app.run(debug=True, port=5000)