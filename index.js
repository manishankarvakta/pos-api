const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const port = process.env.PORT || 5000;




const uri = "mongodb+srv://pos-user:TeDAD10lrudUgHxW@cluster0.rfbl8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();

        const posDB = client.db('pos');
        const userCollection = posDB.collection('users');
        const user = {name: "Manishankar Vakta", email: "manishankarvakta@gmail.com"};
        const result = await userCollection.insertOne(user);
        console.log(`User has been Created with user ID ${result.insertedId}`)
    }
    finally {
        // client.close();
    }
}
run().catch(console.dir);


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('POS API');
});

app.listen(port, () => {
    console.log('POS API Listen port: ', port);
})