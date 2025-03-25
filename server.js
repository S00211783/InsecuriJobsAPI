const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const port = 3000;

// SQLite Connection
const db = new sqlite3.Database("./sas", (err) => {
    if (err) {
        console.error("Database connection error:", err.message);
    } else {
        console.log("Connected to the SQLite database.");
    }
});

app.use(cors());
app.use(express.json());

// --- USERS CRUD ---

// Create User (Unsafe)
app.post("/users", (req, res) => {
    const { name, email, password } = req.body;
    const sql = `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${password}')`;
    db.run(sql, function (err) {
        if (err) return res.status(500).json(err);
        res.json({ id: this.lastID, name, email, password });
    });
});

// Get All Users
app.get("/users", (req, res) => {
    db.all("SELECT * FROM users", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Get User by ID (Unsafe)
app.get("/users/:id", (req, res) => {
    const sql = `SELECT * FROM users WHERE id = ${req.params.id}`;
    db.get(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result || {});
    });
});

// Update User (Unsafe)
app.put("/users", (req, res) => {
    const { email, password } = req.body;
    const sql = `UPDATE users SET password='${password}' WHERE email='${email}'`;
    db.run(sql, function (err) {
        if (err) return res.status(500).json(err);
        res.json({ message: "User password updated", affectedRows: this.changes });
    });
});

// Delete User (Unsafe)
app.delete("/users/:id", (req, res) => {
    const sql = `DELETE FROM users WHERE id = ${req.params.id}`;
    db.run(sql, function (err) {
        if (err) return res.status(500).json(err);
        res.json({ message: "User deleted", affectedRows: this.changes });
    });
});

// --- JOBS CRUD ---

// Create Job (Unsafe)
app.post("/jobs", (req, res) => {
    const { title, companyName, salary, description } = req.body;
    const sql = `INSERT INTO jobs (title, companyName, salary, description) VALUES ('${title}', '${companyName}', '${salary}', '${description}')`;
    db.run(sql, function (err) {
        if (err) return res.status(500).json(err);
        res.json({ id: this.lastID, title, companyName, salary, description });
    });
});

// Get All Jobs
app.get("/jobs", (req, res) => {
    db.all("SELECT * FROM jobs", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Search Jobs by Title (Unsafe)
app.get("/jobs/search", (req, res) => {
    const searchTerm = req.query.q;
    const sql = `SELECT * FROM jobs WHERE title LIKE '%${searchTerm}%'`;
    db.all(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        res.json(results);
    });
});

// Get Job by ID (Unsafe)
app.get("/jobs/:id", (req, res) => {
    const sql = `SELECT * FROM jobs WHERE id = ${req.params.id}`;
    db.get(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result || {});
    });
});

// Update Job (Unsafe)
app.put("/jobs/:id", (req, res) => {
    const { title, companyName, salary, description } = req.body;
    const sql = `UPDATE jobs SET title='${title}', companyName='${companyName}', salary='${salary}', description='${description}' WHERE id=${req.params.id}`;
    db.run(sql, function (err) {
        if (err) return res.status(500).json(err);
        res.json({ message: "Job updated", affectedRows: this.changes });
    });
});

// Delete Job (Unsafe)
app.delete("/jobs/:id", (req, res) => {
    const sql = `DELETE FROM jobs WHERE id = ${req.params.id}`;
    db.run(sql, function (err) {
        if (err) return res.status(500).json(err);
        res.json({ message: "Job deleted", affectedRows: this.changes });
    });
});

// Insecure Login Route
app.post("/login", function (req, res) {
    const { email, password } = req.body;
    const sql = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    db.get(sql, function (err, result) {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result) {
            res.json({ success: true, user: result });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    });
});

// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
