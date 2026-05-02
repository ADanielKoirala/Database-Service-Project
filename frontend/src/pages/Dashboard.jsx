// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  Box,
  Chip,
  Stack,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import api from "../api";
import { getRole, isAdmin, getToken } from "../auth";

function Dashboard() {
  const token = getToken();
  const role = getRole();
  const admin = isAdmin();

  // If not logged in, just show a prompt and stop here
  if (!token) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Dashboard
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }}>
          You must be logged in to view dashboard information.{" "}
          Please use the <strong>Login</strong> option in the navigation bar.
        </Alert>
        <Typography variant="body2" sx={{ mt: 2 }}>
          Once logged in, this page will display:
        </Typography>
        <ul>
          <li>Patient records (with encrypted fields and integrity metadata)</li>
          <li>User roles (H / R) and admin controls (if you are an admin)</li>
          <li>Merkle tree integrity info for query results</li>
        </ul>
      </Paper>
    );
  }

  // ---------- existing dashboard logic below ----------

  const [patients, setPatients] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [merkleData, setMerkleData] = useState(null);
  const [merkleRootOnly, setMerkleRootOnly] = useState(null);

  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newPatient, setNewPatient] = useState({
    first_name: "",
    last_name: "",
    gender: "M",
    age: "",
    weight: "",
    height: "",
    health_history: "",
  });

  const [userUpdateMessage, setUserUpdateMessage] = useState(null);

  const loadPatients = async () => {
    setError(null);
    try {
      const res = await api.get("/patients/");
      setPatients(res.data);
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load patients");
    }
  };

  const loadUsers = async () => {
    if (!admin) return;
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data);
    } catch {
      // ignore
    }
  };

  const loadMerkleRoot = async () => {
    try {
      const res = await api.get("/patients/merkle_root");
      // backend currently returns { merkle_root: "..." }
      setMerkleRootOnly(res.data.merkle_root || res.data.root || null);
    } catch {
      setMerkleRootOnly(null);
    }
  };

  useEffect(() => {
    loadPatients();
    loadUsers();
    loadMerkleRoot();
  }, []);

  const summary = useMemo(() => {
    const totalUsers = users.length;
    const numH = users.filter((u) => u.role === "H").length;
    const numR = users.filter((u) => u.role === "R").length;
    const totalPatients = patients.length;
    return { totalUsers, numH, numR, totalPatients };
  }, [users, patients]);

  const patientColumns = [
    { field: "id", headerName: "ID", width: 70 },
    role === "H"
      ? { field: "first_name", headerName: "First Name", width: 120 }
      : null,
    role === "H"
      ? { field: "last_name", headerName: "Last Name", width: 120 }
      : null,
    { field: "weight", headerName: "Weight", width: 90 },
    { field: "height", headerName: "Height", width: 90 },
    { field: "health_history", headerName: "Health History", width: 180 },
    {
      field: "row_mac",
      headerName: "Row MAC",
      width: 200,
      valueGetter: (params) =>
        params?.row?.row_mac ? params.row.row_mac.slice(0, 16) + "…" : "",
    },
    {
      field: "leaf_hash",
      headerName: "Leaf Hash",
      width: 200,
      valueGetter: (params) =>
        params?.row?.leaf_hash ? params.row.leaf_hash.slice(0, 16) + "…" : "",
    },
  ].filter(Boolean);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      setUserUpdateMessage(`Updated user ${userId} to role ${newRole}`);
      loadUsers();
    } catch {
      setUserUpdateMessage("Failed to update role");
    }
  };

  const userColumns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "username", headerName: "Username", width: 140 },
    { field: "role", headerName: "Role", width: 80 },
    {
      field: "is_admin",
      headerName: "Admin",
      width: 80,
      // SAFEGUARD: params.row can be undefined during some internal calls
      valueGetter: (params) =>
        params?.row && params.row.is_admin ? "Yes" : "No",
    },
    {
      field: "actions",
      headerName: "Set Role",
      width: 160,
      renderCell: (params) => {
        const row = params?.row;
        if (!row) return null;
        const currentRole = row.role || "";
        const id = row.id;
        if (!id) return null;
        return (
          <TextField
            select
            size="small"
            value={currentRole}
            onChange={(e) => handleRoleChange(id, e.target.value)}
          >
            <MenuItem value="H">H</MenuItem>
            <MenuItem value="R">R</MenuItem>
          </TextField>
        );
      },
    },
  ];

  const openAddPatientDialog = () => {
    setOpenAddDialog(true);
  };

  const closeAddPatientDialog = () => {
    setOpenAddPatientDialog(false);
  };

  const handleNewPatientChange = (e) => {
    setNewPatient((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleAddPatient = async () => {
    try {
      const payload = {
        first_name: newPatient.first_name,
        last_name: newPatient.last_name,
        gender: newPatient.gender,
        age: parseInt(newPatient.age, 10),
        weight: parseFloat(newPatient.weight),
        height: parseFloat(newPatient.height),
        health_history: newPatient.health_history,
      };
      await api.post("/patients/", payload);
      closeAddPatientDialog();
      setNewPatient({
        first_name: "",
        last_name: "",
        gender: "M",
        age: "",
        weight: "",
        height: "",
        health_history: "",
      });
      loadPatients();
      loadMerkleRoot();
    } catch {
      alert("Failed to add patient. Please check required fields and backend logs.");
    }
  };

  const handleRowClick = async (params) => {
  const row = params.row;
  setSelectedPatient(row);

  try {
    // Use the existing merkle_root endpoint
    const res = await api.get("/patients/merkle_root");
    const root = res.data.merkle_root || res.data.root || null;

    setMerkleData({
      root,
      proof: [], // we aren't returning full proofs from the backend
      leaf_hash:
        row.leaf_hash ||
        "(leaf hash not exposed to client – see report for how it would be used)",
    });
  } catch (e) {
    console.error("Error loading Merkle info:", e);
    setMerkleData(null);
  }
};


  const hasPatients = patients.length > 0;
  const hasUsers = users.length > 0;

  return (
    <Grid container spacing={3}>
      {/* Overview */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Overview
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label={`Total users: ${summary.totalUsers}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`H users: ${summary.numH}`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`R users: ${summary.numR}`}
              color="warning"
              variant="outlined"
            />
            <Chip
              label={`Patients: ${summary.totalPatients}`}
              color="secondary"
              variant="outlined"
            />
            <Chip
              label={
                merkleRootOnly
                  ? `Merkle root: ${merkleRootOnly.slice(0, 12)}…`
                  : "Merkle tree: not built yet"
              }
              variant="outlined"
            />
          </Stack>
        </Paper>
      </Grid>

      {/* Patients section */}
      <Grid item xs={12} md={admin ? 8 : 12}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography variant="h6">Patients</Typography>
            <Box>
              <Button variant="outlined" onClick={loadPatients} sx={{ mr: 1 }}>
                Reload
              </Button>
              {role === "H" && (
                <Button variant="contained" onClick={openAddPatientDialog}>
                  Add Patient
                </Button>
              )}
            </Box>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}

          {hasPatients ? (
            <div style={{ height: 420 }}>
              <DataGrid
                rows={patients}
                columns={patientColumns}
                pageSizeOptions={[5, 10, 20]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                onRowClick={handleRowClick}
              />
            </div>
          ) : (
            <Box sx={{ p: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                No patients found yet.
              </Alert>
              <Typography variant="body2">You can:</Typography>
              <ul>
                {role === "H" ? (
                  <li>
                    Use the <strong>Add Patient</strong> button to insert a new
                    record.
                  </li>
                ) : (
                  <li>
                    Ask an H-role user or admin to insert some patient data or
                    run the seeding script.
                  </li>
                )}
                <li>
                   demonstrates the system’s behavior when the DB returns an empty result set.
                </li>
              </ul>
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Right: admin panel + Merkle */}
      {admin && (
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Management (Admin)
            </Typography>
            {userUpdateMessage && (
              <Alert severity="info" sx={{ mb: 1 }}>
                {userUpdateMessage}
              </Alert>
            )}
            {hasUsers ? (
              <div style={{ height: 260 }}>
                <DataGrid
                  rows={users}
                  columns={userColumns}
                  pageSizeOptions={[5, 10]}
                  initialState={{
                    pagination: { paginationModel: { pageSize: 5 } },
                  }}
                />
              </div>
            ) : (
              <Box sx={{ p: 1 }}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  No users found yet (besides you).
                </Alert>
                <Typography variant="body2">
                  As admin, you can:
                </Typography>
                <ul>
                  <li>Have new users self-register (they start as role R).</li>
                  <li>
                    Promote trusted users to role H here when they appear in
                    this table.
                  </li>
                </ul>
              </Box>
            )}
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Merkle Integrity
            </Typography>
            {!selectedPatient || !merkleData ? (
              <Typography variant="body2">
                Click a patient row on the left to view its Merkle leaf and
                proof (if any).
              </Typography>
            ) : (
              <>
                <Typography
                  variant="body2"
                  sx={{ wordBreak: "break-all" }}
                >
                  <strong>Merkle Root:</strong> {merkleData.root}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ wordBreak: "break-all", mt: 1 }}
                >
                  <strong>Leaf Hash:</strong> {merkleData.leaf_hash}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Proof hashes:</strong>
                </Typography>
                <ul style={{ maxHeight: 120, overflowY: "auto" }}>
                  {merkleData.proof.map((h, idx) => (
                    <li key={idx}>
                      <code style={{ fontSize: "0.8em" }}>{h}</code>
                    </li>
                  ))}
                </ul>
                <Typography variant="caption">
                  A client can recompute the path from leaf to root to detect
                  tampering or dropped rows.
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
      )}

      {/* Add patient dialog */}
      <Dialog
        open={openAddDialog}
        onClose={closeAddPatientDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add Patient (H only)</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="First Name"
            name="first_name"
            value={newPatient.first_name}
            onChange={handleNewPatientChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Last Name"
            name="last_name"
            value={newPatient.last_name}
            onChange={handleNewPatientChange}
          />
          <TextField
            fullWidth
            select
            margin="normal"
            label="Gender"
            name="gender"
            value={newPatient.gender}
            onChange={handleNewPatientChange}
          >
            <MenuItem value="M">M</MenuItem>
            <MenuItem value="F">F</MenuItem>
          </TextField>
          <TextField
            fullWidth
            margin="normal"
            label="Age"
            name="age"
            value={newPatient.age}
            onChange={handleNewPatientChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Weight"
            name="weight"
            value={newPatient.weight}
            onChange={handleNewPatientChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Height"
            name="height"
            value={newPatient.height}
            onChange={handleNewPatientChange}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            margin="normal"
            label="Health History"
            name="health_history"
            value={newPatient.health_history}
            onChange={handleNewPatientChange}
          />
          <Typography variant="caption">
            The backend encrypts age and gender, computes the row MAC, and updates the Merkle leaf before storage.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddPatientDialog}>Cancel</Button>
          <Button onClick={handleAddPatient} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}

export default Dashboard;
