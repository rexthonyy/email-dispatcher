require('dotenv').config();
const express = require('express');
const apiRouter = require('./routes/api');

const app = express();

app.use(express.json());
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
	res.header("Access-Control-Allow-Headers", "Content-Type");
	next();
});
app.use(express.static('public'));

app.use('/api', apiRouter);

let port = process.env.port || process.env.PORT;

app.listen(port, () => console.log(`Server started at ${port}`));