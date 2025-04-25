from flask import Flask, request, jsonify, Blueprint
import os
import tempfile
import zipfile
import subprocess
import shutil
import stat
from handlers.checkov_handler import run_checkov_on_dir

app = Flask(__name__)

checkov_bp = Blueprint('checkov', __name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@checkov_bp.route("/checkov", methods=["POST"])
def validate():
    input_type = request.form.get("input_type")

    # --- Gestion JSON : code direct ou repo_url ---
    if not input_type and request.is_json:
        data = request.get_json()

        # 🎯 Code direct avec framework (depuis React)
        if "content" in data:
            framework = data.get("framework", "terraform")  # fallback par défaut
            extension = {
                "terraform": ".tf",
                "kubernetes": ".yaml",
                "dockerfile": "Dockerfile"
            }.get(framework, ".tf")

            temp_dir = tempfile.mkdtemp()

            if extension == "Dockerfile":
                temp_file_path = os.path.join(temp_dir, "Dockerfile")
            else:
                temp_file_path = os.path.join(temp_dir, f"input{extension}")

            with open(temp_file_path, "w", encoding="utf-8") as f:
                f.write(data["content"])

            result = run_checkov_on_dir(temp_file_path, is_file=True)
            return jsonify(result)

        # 📦 Repo GitHub
        if "repo_url" in data:
            input_type = "repo"
            request.form = data  # simulation d'un form pour compatibilité

    # --- Fichier unique ---
    if input_type == "file" and "file" in request.files:
        file = request.files["file"]
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        result = run_checkov_on_dir(file_path, is_file=True)
        return jsonify(result)

    # --- ZIP ---
    elif input_type == "zip" and "file" in request.files:
        file = request.files["file"]
        temp_dir = tempfile.mkdtemp()
        zip_path = os.path.join(temp_dir, file.filename)
        file.save(zip_path)

        try:
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(temp_dir)
        except zipfile.BadZipFile:
            return jsonify({"error": "Le fichier ZIP est invalide."}), 400

        macosx_path = os.path.join(temp_dir, "__MACOSX")
        if os.path.exists(macosx_path):
            shutil.rmtree(macosx_path)

        if not any(
            f.endswith(('.tf', '.yaml', '.yml')) or f == "Dockerfile"
            for _, _, files in os.walk(temp_dir)
            for f in files
        ):
            return jsonify({"error": "Aucun fichier scannable trouvé dans l’archive."}), 400

        result = run_checkov_on_dir(temp_dir, is_file=False)

        return jsonify(result)

    # --- Repo GitHub ---
    elif input_type == "repo":
        repo_url = request.form.get("repo_url") or (request.json and request.json.get("repo_url"))
        if not repo_url:
            return jsonify({"error": "repo_url est requis."}), 400

        temp_dir = tempfile.mkdtemp()

        try:
            subprocess.run(
                ["git", "clone", repo_url, temp_dir],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            git_dir = os.path.join(temp_dir, ".git")
            if os.path.exists(git_dir):
                def remove_readonly(func, path, _):
                    os.chmod(path, stat.S_IWRITE)
                    func(path)
                shutil.rmtree(git_dir, onerror=remove_readonly)

        except subprocess.CalledProcessError as e:
            return jsonify({
                "error": "Échec du clonage du dépôt GitHub.",
                "details": e.stderr
            }), 400

        result = run_checkov_on_dir(temp_dir, is_file=False)
        return jsonify(result)

    # --- Erreur générique ---
    return jsonify({"error": "Type d'entrée invalide. Utilisez 'file', 'zip', 'repo' ou 'content'."}), 400
