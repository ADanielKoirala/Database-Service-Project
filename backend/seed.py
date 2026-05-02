import random
from flask_bcrypt import Bcrypt

from db import get_db
from utils import build_patient_security_values

bcrypt = Bcrypt()

FIRST_NAMES = ["Alice", "Bob", "Carol", "David", "Eve", "Grace", "Helen", "James"]
LAST_NAMES = ["Smith", "Johnson", "Lee", "Brown", "Taylor", "Miller", "Wilson"]
HISTORIES = ["healthy", "diabetic", "asthma", "hypertension", "smoker", "allergies"]


def seed_users(cur):
    cur.execute("DELETE FROM users")
    users = [
        ("admin", "password123", "H", True),
        ("researcher", "password123", "R", False),
    ]
    for username, password, role, is_admin in users:
        pw_hash = bcrypt.generate_password_hash(password).decode("utf-8")
        cur.execute(
            "INSERT INTO users (username, pw_hash, role, is_admin) VALUES (%s, %s, %s, %s)",
            (username, pw_hash, role, is_admin),
        )


def seed_patients(cur, count=100):
    cur.execute("DELETE FROM patients")
    for _ in range(count):
        first_name = random.choice(FIRST_NAMES)
        last_name = random.choice(LAST_NAMES)
        gender = random.choice(["M", "F"])
        age = random.randint(18, 90)
        weight = round(random.uniform(50, 110), 1)
        height = round(random.uniform(150, 205), 1)
        history = random.choice(HISTORIES)

        cur.execute(
            """
            INSERT INTO patients
            (first_name, last_name, gender_ct, gender_nonce, age_ct, age_nonce,
             weight, height, health_history, row_mac, leaf_hash)
            VALUES (%s, %s, '\\x00', '\\x00', '\\x00', '\\x00', %s, %s, %s, '\\x00', '\\x00')
            RETURNING id
            """,
            (first_name, last_name, weight, height, history),
        )
        row_id = cur.fetchone()[0]

        gender_ct, gender_nonce, age_ct, age_nonce, mac, leaf = build_patient_security_values(
            row_id, first_name, last_name, gender, age, weight, height, history
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


def main():
    conn = get_db()
    cur = conn.cursor()
    seed_users(cur)
    seed_patients(cur)
    conn.commit()
    cur.close()
    conn.close()
    print("Seed complete: created demo users and 100 encrypted patient records.")


if __name__ == "__main__":
    main()
