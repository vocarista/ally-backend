const { Pool } = require('pg');
require('dotenv').config();

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

const getAllUniversities = async (req, res) => {
    try {
        const universities = await pool.query('SELECT * FROM Universities');
        res.status(200).json(universities.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

// Register a university
const registerUniversity = async (req, res) => {
    try {
        const {
            name,
            district,
            established_year,
            type,
            contact_email,
            contact_phone,
            address
        } = req.body;

        const found = await pool.query('SELECT * FROM Universities WHERE name = $1', [name]);
        if(found.rows.length > 0) {
            return res.status(400).json({message: 'University already exists'});
        }

        await pool.query('INSERT INTO Universities (name, district, established_year, type, contact_email, contact_phone, address, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())', [name, district, established_year, type, contact_email, contact_phone, address]);
        res.status(201).send('University registered successfully');
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

const getUniversityById = async (req, res) => {
    try {
        const { id } = req.params;
        const university = await pool.query('SELECT * FROM Universities WHERE id = $1', [id]);
        res.status(200).json(university.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
    }
}   

module.exports = {
    getAllUniversities,
    registerUniversity,
    getUniversityById
}