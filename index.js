const express = require('express')
const cors = require('cors')
var jwt = require('jsonwebtoken');
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

//middle ware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {

    res.send('Genious car server runnung')
})

// token varify
function tokenVarify(req, res, next) {

    // console.log(req.headers.authorization)

    const authHeader = req.headers.authorization
    if (!authHeader) {

        return res.status(401).send({ message: 'Unothorized Access' })
    }
    const token = authHeader.split(' ')[1]
    console.log(token)

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {

        if (err) {

            return res.status(403).send({ message: 'Forbidden Access' })
        }

        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.ytkvvxy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

    try {

        //db for service
        const serverCollection = client.db('genious-car').collection('services')

        //db for order
        const orderCollection = client.db('genious-car').collection('orders')

        //for token
        app.post('/jwt', (req, res) => {

            const user = req.body
            console.log(user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '7d' })

            res.send({ token })
        })

        app.get('/services', async (req, res) => {

            const query = {}
            const cursor = serverCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        //get a single data
        app.get('/services/:id', async (req, res) => {

            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await serverCollection.findOne(query)
            res.send(result)
        })

        //post method for order
        app.post('/orders', async (req, res) => {
            const orders = req.body
            const result = await orderCollection.insertOne(orders)
            res.send(result)
        })

        //get data by email
        app.get('/orders', tokenVarify, async (req, res) => {

            //decoded decode the token that came from client to get the user info cz we send token as encripted to client and client give us a req with that encripted token to decoded dicript to varify the user 
            const decoded = req.decoded
            console.log(decoded)

            //condition for access in own data
            if (decoded.email !== req.query.email) {

                return res.status(403).send({ message: 'forbidden user' })
            }
            let query = {};
            if (req.query.email) {

                query = { email: req.query.email }
            }
            let cursor = orderCollection.find(query)
            let result = await cursor.toArray()
            res.send(result)

        })


        app.delete('/orders/:id', async (req, res) => {

            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await orderCollection.deleteOne(query)
            res.send(result)
        })
    }



    finally {

    }

}

run().catch(console.dir)


app.listen(port, () => {

    console.log(`Server runs on port ${port}`)
})