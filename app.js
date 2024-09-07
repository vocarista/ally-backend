const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send('Server running on PORT 3000');
});

app.listen(3000, () => {
    console.log('Server running on PORT 3000!');
})