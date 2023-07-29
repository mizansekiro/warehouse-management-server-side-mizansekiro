const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

//verify jwt token
function verifyJWT(req, res, next) {
	const authHeader = req.headers.authorization;
	console.log(authHeader);
	if (!authHeader) {
		return res.send({ error: true, massage: "unauthorized access" });
	}
	const token = authHeader.split(" ")[1];
	console.log(token);
	jwt.verify(token, process.env.ACCESS_TOKEN_KEY, function (err, decoded) {
		if (err) {
			res.status(401).send({ error: true, massage: "unauthorized access" });
		}
		req.decoded = decoded;
	});

	next();
}
//password monogo: M6M8SHFJMkje90x4
// userName : mongodbuser1
// const uri = "mongodb://127.0.0.1:27017/";
const uri = `mongodb+srv://${process.env.BD_USERNAME}:${process.env.BD_PASSWORD}@cluster0.yy39k.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();
		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);

		const productsDB = client.db("warehouse").collection("products");
		const reviewDB = client.db("warehouse").collection("review");

		// make a jwt token
		app.post("/jwt", (req, res) => {
			const user = req.body;
			const token = jwt.sign(user, process.env.ACCESS_TOKEN_KEY, {
				expiresIn: "1hr",
			});
			res.send({ token });
			console.log(user);
		});

		// all products get api
		app.get("/products", async (req, res) => {
			const page = parseInt(req.query.p);
			const size = parseInt(req.query.s);
			const query = {};
			const cursor = productsDB.find(query);
			const products = await cursor
				.skip(page * size)
				.limit(size)
				.toArray();

			res.send(products);
		});

		// single product details get api
		app.get("/products/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const cursor = productsDB.find(query);
			const products = await cursor.toArray();
			res.send(products);
		});

		// Delivered and restock update api
		app.put("/products/:id", async (req, res) => {
			const id = req.params.id;
			const stockNumber = req.body.newNumber;
			const deliveredNumber = `${
				req.body.delivered === undefined
					? req.body.newDelivered
					: req.body.delivered
			}`;
			const query = { _id: new ObjectId(id) };
			const updateDoc = {
				$set: {
					stock: stockNumber,
					delivered: deliveredNumber,
				},
			};
			const result = await productsDB.updateOne(query, updateDoc);
			res.send(result);
		});

		// add new product post api
		app.post("/products", async (req, res) => {
			const doc = req.body;
			const result = await productsDB.insertOne(doc);
			console.log(`A document was inserted with the _id: ${result.insertedId}`);
			res.send(result);
		});

		// use base product get api
		app.get("/product", verifyJWT, async (req, res) => {
			const decoded = req.decoded;
			console.log(decoded);

			if (decoded?.email !== req.query.e) {
				res.status(403).send({ massage: "unauthorized access" });
			}

			let query = {};
			const email = req.query.e;
			if (email) {
				query = {
					userEmail: email,
				};
			}
			const cursor = productsDB.find(query);
			const products = await cursor.toArray();

			res.send(products);
			console.log(email);
		});

		// Product delete api
		app.delete("/products/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const result = await productsDB.deleteOne(query);
			res.send(result);
		});

		// added user review post api
		app.post("/review/:id", async (req, res) => {
			const id = req.params.id;
			const doc = req.body;
			const query = {};
			const result = await reviewDB.insertOne(doc);
			res.send(result);
		});

		// added user review get api
		app.get("/review", async (req, res) => {
			const query = {};
			const cursor = reviewDB.find(query);
			const result = await cursor.toArray();

			res.send(result);
		});
	} finally {
	}
}
run().catch(console.dir);

const admin = "Assignment warehouse management server is Running...";
app.get("/", (req, res) => {
	res.send(admin);
});

app.listen(port, (req, res) => {
	console.log(`Running Assignment warehouse management server: ${port}`);
});
