// src/pages/Register.jsx
import React, { useState } from 'react';
import { Paper, Typography, TextField, Button, Alert } from '@mui/material';
import api from '../api';

function Register() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [message, setMessage] = useState(null);
  const [severity, setSeverity] = useState('info');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await api.post('/auth/register', form);
      setSeverity('success');
      setMessage(res.data.msg || 'Registered successfully. New users start as role R.');
      setForm({ username: '', password: '' });
    } catch (err) {
      setSeverity('error');
      setMessage(err.response?.data?.msg || 'Registration failed');
    }
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="h5" gutterBottom>
        Register
      </Typography>
      {message && <Alert severity={severity} sx={{ mb: 2 }}>{message}</Alert>}
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
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Register
        </Button>
      </form>
    </Paper>
  );
}

export default Register;
