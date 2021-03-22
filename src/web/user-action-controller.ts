const debug = require('debug')('user-action-controller');
const express = require('express');
export const app = express();
const port = 3000;

// app.get('/', (req, res) => {
//     res.send('Hello World!')
// });

app.get('/createAccountPage', (req, res) => {
    debug('yo yo i am here!');
    res.send('Hello World!')
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});