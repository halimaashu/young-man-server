const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_DB_CONNECTION_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("yong-man");
    const userCollection = database.collection("user");
    const classCollection = database.collection("all-class");

    app.get("/",async (req, res) => {
     const result =await userCollection.find().toArray();
     res.send(result)
    });
    // class related api
    app.post("/api/allClass",async(req,res)=>{
      const data =req.body;
      const newClass=await classCollection.insertOne(data)
      res.status(201).send(newClass)
    })
    // get all class
      app.get("/api/allClass",async(req,res)=>{
     
    

      const allClass=await classCollection.find().toArray()
      res.status(200).send(allClass)
    })
    // get bu query
      app.get("/api/allClass/:id",async(req,res)=>{
        const id=req.params.id;
        const query={_id: new ObjectId(id)}
     
    

      const allClass=await classCollection.findOne(query)
      res.status(200).send(allClass)
    })


    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error(error);
  }
}

run();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});