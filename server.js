const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const {xss} = require('express-xss-sanitizer');
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;
const crypto = require("crypto");
const bcrypt = require("bcrypt");

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
app.use(xss());

const secretKey = "bdd0a5d39a2ccc0f7d0eb5de8ce163177dc508e4955c76020708e451442e42da";

// Mock email sender setup (replace with real SMTP details)
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "matthewblain76@gmail.com",
        pass: "ljgx nbfi glmf rlsn",
    },
});

function adminAuth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token

    if (!token) {
        return res.status(403).json({ error: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        console.log("Decoded Token:", decoded); // Debugging
        req.user = decoded;
        next();
    } catch (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}


// --- USERS CRUD ---

// Create User (Safe)
app.post("/users", (req, res) => {
    const { name, email, password } = req.body;
    const sql = `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`;
    db.run(sql, [name, email, password], function (err) {
        if (err) return res.status(500).json(err);
        res.json({ id: this.lastID, name, email });
    });
});

// Get All Users
app.get("/users", adminAuth, (req, res) => {
    db.all("SELECT * FROM users", [], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Get User by ID (Safe)
app.get("/users/:id", adminAuth, (req, res) => {
    const sql = `SELECT * FROM users WHERE id = ?`;
    db.get(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result || {});
    });
});

// Update User (Safe)
app.put("/users", adminAuth, (req, res) => {
    const { email, password } = req.body;
    const sql = `UPDATE users SET password = ? WHERE email = ?`;
    db.run(sql, [password, email], function (err) {
        if (err) return res.status(500).json(err);
        res.json({ message: "User password updated", affectedRows: this.changes });
    });
});

// Delete User (Safe)
app.delete("/users/:id", adminAuth, (req, res) => {
    const sql = `DELETE FROM users WHERE id = ?`;
    db.run(sql, [req.params.id], function (err) {
        if (err) return res.status(500).json(err);
        res.json({ message: "User deleted", affectedRows: this.changes });
    });
});

// --- JOBS CRUD ---

// Create Job (Safe)
app.post("/jobs", (req, res) => {
    const { title, companyName, salary, description } = req.body;
    const sql = `INSERT INTO jobs (title, companyName, salary, description) VALUES (?, ?, ?, ?)`;
    db.run(sql, [title, companyName, salary, description], function (err) {
        if (err) return res.status(500).json(err);
        res.json({ id: this.lastID, title, companyName, salary, description });
    });
});

// Get All Jobs
app.get("/jobs", (req, res) => {
    db.all("SELECT * FROM jobs", [], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Search Jobs by Title (Safe)
app.get("/jobs/search", (req, res) => {
    const searchTerm = `%${req.query.q}%`;
    const sql = `SELECT * FROM jobs WHERE title LIKE ?`;
    db.all(sql, [searchTerm], (err, results) => {
        if (err) return res.status(500).json({ error: "Internal Server Error" });
        res.json(results);
    });
});

// Get Job by ID (Safe)
app.get("/jobs/:id", adminAuth, (req, res) => {
    const sql = `SELECT * FROM jobs WHERE id = ?`;
    db.get(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result || {});
    });
});

// Update Job (Safe)
app.put("/jobs/:id", adminAuth, (req, res) => {
    const { title, companyName, salary, description } = req.body;
    const sql = `UPDATE jobs SET title = ?, companyName = ?, salary = ?, description = ? WHERE id = ?`;
    db.run(sql, [title, companyName, salary, description, req.params.id], function (err) {
        if (err) return res.status(500).json(err);
        res.json({ message: "Job updated", affectedRows: this.changes });
    });
});

// Delete Job (Safe)
app.delete("/jobs/:id", adminAuth, (req, res) => {
    const sql = `DELETE FROM jobs WHERE id = ?`;
    db.run(sql, [req.params.id], function (err) {
        if (err) return res.status(500).json(err);
        res.json({ message: "Job deleted", affectedRows: this.changes });
    });
});

// Secure Login Route
app.post("/login", function (req, res) {
    const { email, password } = req.body;

    // Retrieve the user from the database based on the email
    const sql = `SELECT * FROM users WHERE email = ?`;
    db.get(sql, [email], function (err, result) {
        if (err) return res.status(500).json({ error: "Database error" });

        if (result) {
            // Compare the entered password with the hashed password in the database
            bcrypt.compare(password, result.password, function (err, isMatch) {
                if (err) return res.status(500).json({ error: "Error comparing passwords" });

                if (isMatch) {
                    // Passwords match, generate JWT token
                    if (result.email === "admin@admin.com") {
                        // Admin-specific logic
                        const token = jwt.sign(
                            { email: result.email, isAdmin: true }, // Include admin claim
                            secretKey,
                            { expiresIn: "1h" } // Token expires in 1 hour
                        );
                        return res.json({
                            success: true,
                            userEmail: result.email,
                            userName: result.name,
                            token: token
                        });
                    } else {
                        // Non-admin user response
                        return res.json({
                            success: true,
                            userEmail: result.email,
                            userName: result.name,
                        });
                    }
                } else {
                    // Passwords don't match
                    return res.json({ success: false, message: "Invalid credentials" });
                }
            });
        } else {
            // No user found with the provided email
            return res.json({ success: false, message: "Invalid credentials" });
        }
    });
});


// Forgot Password Route
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const code = crypto.randomInt(100000, 999999).toString();
    const hashedEmail = await bcrypt.hash(email, 10);
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = Date.now() + 30 * 60 * 1000;

    const sql = `INSERT INTO codes (email, code, expires_at) VALUES (?, ?, ?)`;
    db.run(sql, [hashedEmail, hashedCode, expiresAt], (err) => {
        if (err) return res.status(500).json({ error: "Database error" });

        // Send email with the code (mocked)
        transporter.sendMail({
            from: "matthewblain76@gmail.com",
            to: email,
            subject: "Password Reset Code",
            text: `Your password reset code is: ${code}`,
        });

        res.json({ success: true, message: "Reset code sent to email" });
    });
});

// Reset Password Route
app.post("/reset-password", async (req, res) => {
    const { email, newPassword, code } = req.body;
    const sql = `SELECT * FROM codes WHERE expires_at > ?`;

    db.all(sql, [Date.now()], async (err, rows) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        for (const row of rows) {
            if (await bcrypt.compare(email, row.email) && await bcrypt.compare(code, row.code)) {
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                db.run("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email], (err) => {
                    if (err) return res.status(500).json({ error: "Database error" });
                    
                    db.run("DELETE FROM codes WHERE email = ?", [row.email]); // Cleanup used code
                    res.json({ success: true, message: "Password reset successful" });
                });
                return;
            }
        }
        res.status(400).json({ error: "Invalid or expired reset code" });
    });
});




// Start Server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
