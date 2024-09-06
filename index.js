const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI and Client
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gphdl2n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server
        await client.connect();

        const productsCollections = client.db('e-commerce-webApp').collection('products');
        const cartCollections = client.db('e-commerce-webApp').collection('cart');

        // Route to get all products
        app.get('/products', async (req, res) => {
            try {
                const products = await productsCollections.find().toArray();
                res.send(products);
            } catch (error) {
                console.error('Error fetching products:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        // Route to add an item to the cart
        app.post('/cart', async (req, res) => {
            try {
                const { email, productId, quantity } = req.body;

                if (!email || !productId || !quantity) {
                    return res.status(400).send('Missing required fields');
                }

                const cartItem = {
                    email,
                    productId,
                    quantity,
                };

                const result = await cartCollections.insertOne(cartItem);
                res.status(201).send(result);
            } catch (error) {
                console.error('Error adding item to cart:', error);
                res.status(500).send('Internal Server Error');
            }
        });

        app.get('/carts', async (req, res) => {
            try {
                const { email } = req.query;

                if (!email) {
                    return res.status(400).send('Email query parameter is required');
                }

                // Find cart items where the email matches
                const filter = { email: email };
                const cartItems = await cartCollections.find(filter).toArray();

                if (cartItems.length === 0) {
                    return res.status(404).send('No cart items found for the provided email');
                }

                res.send(cartItems);
            } catch (error) {
                console.error('Error fetching cart items:', error);
                res.status(500).send('Internal Server Error');
            }
        });



        // Ping the database to confirm successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensure that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

// Root route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});