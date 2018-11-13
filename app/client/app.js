//app.js

const express = require("express");
const path = require('path');
const app = express();
app.use(express.static(__dirname + '/src'));
const port = 3000

app.get('/', (req, res) => res.send(index.html))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))