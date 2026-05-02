# auth.py
from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt,
    get_jwt_identity
)
from db import get_db

auth_bp = Blueprint("auth", __name__)
bcrypt = Bcrypt()


# --------- REGISTER ---------

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400

    pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT id FROM users WHERE username=%s", (username,))
    if cur.fetchone():
        cur.close(); conn.close()
        return jsonify({"msg": "Username already exists"}), 400

    # Default new users to role R and non-admin
    cur.execute("""
        INSERT INTO users (username, pw_hash, role, is_admin)
        VALUES (%s, %s, %s, %s)
    """, (username, pw_hash, "R", False))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"msg": "User created"}), 201


# --------- LOGIN ---------

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, pw_hash, role, is_admin
        FROM users WHERE username=%s
    """, (username,))
    row = cur.fetchone()
    cur.close()
    conn.close()

    if not row:
        return jsonify({"msg": "Bad credentials"}), 401

    user_id, pw_hash, role, is_admin = row

    if not bcrypt.check_password_hash(pw_hash, password):
        return jsonify({"msg": "Bad credentials"}), 401

    # JWT "sub" must be a STRING
    subject = str(user_id)

    # Put user attributes in additional claims
    claims = {
        "role": role,
        "is_admin": bool(is_admin),
        "username": username
    }

    token = create_access_token(identity=subject, additional_claims=claims)

    return jsonify(
        access_token=token,
        role=role,
        is_admin=bool(is_admin),
        username=username
    )


# --------- ADMIN: LIST USERS ---------

@auth_bp.route("/users", methods=["GET"])
@jwt_required()
def list_users():
    claims = get_jwt()
    if not claims.get("is_admin"):
        return jsonify({"msg": "Forbidden"}), 403

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, username, role, is_admin FROM users ORDER BY id")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    return jsonify([
        {
            "id": r[0],
            "username": r[1],
            "role": r[2],
            "is_admin": bool(r[3])
        }
        for r in rows
    ])


# --------- ADMIN: CHANGE ROLE ---------

@auth_bp.route("/users/<int:user_id>/role", methods=["PATCH"])
@jwt_required()
def update_role(user_id):
    claims = get_jwt()
    if not claims.get("is_admin"):
        return jsonify({"msg": "Forbidden"}), 403

    data = request.json or {}
    new_role = data.get("role")

    if new_role not in ("H", "R"):
        return jsonify({"msg": "Role must be 'H' or 'R'"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET role=%s WHERE id=%s", (new_role, user_id))
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"msg": "Role updated"})
