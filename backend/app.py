from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from auth import auth_bp
from config import config
from patients import patients_bp

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = config.jwt_secret_key
app.config["JWT_TOKEN_LOCATION"] = ["headers"]
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"

CORS(app, resources={r"/*": {"origins": config.allowed_origins}})
jwt = JWTManager(app)


@jwt.invalid_token_loader
def invalid_token_callback(msg):
    return jsonify({"msg": f"Invalid token: {msg}"}), 422


@jwt.unauthorized_loader
def missing_token_callback(msg):
    return jsonify({"msg": f"Missing token: {msg}"}), 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"msg": "Token expired"}), 401


@app.get("/health")
def health_check():
    return jsonify({"status": "ok"})


app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(patients_bp, url_prefix="/patients")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
