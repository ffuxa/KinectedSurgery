const express = require('express');
const fs = require('fs')

const app = express();
const port = process.env.PORT || 5000;
const img_regex = new RegExp('.jpg|.png', 'i')

app.use(express.json())

app.post('/fetch_files', (req, res) => {
  var files = fs.readdirSync(req.body.path);
  files = files.filter(file => img_regex.test(file) || fs.lstatSync(req.body.path + file).isDirectory()).map(file => ({ path: file, is_dir: fs.lstatSync(req.body.path + file).isDirectory() }));
  res.send({ files: files });
  app.use('/static', express.static(req.body.path))
});

app.listen(port, () => console.log(`Listening on port ${port}`));
