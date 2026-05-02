// src/components/NavBar.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { getToken, clearAuth, getRole, isAdmin, getUsername } from '../auth';

function NavBar() {
  const navigate = useNavigate();
  const authed = !!getToken();
  const role = getRole();
  const admin = isAdmin();
  const username = getUsername();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
        >
          Secure DBaaS
        </Typography>

        {authed && (
          <Typography variant="body2" sx={{ mr: 2 }}>
            {username ? `User: ${username}` : ''} {role ? `(${role})` : ''} {admin ? ' [ADMIN]' : ''}
          </Typography>
        )}

        {authed ? (
          <>
            <Button color="inherit" component={RouterLink} to="/dashboard">
              Dashboard
            </Button>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={RouterLink} to="/login">
              Login
            </Button>
            <Button color="inherit" component={RouterLink} to="/register">
              Register
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;
