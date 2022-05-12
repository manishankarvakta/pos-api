const express = require('express');
const cors = require('cors');
const sha256 = require('js-sha256').sha256;
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');

// Define port
const port = process.env.PORT || 5000;


// MiddleWare
app.use(cors());
app.use(express.json());


const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized" })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
        if (err) {
            return res.status(403).send({ message: "Forbidden" })
        }
        req.decode = decode;
        next();

    })
}


// DATABASE CONNECTION
const { MongoClient, ServerApiVersion } = require('mongodb');
const { type } = require('express/lib/response');
const { decode } = require('jsonwebtoken');
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
        const customerCollection = posDB.collection('customer');

        // get user
        app.get('/user', async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const user = await cursor.toArray();
            res.send(user);
        });

        // get One User
        app.get("/user/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const user = await userCollection.findOne(query);
            res.send(user);
        });


        // update / put user
        app.put('/user/:id', async (req, res) => {
            const id = req.params.id;
            const user = req.body;

            console.log(id)
            console.log(user)
            const filter = { _id: ObjectId(id) };

            const updateUser = {
                $set: user
            }

            const option = { upsert: true };

            const result = await userCollection.updateOne(filter, updateUser, option);
            res.send(result);
        })

        // create user
        app.post('/user', async (req, res) => {
            const user = req.body.data;
            console.log('create new user', user);
            // user.password = passHash(user.password);

            // console.log('Create User',user);
            const result = await userCollection.insertOne(user);
            res.send(result.insertedId);
        })

        // login
        app.post('/user/login', async (req, res) => {
            const user = req.body.data;
            console.log('Login request:', user);

            const query = { email: user.email, password: user.password, status: "Active" };


            const LoggedInUser = await userCollection.findOne(query);
            if (LoggedInUser) {
                const accessToken = jwt.sign({ email: LoggedInUser.email, type: LoggedInUser.type }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
                res.send({
                    success: true,
                    accessToken: accessToken,
                    user: { name: LoggedInUser.name, email: LoggedInUser.email, type: LoggedInUser.type }
                })
            } else {
                res.send({ success: false })
            }

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
            if (page || size) {
                product = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                product = await cursor.toArray();
            }
            res.send(product);
        });

        // get selected products
        app.post('/products', async (req, res) => {
            const productsId = req.body.payload;
            const query = { article_code: { $in: productsId } };
            const cursor = productCollection.find(query);
            console.log(productsId)

            product = await cursor.toArray();
            res.send(product);
        })



        app.get('/productCount', async (req, res) => {
            const query = {};
            const cursor = productCollection.find(query);
            const count = await cursor.count();

            res.send({ count });
        })


        /**
        *  R - read 
        * One product
        * */
        app.get("/product/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const product = await productCollection.findOne(query);
            res.send(product);
        });


        // U - Update products
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const filter = { _id: ObjectId(id) };

            const updateProduct = {
                $set: product
            }

            const option = { upsert: true };

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

        // Product search
        app.post('/search', async (req, res) => {
            let payload = req.body.payload.trim();
            // check search item num | ean or article code
            const isNumber = /^\d/.test(payload)
            let query = {};
            if (!isNumber) {
                query = { name: { $regex: new RegExp('^' + payload + '.*', 'i') } };
            } else {
                query = {
                    $or: [
                        { ean: { $regex: new RegExp('^' + payload + '.*', 'i') } },
                        { article_code: { $regex: new RegExp('^' + payload + '.*', 'i') } }
                    ]
                }
            }

            const cursor = productCollection.find(query);
            const search = await cursor.limit(15).toArray();
            res.send({ payload: search })
            console.log(payload);

        })


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
        app.get("/sale/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const sale = await saleCollection.findOne(query);
            res.send(sale);
        });


        // U - Update sale
        app.put('/sale/:id', async (req, res) => {
            const id = req.params.id;
            const sale = req.body;
            const filter = { _id: ObjectId(id) };

            const updateSale = {
                $set: sale
            }

            const option = { upsert: true };

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
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {};
            const cursor = categoryCollection.find(query);
            if (page || size) {
                category = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                category = await cursor.toArray();
            }
            res.send(category);
        });

        // categoryCount
        app.get('/categoryCount', async (req, res) => {
            const count = await categoryCollection.estimatedDocumentCount();

            res.send({ count });
        })


        // get One category
        app.get("/category/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const category = await categoryCollection.findOne(query);
            res.send(category);
        });


        // update / put category
        app.put('/category/:id', async (req, res) => {
            const id = req.params.id;
            const category = req.body;
            const filter = { _id: ObjectId(id) };

            const updateCategory = {
                $set: category
            }

            const option = { upsert: true };

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


        // customer
        app.get('/customer', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {};
            const cursor = customerCollection.find(query);
            if (page || size) {
                customer = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                customer = await cursor.toArray();
            }
            res.send(customer);
        });

        // customerCount
        app.get('/customerCount', async (req, res) => {
            const count = await customerCollection.estimatedDocumentCount();

            res.send({ count });
        })


        // get One customer
        app.get("/customer/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const customer = await customerCollection.findOne(query);
            res.send(customer);
        });


        // update / put customer
        app.put('/customer/:id', async (req, res) => {
            const id = req.params.id;
            const customer = req.body;
            const filter = { _id: ObjectId(id) };

            const updatecustomer = {
                $set: customer
            }

            const option = { upsert: true };

            const result = await customerCollection.updateOne(filter, updatecustomer, option);
            res.send(result);
        })

        // create customer
        app.post('/customer', async (req, res) => {
            const customer = req.body;
            console.log('create new customer', customer);
            const result = await customerCollection.insertOne(customer);
            res.send(result.insertedId);
        })


        // delete customer
        app.delete('/customer/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await customerCollection.deleteOne(query);
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