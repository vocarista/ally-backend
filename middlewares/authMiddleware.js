const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.SECRET_KEY

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if(!token) return res.status(401).json({message: 'Unauthorized'})
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if(err) return res.status(403).json({message: 'Forbidden'});
        req.user = user;
        next();
    });
}

module.exports = authenticateJWT;