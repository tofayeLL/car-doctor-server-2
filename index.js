const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;


// middleware
app.use(cors(
    {
        origin: ['http://localhost:5173'],
        credentials: true
    }
));
app.use(express.json());
app.use(cookieParser());


// middlewares
const logger = async (req, res, next) => {
    console.log('log: info', req.method, req.url);
    next();
}

// verify token
const verifyToken = async(req, res, next) => {
    const token = req.cookies?.token;
    console.log('token:',token);


    if(!token){
        return res.status(401).send({message: 'un authorized'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=> {
        if(err){
            console.log(err);
            return res.status(401).send({message: 'not authorized'})
        }

        // if valid token
        console.log('from valid token', decoded)
        req.user = decoded;
        next();
    })

    
}







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8mgufzz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const serviceCollection = client.db('carDoctor').collection('services');



        // auth related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });


            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none'
                })
                .send({ success: true });
        })



        // for clear cookie when user logout
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logout user', user);
            res.clearCookie('token', { maxAge: 0 }).send({ success: true })
        })



        //   services related all things

        // find many or GET ALL
        app.get('/services',logger, verifyToken, async (req, res) => {
            const user= req.body;
            console.log(user);
            console.log('from service', req.cookies);
            console.log('token owner info:', req.user)
            const cursor = serviceCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // GET single or FIND SINGLE
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const options = {

                projection: { title: 1, service_id: 1, price: 1, img: 1 },
            };


            const result = await serviceCollection.findOne(query, options);
            res.send(result);
        })







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);











app.get('/', (req, res) => {
    res.send('doctor car server is running..');
})

app.listen(port, () => {
    console.log(`doctor server running at port:${port}`)
})
