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

const getUserNameById = async (req, res) => {
    try {
        const user_id = req.params.id;
        const user = await pool.query('SELECT name FROM Users WHERE id = $1', [user_id]);
        res.status(200).json(user.rows[0]);
    } catch (error) {
        console.error(error.message);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

 module.exports = {
    getUserNameById,
 }