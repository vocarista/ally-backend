const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const universityRoutes = require('./routes/universityRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const userRoutes = require('./routes/userRoutes')

const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://ally.vocarista.com'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    allowedHeaders: ['Content-Type', 'Authorization'], 
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server running on PORT 3000');
});

app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/university', universityRoutes);
app.use('/interaction', interactionRoutes);
app.use('/user', userRoutes);

app.listen(3000, () => {
    console.log('Server running on PORT 3000!');
})