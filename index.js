const express = require('express')
const app = express()
const cors = require('cors')
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;




const port = process.env.PORT || 5000;

// var serviceAccount = require('./cooker-garden-firebase-adminsdk.json');
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);



admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


// cooker-garden-firebase-adminsdk.json


// middleware 
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zsx3s.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next) {
    // console.log(req.headers.authorization);
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        console.log(token);
        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }
    }
    next();
}


async function run() {
    try {
        await client.connect();
        const database = client.db('cooker_garden');
        const usersCollection = database.collection('users')
        const productsCollection = database.collection('products')
        /* 
                // GET API Appointment
                app.get('/appointment', verifyToken, async (req, res) => {
                    const email = req.query.email;
                    const date = req.query.date;
        
                    const query = { email: email, date: date };
                    const cursor = appointmentCollection.find(query);
                    const appointment = await cursor.toArray();
                    res.json(appointment);
                    
                }) */

        // GET API all products
        app.get('/allProducts', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.json(products);
        })

        // DELETE Product admin and customer
        app.delete('/deleteProduct/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await travelPlaceCollection.deleteOne(query);
            console.log(result);
            res.json(result);
        })


        // POST API Add Product 
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.json(result)
        });

        /*------------------ users and admin API start----------------- */


        // POST API users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result)
        })


        // UPDATE || UPSERT API for  Google login users
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        })

        // checking admin API
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true
            }
            res.json({ admin: isAdmin })
        })


        // Make an Admin 
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body
            const requester = req.decodedEmail
            if (requester) {
                const requesterAccount = await usersCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = {
                        $set: { role: 'admin' }
                    };
                    const result = await usersCollection.updateOne(filter, updateDoc);
                    res.json(result)
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }


        })
    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Cooker Garden is Running Server')
})

app.listen(port, () => {
    console.log(`listening at port ${port}`)
})


// git push heroku main