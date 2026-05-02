import hashlib
import hmac
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _key_from_env(name: str, default: bytes) -> bytes:
    value = os.getenv(name)
    if not value:
        return default
    raw = value.encode("utf-8")
    if len(raw) < 32:
        raw = raw.ljust(32, b"0")
    return raw[:32]


K_ENC = _key_from_env("DBAAS_ENC_KEY", b"0" * 32)
K_MAC = _key_from_env("DBAAS_MAC_KEY", b"1" * 32)


def aes_gcm_encrypt(key: bytes, plaintext: bytes):
    aes = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aes.encrypt(nonce, plaintext, None)
    return nonce, ciphertext


def aes_gcm_decrypt(key: bytes, nonce: bytes, ciphertext: bytes):
    aes = AESGCM(key)
    return aes.decrypt(nonce, ciphertext, None)


def to_bytes(value):
    if isinstance(value, memoryview):
        return value.tobytes()
    return value


def canonical_row(row_id, first_name, last_name, gender_ct, gender_nonce, age_ct, age_nonce, weight, height, history):
    """Stable byte representation used for row-level HMAC verification."""
    parts = [
        str(row_id),
        str(first_name),
        str(last_name),
        to_bytes(gender_ct).hex(),
        to_bytes(gender_nonce).hex(),
        to_bytes(age_ct).hex(),
        to_bytes(age_nonce).hex(),
        f"{float(weight):.2f}",
        f"{float(height):.2f}",
        str(history),
    ]
    return "|".join(parts).encode("utf-8")


def row_hmac(key: bytes, msg_bytes: bytes) -> bytes:
    return hmac.new(key, msg_bytes, hashlib.sha256).digest()


def merkle_parent(left: bytes, right: bytes) -> bytes:
    return hashlib.sha256(to_bytes(left) + to_bytes(right)).digest()


def merkle_leaf(mac: bytes, row_id: int) -> bytes:
    return hashlib.sha256(to_bytes(mac) + int(row_id).to_bytes(4, "big")).digest()


def merkle_root_from_leaves(leaves):
    if not leaves:
        return None

    level = [to_bytes(leaf) for leaf in leaves]
    while len(level) > 1:
        next_level = []
        for index in range(0, len(level), 2):
            left = level[index]
            right = level[index + 1] if index + 1 < len(level) else left
            next_level.append(merkle_parent(left, right))
        level = next_level
    return level[0]


def build_patient_security_values(row_id, first_name, last_name, gender, age, weight, height, history):
    gender_bytes = str(gender).encode("utf-8")
    age_bytes = str(age).encode("utf-8")
    gender_nonce, gender_ct = aes_gcm_encrypt(K_ENC, gender_bytes)
    age_nonce, age_ct = aes_gcm_encrypt(K_ENC, age_bytes)
    msg = canonical_row(row_id, first_name, last_name, gender_ct, gender_nonce, age_ct, age_nonce, weight, height, history)
    mac = row_hmac(K_MAC, msg)
    leaf = merkle_leaf(mac, row_id)
    return gender_ct, gender_nonce, age_ct, age_nonce, mac, leaf
