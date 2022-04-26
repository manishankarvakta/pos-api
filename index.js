const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());



const uri = "mongodb+srv://pos-user:TeDAD10lrudUgHxW@cluster0.rfbl8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const posDB = client.db('pos');
        const userCollection = posDB.collection('users');

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
            res.send({ result: `success: ${result.insertedId}`, data: result });
        })


        // delete user
        app.delete('/user/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.deleteOne(query);
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