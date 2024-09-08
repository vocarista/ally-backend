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

// creating a new interaction (post)
const createInteraction = async (req, res) => {
    try {
        const { type, content } = req.body;
        const userId = req.user.id;
        
        // type and content need to be mentioned
        if (!type || !content) {
            return res.status(400).json({ message: 'Type and content are required' });
        }

        const result = await pool.query(
            'INSERT INTO interactions (user_id, type, content, timestamp) VALUES ($1, $2, $3, NOW()) RETURNING *', 
            [userId, type, content]
        );

        res.status(201).json({ message: 'Interaction created successfully', interaction: result.rows[0] });
    } catch (error) {
        console.error('Error creating interaction:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// fetching all interactions visible to the user based on their university
const getAllInteractions = async (req, res) => {
    try {
        const userId = req.user.id;

        // university id of current user
        const userResult = await pool.query('SELECT university_id FROM Students WHERE user_id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const universityId = userResult.rows[0].university_id;

        // fetching the interactions
        const result = await pool.query(
            `SELECT i.* FROM interactions i
             JOIN Students s ON i.user_id = s.user_id
             WHERE s.university_id = $1
             ORDER BY i.timestamp DESC`,
            [universityId]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching interactions:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// fetch the interaction for a specified user
const getUserInteractions = async (req, res) => {
    try {
        const userId = req.params.userId;

        // validating user id
        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        // university id of current user
        const currentUser = await pool.query('SELECT university_id FROM Students WHERE user_id = $1', [req.user.id]);
        if (currentUser.rows.length === 0) {
            return res.status(404).json({ message: 'Current user not found' });
        }
        const currentUserUniversityId = currentUser.rows[0].university_id;

        // university id of the speciified user
        const targetUser = await pool.query('SELECT university_id FROM Students WHERE user_id = $1', [userId]);
        if (targetUser.rows.length === 0) {
            return res.status(404).json({ message: 'Target user not found' });
        }
        const targetUserUniversityId = targetUser.rows[0].university_id;

        // check if both users are from the same university
        if (currentUserUniversityId !== targetUserUniversityId) {
            return res.status(403).json({ message: 'Forbidden: Cannot access interactions of users from different universities' });
        }

        // fetch interactions for the specific user
        const result = await pool.query('SELECT * FROM interactions WHERE user_id = $1 ORDER BY timestamp DESC', [userId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching user interactions:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// updating an interaction
const updateInteraction = async (req, res) => {
    try {
        const { interactionId } = req.params;
        const { type, content } = req.body;
        const userId = req.user.id;
        
        // type and content are required
        if (!type || !content) {
            return res.status(400).json({ message: 'Type and content are required' });
        }

        // check if the interaction exists and if the user is the owner
        const interactionResult = await pool.query('SELECT * FROM interactions WHERE interaction_id = $1 AND user_id = $2', [interactionId, userId]);
        if (interactionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Interaction not found or user not authorized' });
        }

        // update the interaction
        const result = await pool.query(
            'UPDATE interactions SET type = $1, content = $2 WHERE interaction_id = $3 RETURNING *',
            [type, content, interactionId]
        );

        res.status(200).json({ message: 'Interaction updated successfully', interaction: result.rows[0] });
    } catch (error) {
        console.error('Error updating interaction:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// delete an interaction
const deleteInteraction = async (req, res) => {
    try {
        const { interactionId } = req.params;
        const userId = req.user.id;
        
        // check if the interaction exists and if the user is the owner
        const interactionResult = await pool.query('SELECT * FROM interactions WHERE interaction_id = $1 AND user_id = $2', [interactionId, userId]);
        if (interactionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Interaction not found or user not authorized' });
        }

        // celete the interaction
        await pool.query('DELETE FROM interactions WHERE interaction_id = $1', [interactionId]);

        res.status(200).json({ message: 'Interaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting interaction:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    createInteraction,
    getAllInteractions,
    getUserInteractions,
    updateInteraction,
    deleteInteraction
};
