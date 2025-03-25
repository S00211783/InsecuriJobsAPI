const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
const port = 3000;

// MySQL Connection
const db = mysql.createConnection({
    host: "localhost",  // Use the correct host from the Railway URL
    port: 3306,                        // Add the port from the Railway URL
    user: "root",
    password: "P@ssw0rd",
    database: "sas",
  });

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

app.use(cors());
app.use(express.json());

// --- USERS CRUD ---

// Create User (Unsafe)
app.post("/users", (req, res) => {
  const { name, email, password} = req.body;
  const sql = `INSERT INTO users (name, email, password) 
               VALUES ('${name}', '${email}', '${password}')`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, name, email, password });
  });
});

// Get All Users
app.get("/users", (req, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// Get User by ID (Unsafe)
app.get("/users/:id", (req, res) => {
  const sql = `SELECT * FROM users WHERE id = ${req.params.id}`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results[0] || {});
  });
});

// Update User (Unsafe)
app.put("/users", (req, res) => {
  const { email, password} = req.body;
  const sql = `UPDATE users SET 
                password='${password}'
                WHERE email='${email}'`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "User password updated", affectedRows: result.affectedRows });
  });
});

// Delete User (Unsafe)
app.delete("/users/:id", (req, res) => {
  const sql = `DELETE FROM users WHERE id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "User deleted", affectedRows: result.affectedRows });
  });
});

// --- JOBS CRUD ---

// Create Job (Unsafe)
app.post("/jobs", (req, res) => {
  const { title, companyName, salary, description } = req.body;
  const sql = `INSERT INTO jobs (title, companyName, salary, description) 
               VALUES ('${title}', '${companyName}', '${salary}', '${description}')`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ id: result.insertId, title, companyName, salary, description });
  });
});

// Get All Jobs
app.get("/jobs", (req, res) => {
  db.query("SELECT * FROM jobs", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});
// Search Jobs by Title
app.get('/jobs/search', (req, res) => {
    const searchTerm = req.query.q; // Get search query from URL
    console.log(searchTerm);
    // Example SQL query to search for jobs (adjust for your database)
    const query = `SELECT * FROM jobs WHERE title LIKE '%${searchTerm}%'`;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching jobs:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results); // Return the job results as JSON
    });
});
// Get Job by ID (Unsafe)
app.get("/jobs/:id", (req, res) => {
  const sql = `SELECT * FROM jobs WHERE id = ${req.params.id}`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results[0] || {});
  });
});

// Update Job (Unsafe)
app.put("/jobs/:id", (req, res) => {
  const { title, companyName, salary, description } = req.body;
  const sql = `UPDATE jobs SET 
                title='${title}', 
                companyName='${companyName}',  
                salary='${salary}', 
                description='${description}' 
                WHERE id=${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Job updated", affectedRows: result.affectedRows });
  });
});

// Delete Job (Unsafe)
app.delete("/jobs/:id", (req, res) => {
  const sql = `DELETE FROM jobs WHERE id = ${req.params.id}`;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Job deleted", affectedRows: result.affectedRows });
  });
});
// Insecure login route
app.post('/login', function(req, res) {
    const { email, password } = req.body;

    // Vulnerable query: not using parameterized queries
    const sql = "SELECT * FROM users WHERE email = '" + email +"'" + " AND password = '" + password+"'";
    db.query(sql, function(err, results) {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Database error' + sql });
        }

        if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.json({ success: false, message: 'Invalid credentials' + sql });
        }
    });
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
