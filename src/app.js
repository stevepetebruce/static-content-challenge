const express = require("express");
const fs = require('fs');

// Markdown to HTML
const marked = require('marked');

const app = express();
app.use(express.static(__dirname + '/public'));

// Get template page and enter content
function getPage(req, res) {
  fs.readFile(__dirname + '/template.html', 'utf8', (err, data) => {
    if(err || !data) {
      res.sendStatus(404);
      return;
    }
    
    const page = data.toString().replace('{{content}}', req.content)
   
    res.type('html').send(page);
  });
}

// Find and convert markdown file
app.use((req, res, next) => {
  const path = __dirname + '/content' + req.path + '/index.md';

  fs.readFile(path, 'utf8', (err, data) => {
    if(err || !data) {
      res.sendStatus(404);
      return;
    }
    req.content = marked.parse(data.toString())
    next();
  });

})


app.get("/:route*", getPage);

module.exports = app;

