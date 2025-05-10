const bcrypt = require('bcrypt');

let users = []; // Temporary in-memory storage for user data

exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if the user already exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash the password (optional for local storage, but keeping it for consistency)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store user in local storage
        const user = { name, email, password: hashedPassword };
        users.push(user);

        res.status(201).json({ message: "User created", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Replace MongoDB call with in-memory array search
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user in local storage
        const user = users.find(user => user.email === email);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Verify the password
        const bcrypt = require('bcrypt');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        res.json({ message: "Login successful", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Test Signup
// POST http://localhost:5000/signup
// Content-Type: application/json
//
// {
//   "name": "John Doe",
//   "email": "john@example.com",
//   "password": "password123"
// }
//
// Test Login
// POST http://localhost:5000/login
// Content-Type: application/json
//
// {
//   "email": "john@example.com",
//   "password": "password123"
// }
