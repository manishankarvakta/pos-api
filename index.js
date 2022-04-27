const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();

// Define port
const port = process.env.PORT || 5000;


// MiddleWare
app.use(cors());
app.use(express.json());


// DATABASE CONNECTION
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rfbl8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const posDB = client.db('pos');
        const userCollection = posDB.collection('users');
        const productCollection = posDB.collection('products');

        // get user
        app.get('/user', async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const user = await cursor.toArray();
            res.send(user);
        });

        // get One User
        app.get("/user/:id", async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};

            const user = await userCollection.findOne(query);
            res.send(user);
        });


        // update / put user
        app.put('/user/:id', async(req,res)=>{
            const id = req.params.id;
            const user = req.body;
            const filter = {_id: ObjectId(id)};

            const updateUser = {
                $set: user
            }
            
            const option = {upsert:true};

            const result = await userCollection.updateOne(filter, updateUser, option);
            res.send(result);
        })

        // create user
        app.post('/user', async (req, res) => {
            const user = req.body;
            console.log('create new user', user);
            const result = await userCollection.insertOne(user);
            res.send(result.insertedId);
        })


        // delete user
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })


        /**
         * PRODUCT CRUD API
         * C - Create Products
         * R - read products
         * U - Update products
         * D - Delete Products
         */

        //  * C - Create Products
        app.post('/product', async (req, res) => {
            const product = req.body;
            console.log('create new product', product);
            const result = await productCollection.insertOne(product);
            res.send(result);
        })
        

        /**
         *  R - read 
         * All products
         * */
        app.get('/product', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const product = await cursor.toArray();
            res.send(product);
        });

         /**
         *  R - read 
         * One product
         * */
          app.get("/product/:id", async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};

            const product = await productCollection.findOne(query);
            res.send(product);
        });


        // U - Update products
        app.put('/product/:id', async(req,res)=>{
            const id = req.params.id;
            const product = req.body;
            const filter = {_id: ObjectId(id)};

            const updateProduct = {
                $set: product
            }
            
            const option = {upsert:true};

            const result = await productCollection.updateOne(filter, updateProduct, option);
            res.send(result);
        });

        // create product
        app.post('/product', async (req, res) => {
            const product = req.body;
            console.log('create new product', product);
            const result = await productCollection.insertOne(product);
            res.send(result);
        })


        // delete product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        })



    }
    finally {
        // client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('POS API');
});

app.listen(port, () => {
    console.log('POS API Listen port: ', port);
})