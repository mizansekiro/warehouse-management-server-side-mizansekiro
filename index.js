const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
//password monogo: M6M8SHFJMkje90x4
// userName : mongodbuser1
const uri = "mongodb://127.0.0.1:27017/";
// const uri =
// 	"mongodb+srv://mongodbuser1:M6M8SHFJMkje90x4@cluster0.yy39k.mongodb.net/?retryWrites=true&w=majority";

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

		// all products api
		app.get("/products", async (req, res) => {
			const page = parseInt(req.query.p);
			const size = parseInt(req.query.s);
			console.log(page, size);
			const query = {};
			const cursor = productsDB.find(query);
			const products = await cursor
				.skip(page * size)
				.limit(size)
				.toArray();

			res.send(products);
		});

		// single product details api
		app.get("/products/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: new ObjectId(id) };
			const cursor = productsDB.find(query);
			const products = await cursor.toArray();
			res.send(products);
		});

		// Delivered and restock api
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
	} finally {
	}
}
run().catch(console.dir);

const admin = { adminName: "Mizan" };
app.get("/", (req, res) => {
	res.send(admin);
});

app.listen(port, (req, res) => {
	console.log(`Running Assignment warehouse management server: ${port}`);
});
