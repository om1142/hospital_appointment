require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { json } = require('express');
const methodoverride = require('method-override');
const path = require('path');
const dbURI = process.env.MONGODB_URI;
const authRoutes = require('./routes/authRoutes');


mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((result) => console.log('Connected to DB'))
    .catch((err) => console.log(err));


const app = express();
const port = process.env.PORT || 5000;
const static_path = path.join(__dirname, 'public');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(static_path));
app.use(morgan('dev'));
app.use(methodoverride('_method'));
app.use(cookieParser());




app.use(authRoutes);





app.listen(port);

