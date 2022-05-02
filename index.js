const express = require('express');
const cors = require('cors');
const sha256 = require('js-sha256').sha256;
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

// const secret = "randomStringForCreateAPasswordHash";
// const passHash = pass =>{
//     const password = sha256({pass, secret})
//     return password;
// }

// console.log(passHash('Hello'))

async function run() {
    try {
        await client.connect();

        const posDB = client.db('pos');
        const userCollection = posDB.collection('users');
        const productCollection = posDB.collection('products');
        const saleCollection = posDB.collection('sales');
        const categoryCollection = posDB.collection('categories');

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
            // user.password = passHash(user.password);

            // console.log(user.password);
            // return;
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
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            
            const query = {};
            const cursor = productCollection.find(query);
            let products;
            if(page || size){
                product = await cursor.skip(page*size).limit(size).toArray();
            }
            else{
                product = await cursor.toArray();
            }
            res.send(product);
        });

        app.get('/productCount',async (req,res)=>{
            const query = {};
            const cursor = productCollection.find(query);
            const count = await cursor.count();

            res.send({count});
        })


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


        // delete product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        });


        /**
         * SALES CRUD API
         * C - Create Products
         * R - read products
         * U - Update products
         * D - Delete Products
         */

        //  * C - Create Sale
        app.post('/sale', async (req, res) => {
            const sale = req.body;
            console.log('create new Sale', sale);
            const result = await saleCollection.insertOne(sale);
            res.send(result);
        })
        

        /**
         *  R - read 
         * All Sales
         * */
        app.get('/sale', async (req, res) => {
            const query = {};
            const cursor = saleCollection.find(query);
            const sale = await cursor.toArray();
            res.send(sale);
        });

         /**
         *  R - read 
         * One sale
         * */
          app.get("/sale/:id", async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};

            const sale = await saleCollection.findOne(query);
            res.send(sale);
        });


        // U - Update sale
        app.put('/sale/:id', async(req,res)=>{
            const id = req.params.id;
            const sale = req.body;
            const filter = {_id: ObjectId(id)};

            const updateSale = {
                $set: sale
            }
            
            const option = {upsert:true};

            const result = await saleCollection.updateOne(filter, updateSale, option);
            res.send(result);
        });


        // delete sale
        app.delete('/sale/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await saleCollection.deleteOne(query);
            res.send(result);
        });



        /**
         * Master Category
         * Category
         */
         // get All category
         app.get('/category', async (req, res) => {
            const query = {};
            const cursor = categoryCollection.find(query);
            const category = await cursor.toArray();
            res.send(category);
        });

        // get One category
        app.get("/category/:id", async(req,res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};

            const category = await categoryCollection.findOne(query);
            res.send(category);
        });


        // update / put category
        app.put('/category/:id', async(req,res)=>{
            const id = req.params.id;
            const category = req.body;
            const filter = {_id: ObjectId(id)};

            const updateCategory = {
                $set: category
            }
            
            const option = {upsert:true};

            const result = await categoryCollection.updateOne(filter, updateCategory, option);
            res.send(result);
        })

        // create category
        app.post('/category', async (req, res) => {
            const category = req.body;
            console.log('create new category', category);
            const result = await categoryCollection.insertOne(category);
            res.send(result.insertedId);
        })


        // delete category
        app.delete('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await categoryCollection.deleteOne(query);
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