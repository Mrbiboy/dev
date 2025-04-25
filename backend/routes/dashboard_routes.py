from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    user_id = get_jwt_identity()
    return jsonify({"message": f"Bienvenue, utilisateur {user_id} !"})

@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def stats():
    return jsonify({
        "policies": 12,
        "alerts": 5,
        "securityScore": 85
    }), 200

@dashboard_bp.route("/risks", methods=["GET"])
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