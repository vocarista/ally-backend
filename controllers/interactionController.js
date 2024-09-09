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
const createPost = async (req, res) => {
    try {
        const { user_id, type, content, university_id } = req.body;
        if(type === 'Comment') {
            return res.status(400).json({ message: 'Bad Request, endpoint for posts only' });
        }

        const { title, description } = content;

        const result = await pool.query(
            'INSERT INTO interactions (user_id, type, title, content, timestamp, votes, university_id) VALUES ($1, $2, $3, $4, NOW(), $5, $6) RETURNING *', 
            [user_id, type, title, description, 0, university_id]
        );

        res.status(201).json({ message: 'Interaction created successfully', interaction: result.rows[0] });
    } catch (error) {
        console.error('Error creating interaction:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const createComment = async (req, res) => {
    try{
        const { user_id, type, content, university_id, response_to } = req.body;
        if(type === 'Post') {
            return res.status(400).json({ message: 'Bad Request, endpoint for comments only' });
        }

        const { description } = content;

        const result = await pool.query('INSERT INTO interactions (user_id, type, content, timestamp, votes, university_id, response_to) VALUES ($1, $2, $3, NOW(), $4, $5, $6) RETURNING *', [user_id, type, description, 0, university_id, response_to]);
        res.status(201).json({ message: 'Interaction created successfully', interaction: result.rows[0] });
    } catch (error) {
        console.error('Error creating interaction:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

// fetching all interactions visible to the user based on their university
const getAllPostsCreatedByUserId = async (req, res) => {
    try {
        const user_id = req.body.user_id;

        // fetching the interactions
        const result = await pool.query(
            `SELECT i.* FROM interactions i
             JOIN membership m ON i.user_id = m.user_id
             WHERE i.type = 'Post' AND i.user_id = $1
             ORDER BY i.timestamp DESC`,
            [user_id]
        );

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching interactions:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getAllPostsForUserId = async (req, res) => {
    try{
        const user_id = req.params.id

        const memberships = await pool.query('SELECT * FROM membership WHERE user_id = $1', [user_id]);
        if(memberships.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const university_ids = memberships.rows.map(membership => membership.university_id);

        const result = await pool.query('SELECT * FROM interactions WHERE university_id = ANY($1) AND type = $2 ORDER BY timestamp DESC', [university_ids, 'Post']);
        res.status(200).json(result.rows);
    } catch(error) {
        console.error('Error fetching interactions:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    } 
}

const getCommentsForPost = async (req, res) => {
    try {
        const { post_id } = req.params;

        const result = await pool.query('SELECT * FROM interactions WHERE response_to = $1', [post_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

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

const upvote = async (req, res) => {
    try{
        const post_id = req.params.id;
        await pool.query('UPDATE interactions SET votes = votes + 1 WHERE interaction_id = $1', [post_id]);
        res.status(200).json({ message: 'Upvoted successfully' });
    } catch(error) {
        console.error('Error upvoting post:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

const downvote = async (req, res) => {
    try{
        const post_id = req.params.id;
        await pool.query('UPDATE interactions SET votes = votes - 1 WHERE interaction_id = $1', [post_id]);
        res.status(200).json({ message: 'Downvoted successfully' });
    } catch(error) {
        console.error('Error downvoting post:', error.message);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}

module.exports = {
    createPost,
    createComment,
    getAllPostsCreatedByUserId,
    getAllPostsForUserId,
    getCommentsForPost,
    upvote,
    downvote,
    updateInteraction,
    deleteInteraction
};
