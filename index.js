const express = require('express');
const cors = require('cors');
// const sha256 = require('js-sha256').sha256;
require('dotenv').config();
const app = express();
const jwt = require('jsonwebtoken');

// Define port
const port = process.env.PORT || 5000;


// MiddleWare
app.use(cors());

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true }));

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

// const uri =  `mongodb+srv://${process.env.DB_LIVE_USER}:${process.env.DB_LIVE_PASS}@cluster0.tpwgs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

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
        const supplierCollection = posDB.collection('supplier');
        const purchaseCollection = posDB.collection('purchase');
        const inventoryCollection = posDB.collection('inventory');

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

            // console.log(id)
            // console.log(user)
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
            const cursor = productCollection.find(query, {article_code:1, name:1, ean:1,master_category:1, unit:1, cost:1, price:1});
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
            const productsId = req.body.data;
            const query = { article_code: { $in: productsId } };
            const cursor = productCollection.find(query,{article_code:1, name:1, unit:1, cost:1, price:1});
            // {article_code:1, name:1, unit:1, cost:1, price:1}
            product = await cursor.toArray();
            // console.log(productsId)
            // console.log(product)
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
        // by article code
        // app.get("/product-name/:id", async (req, res) => {
        //     const id = req.params.id;
        //     const query = { article_code:id };

        //     const product = await productCollection.findOne(query);
        //     res.send(product);
        // });

        

        // U - Update products
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            console.log(product)
            const filter = { _id: ObjectId(id) };

            const updateProduct = {
                $set: product
            }

            const option = { upsert: true };

            const result = await productCollection.updateOne(filter, updateProduct, option);
            res.send(result);
        });


        // Import Product
        app.post('/product/import', async (req,res) => {
            const products = req.body;
            let productName = [];

            const result = await productCollection.bulkWrite(products.map(point => {
                console.log(point)
                    return {
                        updateOne: {
                            filter: {
                                article_code: point.article_code
                            },
                            update: {
                                $set: point
                                
                            },
                            upsert: true,
                        }
                    };
                }));
            
            res.send(result);
        })


        // delete product
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productCollection.deleteOne(query);
            res.send(result);
        });

        // Product search
        app.get('/search/:q', async (req, res) => {
            let payload = req.params.q.trim().toString().toLocaleLowerCase();

            // res.send(payload)
            // check search item num | ean or article code
            const isNumber = /^\d/.test(payload)
            let query = {};
            if (!isNumber) {
                query = { name: { $regex: new RegExp('^' + payload + '.*', 'i') } };
                // query = { name:  payload  };
            } else {
                query = {
                    $or: [
                        // { ean: payload   },
                        // { article_code:  payload }
                        { ean: { $regex: new RegExp('^' + payload + '.*', 'i') } },
                        { article_code: { $regex: new RegExp('^' + payload + '.*', 'i') } }
                    ]
                }
            }

            const cursor = productCollection.find(query);
            const search = await cursor.limit(10).toArray();
            if(payload === ""){
                res.send([])
            }else{
                res.send({ search })
            }


            // console.log(search);

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


        // supplier
        app.get('/supplier', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {};
            const cursor = supplierCollection.find(query);
            if (page || size) {
                supplier = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                supplier = await cursor.toArray();
            }
            res.send(supplier);
        });

        // supplierCount
        app.get('/supplierCount', async (req, res) => {
            const count = await supplierCollection.estimatedDocumentCount();

            res.send({ count });
        })


        // get One supplier
        app.get("/supplier/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const supplier = await supplierCollection.findOne(query);
            res.send(supplier);
        });


        // update / put supplier
        app.put('/supplier/:id', async (req, res) => {
            const id = req.params.id;
            const supplier = req.body;
            const filter = { _id: ObjectId(id) };

            const updateSupplier = {
                $set: supplier
            }

            const option = { upsert: true };

            const result = await supplierCollection.updateOne(filter, updateSupplier, option);
            res.send(result);
        })

        // create supplier
        app.post('/supplier', async (req, res) => {
            const supplier = req.body;
            console.log('create new supplier', supplier);
            const result = await supplierCollection.insertOne(supplier);
            res.send(result.insertedId);
        })


        // delete supplier
        app.delete('/supplier/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await supplierCollection.deleteOne(query);
            res.send(result);
        })


        // Import Product
        app.post('/supplier/import', async (req,res) => {
            const suppliers = req.body;

            // res.send(suppliers)

            const result = await supplierCollection.bulkWrite(suppliers.map(supplier => {
                console.log(supplier?.code)
                    return {
                        updateOne: {
                            filter: {
                                code: supplier?.code
                            },
                            update: {
                                $set: supplier
                                
                            },
                            upsert: true,
                        }
                    };
                }));
            
            res.send(result);
        })




        // PURCHASE
        // purchase
        app.get('/purchase', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {};
            const cursor = purchaseCollection.find(query);
            if (page || size) {
                purchase = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                purchase = await cursor.toArray();
            }
            res.send(purchase);
        });

        // purchaseCount
        app.get('/purchaseCount', async (req, res) => {
            const count = await purchaseCollection.estimatedDocumentCount();

            res.send({ count });
        })


        // get One purchase
        app.get("/purchase/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const purchase = await purchaseCollection.findOne(query);
            res.send(purchase);
        });


        // update / put purchase
        app.put('/purchase/:id', async (req, res) => {
            const id = req.params.id;
            const purchase = req.body;
            const filter = { _id: ObjectId(id) };

            const updatePurchase = {
                $set: purchase
            }

            const option = { upsert: true };

            const result = await purchaseCollection.updateOne(filter, updatePurchase, option);
            res.send(result);
        })

        // create purchase
        app.post('/purchase', async (req, res) => {
            const purchase = req.body;
            console.log('create new purchase', purchase);
            const result = await purchaseCollection.insertOne(purchase);
            res.send(result.insertedId);
        })


        // delete purchase
        app.delete('/purchase/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await purchaseCollection.deleteOne(query);
            res.send(result);
        })



        // INVENTORY
        // get inventory by article code
        // by article_code
        app.get("/inventory-by-code/:code", async (req, res) => {
            const code = req.params.code;
            const query = { article_code: code };
            

            const productInventory = await inventoryCollection.findOne(query);
            if(productInventory){
                res.send(productInventory);
            }else{
                res.send({success: false});
            }
        });


        // inventory
        app.get('/inventory', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const query = {};
            const cursor = inventoryCollection.find(query);
            if (page || size) {
                inventory = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                inventory = await cursor.toArray();
            }
            res.send(inventory);
        });

        // inventoryCount
        app.get('/inventoryCount', async (req, res) => {
            const count = await inventoryCollection.estimatedDocumentCount();

            res.send({ count });
        })


        // get One inventory
        app.get("/inventory/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };

            const inventory = await inventoryCollection.findOne(query);
            res.send(inventory);
        });


        // update / put inventory
        app.put('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const inventory = req.body;
            const filter = { _id: ObjectId(id) };

            const updateinventory = {
                $set: inventory
            }

            const option = { upsert: true };

            const result = await inventoryCollection.updateOne(filter, updateinventory, option);
            res.send(result);
        })

        // create inventory
        app.post('/inventory', async (req, res) => {
            const inventory = req.body;
            console.log('create new inventory', inventory);
            const result = await inventoryCollection.insertOne(inventory);
            res.send(result.insertedId);
        })


        // delete inventory
        app.delete('/inventory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await inventoryCollection.deleteOne(query);
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