const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) {
      return console.error('Error acquiring client', err.stack);
    }
    console.log('Connected to the PostgreSQL database');
    release(); // Release the client back to the pool
  });

const register = async (req, res) => {
    try {
        const { 
            name,
            email,
            password,
            role,
        } = req.body;
    
        const hashedPassword = await bcrypt.hash(password, 10);
    
        const found = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if(found.rows.length > 0) {
            return res.status(400).json({message: 'User already exists'});
        }
    
        const user = await pool.query('INSERT INTO Users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *', [name, email, hashedPassword, role]);
        if(role == 'Alumni') {
            await pool.query('INSERT INTO Alumni (user_id) VALUES ($1)', [user.rows[0].id]);
        } else if (role == 'Student') {
            await pool.query('INSERT INTO Students (user_id) VALUES ($1)', [user.rows[0].id]);
        }
        res.status(201).send('Registered successfully');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if(user.rows.length == 0) {
            return res.status(400).json({message: 'Invalid credentials'});
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if(!validPassword) {
            return res.status(400).json({message: 'Invalid credentials'});
        }

        const accessToken = jwt.sign({email: user.rows[0].email}, SECRET_KEY, {expiresIn: '720h'});
        res.status(200).json({accessToken,
            user: {
                id: user.rows[0].id,
                name: user.rows[0].name,
                email: user.rows[0].email,
                role: user.rows[0].role
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

const verify = async (req, res) => {
    res.status(200).json({message: 'Authorized'});
}

module.exports = {
    register,
    login,
    verify
}