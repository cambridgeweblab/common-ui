const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 8080;

const server = express();

server
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: false }))
    .use(compression())
    .set('view engine', 'html')
    .set('views', path.resolve(__dirname, 'examples'))
    .use('/bower_components', express.static(path.join(__dirname, 'bower_components')))
    .use('/examples', express.static(path.join(__dirname, 'examples')))
    .use('/components', express.static(path.join(__dirname, 'components')))
    .get('/', (req, res) => res.sendFile(path.resolve(__dirname, 'examples', 'index.html')))
    .get('/:component', (req, res) => {
        const component = req.params.component;
        res.sendFile(path.resolve(__dirname, 'examples', `${component}${component.endsWith('.html') ? '' : '.html'}`));
    })
    .listen(PORT, () => {
        console.log(`server up and listening on ${PORT}`);
    });
