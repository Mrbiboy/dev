from flask import Flask, request, jsonify, url_for, redirect,Blueprint
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
from google_auth_oauthlib.flow import Flow
from google.oauth2 import id_token
from google.auth.transport.requests import Request
from datetime import datetime, timedelta, timezone
import re
import requests
from checkov import checkov_bp

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

# Google OAuth 2.0 configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = "http://localhost:5000/auth/google/callback"  # Must match Google Console
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    raise RuntimeError("Erreur : GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET n'est pas défini dans le fichier .env")

# OAuth 2.0 Flow configuration
SCOPES = ["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"]
app.register_blueprint(checkov_bp , url_prefix ="/api")
# # Charger le modèle fine-tuné pour la correction de Dockerfile
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

    # ✅ Vérifier que tous les champs sont présents
    if not name or not email or not password:
        return jsonify({"error": "Tous les champs sont obligatoires"}), 400

    # ✅ Validation email
    email_regex = r"[^@]+@[^@]+\.[^@]+"
    if not re.match(email_regex, email):
        return jsonify({"error": "Adresse email invalide"}), 400

    # ✅ Vérification mot de passe : minimum 6 caractères
    if len(password) < 5:
        return jsonify({"error": "Le mot de passe doit contenir au moins 5 caractères"}), 400

    # (Optionnel) Nettoyage du nom pour éviter XSS
    name = name.strip()

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Impossible de se connecter à la base de données"}), 500

    try:
        with conn.cursor() as cur:
            # ✅ Vérifie si l’email existe déjà
            cur.execute("SELECT id FROM users_test WHERE email = %s or name = %s", (email, name))
            if cur.fetchone():
                return jsonify({"error": "Un compte avec cet email existe déjà"}), 409

            # ✅ Insertion
            cur.execute(
                "INSERT INTO users_test (name, email, password) VALUES (%s, %s, %s) RETURNING id",
                (name, email, hashed_password)
            )
            user_id = cur.fetchone()[0]
            conn.commit()
            return jsonify({"message": "Inscription réussie", "user_id": user_id}), 201

    except psycopg2.Error as e:
        print("❌ Erreur lors de l'inscription :", e)
        return jsonify({"error": "Erreur lors de l'inscription"}), 500

    finally:
        conn.close()

# Route pour la connexion
# Dictionnaire en mémoire pour stocker les tentatives de connexion
login_attempts = {}
MAX_ATTEMPTS = 5
BLOCK_DURATION = timedelta(minutes=4)

@app.route("/login", methods=["POST"])
def login():
    ip = request.remote_addr
    now = datetime.now(timezone.utc)  # Fixed deprecation warning (see below)

    # Initialiser si cette IP est inconnue
    if ip not in login_attempts:
        login_attempts[ip] = {"count": 0, "last_attempt": now, "blocked_until": None}

    attempt = login_attempts[ip]

    # Vérifier si l'IP est actuellement bloquée
    if attempt["blocked_until"] and now < attempt["blocked_until"]:
        return jsonify({"error": "Trop de tentatives échouées. Réessayez dans quelques minutes."}), 429

    # 📥 Récupération des données
    data = request.get_json()
    email, password = data.get("email"), data.get("password")

    # ✅ Validation des champs email et password
    if not email or not password:
        return jsonify({"error": "Email et mot de passe sont requis."}), 400
    email_regex = r"[^@]+@[^@]+\.[^@]+"
    if not re.match(email_regex, email):
        return jsonify({"error": "Adresse email invalide."}), 400

    if len(password) < 5:
        return jsonify({"error": "Le mot de passe doit contenir au moins 6 caractères."}), 400

    # 🔌 Connexion à la base de données
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erreur de connexion à la base de données"}), 500

    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, email, password FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
            print(user)

            # Vérifier les identifiants
            if user and bcrypt.check_password_hash(user[3], password):
                # Réinitialiser les tentatives après une connexion réussie
                login_attempts[ip] = {"count": 0, "last_attempt": None, "blocked_until": None}

                access_token = create_access_token(identity=str(user[0]))
                refresh_token = create_refresh_token(identity=str(user[0]))

                return jsonify({
                    "message": "Connexion réussie",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "user": {"id": user[0], "name": user[1], "email": user[2]}
                })
            else:
                # Incrémenter les tentatives en cas d'échec
                attempt["count"] += 1
                attempt["last_attempt"] = now

                if attempt["count"] >= MAX_ATTEMPTS:
                    attempt["blocked_until"] = now + BLOCK_DURATION
                    return jsonify({"error": "Trop de tentatives. Compte bloqué temporairement."}), 429

                return jsonify({"error": "Identifiants incorrects"}), 401

    except psycopg2.Error as e:
        print("❌ Erreur lors de la connexion :", e)
        return jsonify({"error": "Erreur interne"}), 500

    finally:
        conn.close()

@app.route("/auth/github")
def github_login():
    # Redirect to GitHub authorization page
    github_auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&scope=repo user:email"  # Request repo and email access
        f"&redirect_uri=http://localhost:5000/auth/github/callback"
    )
    return redirect(github_auth_url)

@app.route("/auth/github/callback")
def github_callback():
    try:
        code = request.args.get("code")
        if not code:
            return jsonify({"error": "Code d'autorisation manquant"}), 400

        # Exchange code for access token
        token_url = "https://github.com/login/oauth/access_token"
        payload = {
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code
        }
        headers = {"Accept": "application/json"}
        response = requests.post(token_url, json=payload, headers=headers)
        token_data = response.json()

        if "error" in token_data:
            return jsonify({"error": "Échec de l'échange de code"}), 400

        access_token = token_data["access_token"]

        # Get user info
        user_response = requests.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_data = user_response.json()

        email_response = requests.get(
            "https://api.github.com/user/emails",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        emails = email_response.json()
        email = next((e["email"] for e in emails if e["primary"] and e["verified"]), None)

        if not email:
            return jsonify({"error": "Email non vérifié"}), 400

        name = user_data.get("name", user_data.get("login", "GitHub User"))
        github_id = str(user_data["id"])

        # Database operations
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Erreur connexion DB"}), 500

        try:
            with conn.cursor() as cur:
                # Check if user exists in users_test
                cur.execute(
                    "SELECT id, name, email, password FROM users_test WHERE email = %s",
                    (email,)
                )
                user = cur.fetchone()

                if user:
                    user_id = user[0]
                    needs_password = user[3] is None
                else:
                    # Insert into users_test
                    cur.execute(
                        "INSERT INTO users_test (name, email, created_at) VALUES (%s, %s, CURRENT_TIMESTAMP) RETURNING id",
                        (name, email)
                    )
                    user_id = cur.fetchone()[0]
                    needs_password = True

                # Check if github_id exists in github_users
                cur.execute(
                    "SELECT user_id FROM github_users WHERE github_id = %s",
                    (github_id,)
                )
                github_user = cur.fetchone()

                if not github_user:
                    # Insert into github_users
                    cur.execute(
                        "INSERT INTO github_users (user_id, github_id, access_token, created_at) "
                        "VALUES (%s, %s, %s, CURRENT_TIMESTAMP)",
                        (user_id, github_id, access_token)
                    )

                conn.commit()

                # Generate JWT tokens
                jwt_access_token = create_access_token(identity=str(user_id))
                jwt_refresh_token = create_refresh_token(identity=str(user_id))

                # Redirect to frontend
                frontend_url = (
                    f"http://localhost:3000/auth/github/callback"
                    f"?access_token={jwt_access_token}"
                    f"&refresh_token={jwt_refresh_token}"
                    f"&user_id={user_id}"
                    f"&name={name}"
                    f"&email={email}"
                    f"&needs_password={str(needs_password).lower()}"
                )
                return redirect(frontend_url)

        except psycopg2.Error as e:
            print("❌ Erreur PostgreSQL:", e)
            conn.rollback()
            return jsonify({"error": "Erreur base de données"}), 500
        finally:
            conn.close()

    except Exception as e:
        print("❌ Erreur GitHub OAuth:", e)
        return jsonify({"error": "Erreur d'authentification"}), 500
    

@app.route("/github/repos", methods=["GET"])
@jwt_required()
def get_github_repos():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erreur connexion DB"}), 500

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT access_token FROM github_users WHERE user_id = %s",
                (user_id,)
            )
            result = cur.fetchone()
            if not result:
                return jsonify({"error": "Compte GitHub non lié"}), 404
            access_token = result[0]

        # Fetch repos from GitHub
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get("https://api.github.com/user/repos", headers=headers)
        if response.status_code != 200:
            return jsonify({"error": "Échec récupération dépôts"}), 400

        repos = response.json()
        repo_data = [
            {
                "name": repo["name"],
                "full_name": repo["full_name"],
                "description": repo.get("description", ""),
                "html_url": repo["html_url"],
                "has_dependabot": False  # Placeholder for security check
            }
            for repo in repos
        ]
        return jsonify(repo_data)

    except psycopg2.Error as e:
        print("❌ Erreur PostgreSQL:", e)
        return jsonify({"error": "Erreur base de données"}), 500
    finally:
        conn.close()

@app.route("/github/validate-token", methods=["POST"])
@jwt_required()
def validate_github_token():
    user_id = get_jwt_identity()
    data = request.get_json()
    token = data.get("token")
    selected_repos = data.get("selected_repos", [])

    if not token:
        return jsonify({"error": "Jeton requis"}), 400

    # Validate token
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get("https://api.github.com/user", headers=headers)
    if response.status_code != 200:
        return jsonify({"error": "Jeton invalide"}), 400

    user_data = response.json()
    github_id = str(user_data["id"])

    # Fetch repos to confirm access
    repos_response = requests.get("https://api.github.com/user/repos", headers=headers)
    if repos_response.status_code != 200:
        return jsonify({"error": "Échec récupération dépôts"}), 400
    repos = repos_response.json()

    # Filter selected repos (if provided)
    repo_data = [
        {
            "name": repo["name"],
            "full_name": repo["full_name"],
            "description": repo.get("description", ""),
            "html_url": repo["html_url"]
        }
        for repo in repos
        if not selected_repos or repo["full_name"] in selected_repos
    ]

    # Store token in github_users
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erreur connexion DB"}), 500

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT user_id FROM github_users WHERE user_id = %s",
                (user_id,)
            )
            exists = cur.fetchone()
            if exists:
                cur.execute(
                    "UPDATE github_users SET access_token = %s, github_id = %s WHERE user_id = %s",
                    (token, github_id, user_id)
                )
            else:
                cur.execute(
                    "INSERT INTO github_users (user_id, github_id, access_token, created_at) "
                    "VALUES (%s, %s, %s, CURRENT_TIMESTAMP)",
                    (user_id, github_id, token)
                )
            conn.commit()
        return jsonify({"message": "Jeton validé", "repos": repo_data})
    except psycopg2.Error as e:
        print("❌ Erreur PostgreSQL:", e)
        conn.rollback()
        return jsonify({"error": "Erreur base de données"}), 500
    finally:
        conn.close()

# Route to initiate Google OAuth
@app.route("/auth/google", methods=["GET"])
def google_login():
    flow = Flow.from_client_config(
        {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uris": [GOOGLE_REDIRECT_URI],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        },
        scopes=SCOPES
    )
    flow.redirect_uri = GOOGLE_REDIRECT_URI
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )
    # Store state in session if needed for validation
    return jsonify({"authorization_url": authorization_url})

# Callback route for Google OAuth
@app.route("/auth/google/callback", methods=["GET"])
def google_callback():
    try:
        # Get the authorization code from Google
        code = request.args.get("code")
        if not code:
            return jsonify({"error": "Code d'autorisation manquant"}), 400

        # Exchange code for tokens
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uris": [GOOGLE_REDIRECT_URI],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=SCOPES
        )
        flow.redirect_uri = GOOGLE_REDIRECT_URI
        flow.fetch_token(code=code)

        # Get user info from ID token
        credentials = flow.credentials
        id_info = id_token.verify_oauth2_token(
            credentials.id_token, Request(), GOOGLE_CLIENT_ID
        )

        email = id_info.get("email")
        name = id_info.get("name", "Utilisateur Google")

        # Check if user exists in the database
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Erreur de connexion à la base de données"}), 500

        try:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name, email, password FROM users_test WHERE email = %s", (email,))
                user = cur.fetchone()

                if user:
                    user_id = user[0]
                    needs_password = user[3] is None  # Check if password is NULL
                else:
                    # Create a new user (no password for Google users initially)
                    cur.execute(
                        "INSERT INTO users_test (name, email) VALUES (%s, %s) RETURNING id",
                        (name, email)
                    )
                    user_id = cur.fetchone()[0]
                    conn.commit()
                    needs_password = True  # New user needs to set a password

                # Generate JWT tokens
                access_token = create_access_token(identity=str(user_id))
                refresh_token = create_refresh_token(identity=str(user_id))

                # Redirect to frontend with tokens and needs_password flag
                frontend_url = (
                    f"http://localhost:3000/auth/google/callback"
                    f"?access_token={access_token}"
                    f"&refresh_token={refresh_token}"
                    f"&user_id={user_id}"
                    f"&name={name}"
                    f"&email={email}"
                    f"&needs_password={str(needs_password).lower()}"
                )
                return redirect(frontend_url)

        except psycopg2.Error as e:
            print("❌ Erreur lors de l'authentification Google :", e)
            return jsonify({"error": "Erreur lors de l'authentification"}), 500
        finally:
            conn.close()

    except Exception as e:
        print("❌ Erreur Google OAuth :", e)
        return jsonify({"error": "Erreur lors de l'authentification Google"}), 500

# New route to set password
@app.route("/set-password", methods=["POST"])
@jwt_required()
def set_password():
    user_id = get_jwt_identity()
    data = request.get_json()
    password = data.get("password")

    if not password:
        return jsonify({"error": "Le mot de passe est requis"}), 400

    if len(password) < 5:
        return jsonify({"error": "Le mot de passe doit contenir au moins 5 caractères"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Erreur de connexion à la base de données"}), 500

    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users_test SET password = %s WHERE id = %s",
                (hashed_password, user_id)
            )
            if cur.rowcount == 0:
                return jsonify({"error": "Utilisateur non trouvé"}), 404
            conn.commit()
            return jsonify({"message": "Mot de passe défini avec succès"}), 200
    except psycopg2.Error as e:
        print("❌ Erreur lors de la définition du mot de passe :", e)
        return jsonify({"error": "Erreur lors de la définition du mot de passe"}), 500
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