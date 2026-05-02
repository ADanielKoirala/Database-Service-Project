// src/pages/Home.jsx
import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText } from '@mui/material';

function Home() {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Secure DBaaS Demo
      </Typography>
      <Typography gutterBottom>
        This UI sits on top of Flask + PostgreSQL backend to demonstrate:
      </Typography>
      <List>
        <ListItem>
          <ListItemText primary="User authentication with hashed passwords" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Role-based access control (H vs R)" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Encrypted sensitive fields (gender, age)" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Query integrity via MACs and Merkle proofs" />
        </ListItem>
      </List>
      <Typography variant="body2" sx={{ mt: 2 }}>
        Use Register to create an account, Login to get a token, then Dashboard to view data.
      </Typography>
    </Paper>
  );
}

export default Home;
