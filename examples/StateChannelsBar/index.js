const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const router = require('./router');

const PORT = 4000;

const bodyParser = require('body-parser');
// var multer = require('multer'); // v1.0.5
// var upload = multer(); // for parsing multipart/form-data

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const cors = require('cors');
app.use(cors());

app.use(express.static('public'));
app.use(express.static('dist'));


app.engine('.hbs', exphbs({
    defaultLayout: 'main.hbs',
    extname: '.hbs',

    layoutsDir: './views/layouts/',
    partialsDir: [
        './views/partials/'
    ]
}));

app.set('view engine', '.hbs');

router(app);

console.log('Server start at port:', PORT);
app.listen(PORT);