from flask import Flask, Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import google.generativeai as genai
import torch
from pathlib import Path
from dotenv import load_dotenv

app = Flask(__name__)
t5_base_bp = Blueprint('t5', __name__)

# === Chargement du modèle T5 fine-tuné ===
MODEL_PATH = "TahalliAnas/t5_base_ConfigFiles_fixer"
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
t5_model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH)

@t5_base_bp.route("/t5", methods=["POST"])
@jwt_required()
def correct_dockerfile():
    data = request.get_json()
    dockerfile = data.get("dockerfile", "")

    if not dockerfile.strip():
        return jsonify({"error": "Le champ 'dockerfile' est requis"}), 400

    prompt = (
        "Corrige ce Dockerfile pour qu'il soit valide et conforme aux bonnes pratiques. "
        "Retourne uniquement le Dockerfile corrigé, avec une instruction par ligne. "
        "Voici le Dockerfile à corriger :\n\n"
        f"{dockerfile}"
    )

    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = t5_model.generate(**inputs, max_length=256)
        correction = tokenizer.decode(outputs[0], skip_special_tokens=True)

    formatted_correction = "\n".join(line.strip() for line in correction.splitlines() if line.strip())
    return jsonify({"correction": formatted_correction}), 200

# === Configuration Gemini API ===
load_dotenv()
genai.configure(api_key="Ans_Gemini")
gemini_model = genai.GenerativeModel("gemini-pro")

def generate_explanation(original, corrected):
    prompt = f"""
    Voici un fichier de configuration avant et après correction :

    Ancienne version :
    {original}

    Version corrigée :
    {corrected}

    Peux-tu expliquer clairement les améliorations ligne par ligne ?
    """
    response = gemini_model.generate_content(prompt)
    return response.text
