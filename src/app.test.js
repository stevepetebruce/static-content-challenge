
const fs = require('fs');
const { resolve } = require('path');
const { readdir } = require('fs').promises;

const request = require('supertest');

// Markdown to HTML
const marked = require('marked');

const app = require('./app');

// Get folder paths with index.md in them
const getPaths = async(dir) => {
  const dirents = await readdir(dir, { withFileTypes: true });
  const fullPaths = await Promise.all(dirents.map((dirent) => {
    const res = resolve(dir, dirent.name);
    return dirent.isDirectory() ? getPaths(res) : res;
  }));
  return fullPaths.flat()
}



describe('Verify Requests', () => {

  test('Verify that requests to valid URLs return a 200 HTTP status code', async () => {
    
    const validFullPaths = await getPaths(__dirname + '/content');

    const validRoutes = validFullPaths.map(path => path
      .split('/content')
      .splice(1,1).join() 
      .replace('/index.md','')
    );

    validRoutes.forEach(async(path) => {
      const result = await request(app).get(path)
      expect(result.status).toBe(200);
    });
    
  })

  test('Verify that requests to valid URLs return a body that contains the HTML generated from the relevant markdown file', async () => {

    const validFullPaths = await getPaths(__dirname + '/content');

    validFullPaths.forEach(async(validPath) => {

      const validRoute = validPath
        .split('/content')
        .splice(1,1)
        .join() 
        .replace('/index.md','');

      // get markdown file and convert to HTML
      let validHTML; 
      await fs.readFile(validPath, 'utf8', (err, data) => {
        if(err) {
          throw new Error(err);
        }
        validHTML = marked.parse(data.toString())
      });

      await request(app)
        .get(validRoute)
        .expect('Content-Type', /html/)
        .expect(res => {
          // Regex to remove any HTML character codes
          const regex = /&[A-Za-z0-9#]+;/ig
          const response = res.text.replace(regex, "")
          const stripedValidHTML = validHTML.replace(regex, "")
          const includes = response.includes(stripedValidHTML)
          
          expect(includes).toBeTruthy();
        });
    })             

  })

  test('Verify that requests to URLs that do not match content folders return a 404 HTTP status', async () => {
    
    const validFullPaths = await getPaths(__dirname + '/content');

    const validRoutes = validFullPaths.map(path => path
      .split('/content')
      .splice(1,1)
      .join() 
      .replace('/index.md','')
    );
    
    const invalidRoute = validRoutes[Math.floor(Math.random() * validRoutes.length)] + 'invalid';

    const result = await request(app).get(invalidRoute);
    
    expect(validRoutes).not.toContain(invalidRoute);
    expect(result.status).toBe(404);
  })

})