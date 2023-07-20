const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const admin = { adminName: "Mizan" };
app.get("/", (req, res) => {
	res.send(admin);
});

app.listen(port, (req, res) => {
	console.log(`Running Assignment warehouse management server: ${port}`);
});
