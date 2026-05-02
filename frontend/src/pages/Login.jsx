// src/pages/Login.jsx
import React, { useState } from "react";
import { Paper, Typography, TextField, Button, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { setToken, setRole, setIsAdmin, setUsername } from "../auth";

function Login() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState(null);
  const [severity, setSeverity] = useState("info");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.post("/auth/login", form);
      // backend should return: { access_token, role, is_admin, username }
      setToken(res.data.access_token);
      if (res.data.role) setRole(res.data.role);
      setIsAdmin(res.data.is_admin);
      setUsername(res.data.username);

      setSeverity("success");
      setMessage("Login successful. Returning to home...");
      setTimeout(() => {
        navigate("/");
      }, 400);
    } catch (err) {
      setSeverity("error");
      setMessage(err.response?.data?.msg || "Login failed");
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 400, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        Login
      </Typography>
      {message && (
        <Alert severity={severity} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          margin="normal"
          label="Username"
          name="username"
          value={form.username}
          onChange={handleChange}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <Button type="submit" variant="contained" sx={{ mt: 2 }} fullWidth>
          Login
        </Button>
      </form>
    </Paper>
  );
}

export default Login;
