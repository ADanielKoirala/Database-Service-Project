// src/auth.js
const TOKEN_KEY = "jwt_token";
const ROLE_KEY = "user_role";
const ADMIN_KEY = "is_admin";
const USERNAME_KEY = "username";

export function getToken() {
  const t = window.localStorage.getItem(TOKEN_KEY);
  // Normalize junk values
  if (!t || t === "null" || t === "undefined") return null;
  return t;
}

export function setToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
  window.localStorage.removeItem(ADMIN_KEY);
  window.localStorage.removeItem(USERNAME_KEY);
}

export function setRole(role) {
  window.localStorage.setItem(ROLE_KEY, role);
}

export function getRole() {
  return window.localStorage.getItem(ROLE_KEY);
}

export function setIsAdmin(isAdmin) {
  window.localStorage.setItem(ADMIN_KEY, isAdmin ? "true" : "false");
}

export function isAdmin() {
  return window.localStorage.getItem(ADMIN_KEY) === "true";
}

export function setUsername(username) {
  window.localStorage.setItem(USERNAME_KEY, username);
}

export function getUsername() {
  return window.localStorage.getItem(USERNAME_KEY);
}
