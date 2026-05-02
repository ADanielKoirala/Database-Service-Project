from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from db import get_db
from utils import canonical_row, row_hmac, merkle_root_from_leaves, build_patient_security_values, K_MAC

patients_bp = Blueprint("patients", __name__)


@patients_bp.route("/", methods=["GET"])
@jwt_required()
def get_patients():
    claims = get_jwt()
    role = claims["role"]

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, first_name, last_name,
               gender_ct, gender_nonce,
               age_ct, age_nonce,
               weight, height, health_history,
               row_mac, leaf_hash
        FROM patients
        ORDER BY id ASC
        """
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()

    result = []
    for row in rows:
        row_id = row[0]
        first_name, last_name = row[1], row[2]
        gender_ct, gender_nonce = bytes(row[3]), bytes(row[4])
        age_ct, age_nonce = bytes(row[5]), bytes(row[6])
        weight, height = row[7], row[8]
        history = row[9]
        stored_mac = bytes(row[10])
        leaf_hash = bytes(row[11])

        msg = canonical_row(
            row_id,
            first_name,
            last_name,
            gender_ct,
            gender_nonce,
            age_ct,
            age_nonce,
            weight,
            height,
            history,
        )
        recomputed = row_hmac(K_MAC, msg)
        if recomputed != stored_mac:
            return jsonify({"msg": f"Integrity verification failed for patient row {row_id}"}), 422

        row_obj = {
            "id": row_id,
            "gender_ct": gender_ct.hex(),
            "gender_nonce": gender_nonce.hex(),
            "age_ct": age_ct.hex(),
            "age_nonce": age_nonce.hex(),
            "weight": weight,
            "height": height,
            "health_history": history,
            "row_mac": stored_mac.hex(),
            "leaf_hash": leaf_hash.hex(),
        }

        if role == "H":
            row_obj["first_name"] = first_name
            row_obj["last_name"] = last_name

        result.append(row_obj)

    return jsonify(result)


@patients_bp.route("/", methods=["POST"])
@jwt_required()
def add_patient():
    claims = get_jwt()
    if claims["role"] != "H":
        return jsonify({"msg": "Forbidden"}), 403

    data = request.json or {}
    required = ["first_name", "last_name", "gender", "age", "weight", "height", "health_history"]
    missing = [field for field in required if field not in data or data[field] in (None, "")]
    if missing:
        return jsonify({"msg": f"Missing required fields: {', '.join(missing)}"}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO patients
        (first_name, last_name, gender_ct, gender_nonce, age_ct, age_nonce,
         weight, height, health_history, row_mac, leaf_hash)
        VALUES (%s, %s, '\\x00', '\\x00', '\\x00', '\\x00', %s, %s, %s, '\\x00', '\\x00')
        RETURNING id
        """,
        (
            data["first_name"],
            data["last_name"],
            float(data["weight"]),
            float(data["height"]),
            data["health_history"],
        ),
    )
    row_id = cur.fetchone()[0]

    gender_ct, gender_nonce, age_ct, age_nonce, mac, leaf = build_patient_security_values(
        row_id,
        data["first_name"],
        data["last_name"],
        data["gender"],
        data["age"],
        float(data["weight"]),
        float(data["height"]),
        data["health_history"],
    )

    cur.execute(
        """
        UPDATE patients
        SET gender_ct=%s, gender_nonce=%s, age_ct=%s, age_nonce=%s,
            row_mac=%s, leaf_hash=%s
        WHERE id=%s
        """,
        (gender_ct, gender_nonce, age_ct, age_nonce, mac, leaf, row_id),
    )
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"msg": "Inserted", "id": row_id}), 201


@patients_bp.route("/merkle_root", methods=["GET"])
@jwt_required()
def get_merkle_root():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT leaf_hash FROM patients ORDER BY id")
    leaves = [bytes(row[0]) for row in cur.fetchall()]
    cur.close()
    conn.close()

    root = merkle_root_from_leaves(leaves)
    return jsonify({"merkle_root": root.hex() if root else None})
