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

const registerAdmin = async (req, res) => {
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
    
        await pool.query('INSERT INTO Users (name, email, password, role, created_at) VALUES ($1, $2, $3, $4, NOW())', [name, email, hashedPassword, role]);
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

        const rows = await pool.query('SELECT * FROM membership WHERE user_id = $1', [user.rows[0].id]);
        if(rows.rows.length > 0 && user.rows[0].role !== 'Admin') {
            user.rows[0].university_id = [];
            rows.rows.forEach(row => {
                user.rows[0].university_id.push_back(row.university_id);
            })
        }

        const accessToken = jwt.sign({email: user.rows[0].email}, SECRET_KEY, {expiresIn: '720h'});
        res.status(200).json({token: accessToken,
            user: {
                id: user.rows[0].id,
                name: user.rows[0].name,
                email: user.rows[0].email,
                role: user.rows[0].role,
                university_id: user.rows[0].university_id
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

// Register a student
const registerStudent = async (req, res) => {
    try{
        const { 
            name,
            email,
            password,
            role,
            university_id,
        } = req.body;
        console.log("University ID: ", university_id);
        const hashedPassword = await bcrypt.hash(password, 10);
        if(university_id == undefined || university_id.length == 0) {
            return res.status(400).json({message: 'University ID is required'});
        }

        const found = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if(found.rows.length > 0 && found.rows[0].role !== 'Admin') {
            return res.status(400).json({message: 'User already exists'});
        } else if(found.rows.length > 0 && found.rows[0].role === 'Admin') {
            await pool.query('INSERT INTO students (user_id) VALUES ($1)', [found.rows[0].user_id]);
            await Promise.all(university_id.map(id => pool.query('INSERT INTO membership (user_id, university_id) VALUES ($1, $2)', [found.rows[0].user_id, id])));
            return res.status(201).send('Registered successfully');
        } else{
            await pool.query('INSERT INTO Users (name, email, password, role) VALUES ($1, $2, $3, $4)', [name, email, hashedPassword, role]);
            const user = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
            console.log("User: ", user.rows[0].user_id);
            await pool.query('INSERT INTO students (user_id) VALUES ($1)', [user.rows[0].user_id]);
            await Promise.all(university_id.map(id => pool.query('INSERT INTO membership (user_id, university_id) VALUES ($1, $2)', [user.rows[0].user_id, id])));
            res.status(201).send('Registered successfully');
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

// Register an alumni
const registerAlumni = async (req, res) => {
    try{
        const { 
            name,
            email,
            password,
            role,
            university_id,
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);
        if(university_id.length == 0) {
            return res.status(400).json({message: 'University ID is required'});
        }

        const found = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        if(found.rows.length > 0 && found.rows[0].role !== 'Admin') {
            return res.status(400).json({message: 'User already exists'});
        } else if(found.rows.length > 0 && found.rows[0].role === 'Admin') {
            await pool.query('INSERT INTO alumni (user_id) VALUES ($1)', [found.rows[0].user_id]);
            await Promise.all(university_id.map(id => pool.query('INSERT INTO membership (user_id, university_id) VALUES ($1, $2)', [found.rows[0].user_id, id])));
            return res.status(201).send('Registered successfully');
        } else{
            await pool.query('INSERT INTO Users (name, email, password, role) VALUES ($1, $2, $3, $4)', [name, email, hashedPassword, role]);
            const user = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
            await pool.query('INSERT INTO alumni (user_id) VALUES ($1)', [user.rows[0].user_id]);
            await Promise.all(university_id.map(id => pool.query('INSERT INTO membership (user_id, university_id) VALUES ($1, $2)', [user.rows[0].user_id, id])));
            res.status(201).send('Registered successfully');
        }

        res.status(201).send('Registered successfully');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

module.exports = {
    registerAdmin,
    login,
    verify,
    registerStudent,
    registerAlumni,
}