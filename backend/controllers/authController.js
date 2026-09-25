const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//register api
const register = async (req, res) => {
    const { full_name, email, password } = req.body;

    const getsql = "select * from users where email = ?";
    db.query(getsql, [email], async (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        if (result.length > 0) {
            return res.status(400).json({ message: "Email already registered" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const insertsql = `insert into users (full_name, email, password_hash) values (?, ?, ?)`;
        db.query(insertsql, [full_name, email, hashedPassword], (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Failed to register the user" });
            }

            res.status(201).json({ message: "User registered successfully" });
        })
    });
};


//login api
//login api
const login = async (req, res) => {
    const { email, password } = req.body;

    const getsql = "select * from users where email = ?";

    db.query(getsql, [email], async (err, result) => {

        if (err) {
            console.error("LOGIN DATABASE ERROR:", err);

            return res.status(500).json({
                message: "Database error",
                error: err.message
            });
        }

        if (result.length === 0) {
            return res.status(401).json({
                message: "Invalid Email"
            });
        }

        try {
            const user = result[0];

            const matchPassword = await bcrypt.compare(
                password,
                user.password_hash
            );

            if (!matchPassword) {
                return res.status(401).json({
                    message: "Invalid Password"
                });
            }

            const token = jwt.sign(
                { user_id: user.user_id },
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            // Record today's login
            const loginSql = `
                INSERT IGNORE INTO user_login_activity
                (user_id, login_date)
                VALUES (?, CURDATE())
            `;

            db.query(
                loginSql,
                [user.user_id],
                (loginErr, loginResult) => {

                    if (loginErr) {
                        console.error(
                            "LOGIN ACTIVITY ERROR:",
                            loginErr
                        );
                    } else {
                        console.log(
                            "LOGIN ACTIVITY INSERTED:",
                            loginResult
                        );
                    }

                    // Login should still succeed
                    res.json({
                        message: "Login Successful",
                        token: token
                    });
                }
            );

        } catch (error) {
            console.error("LOGIN ERROR:", error);

            return res.status(500).json({
                message: "Login processing error",
                error: error.message
            });
        }
    });
};


//to remember across pages
const me = async (req, res) => {
    const userId = req.user.user_id;

    const getsql = `select u.user_id, u.full_name, u.email, u.about, u.github_profile_url,u.linkedin_profile_url,u.profile_completed,u.career_goal_id,c.career_name as career_goal_name  from users u left join careers c on u.career_goal_id = c.career_id where user_id= ?`;

    db.query(getsql, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        if (result.length === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        res.json(result[0]);
    });
}

module.exports = { register, login, me }

