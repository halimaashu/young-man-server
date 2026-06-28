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
    const favoriteClassCollection = database.collection("favorite");
    const paymentCollection = database.collection("payment");
    const forumCollection = database.collection("forum");
    const trainerFormCollection = database.collection("trainerForm");
    const voteCollection = database.collection("vote");

    app.get("/", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // class related api
    app.post("/api/allClass", async (req, res) => {
      const data = req.body;
      const newClass = await classCollection.insertOne(data);
      res.status(201).send(newClass);
    });
    // get all class
    app.get("/api/allClass", async (req, res) => {
      const allClass = await classCollection.find().toArray();
      res.status(200).send(allClass);
    });

    // get user created class by id

    app.get("/api/myClass", async (req, res) => {
      const query = {};
      if (req.query.userId) {
        query.userId = req.query.userId;
      }

      const result = await classCollection.find(query).toArray();
      res.send(result);
    });

    // get bu query
    app.get("/api/allClass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const allClass = await classCollection.findOne(query);
      res.status(200).send(allClass);
    });

    // payment system related api
    app.post("/api/payment", async (req, res) => {
      const { sessionId } = req.body;
      const ifExist = await paymentCollection.findOne({ sessionId });
      if (ifExist) {
        return res.json({ massage: "cant exist!" });
      }
      const data = req.body;
      const result = await paymentCollection.insertOne(data);
      res.status(201).send(result);
    });
    app.get("/api/payment", async (req, res) => {
      const query = {};
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });
    // community forum related api
    app.post("/api/forum", async (req, res) => {
      const forum = req.body;
      const createAt = new Date();
      const postData = { ...forum, createAt };
      const newForum = await forumCollection.insertOne(postData);
      res.status(201).send(newForum);
    });
    app.get("/api/forum", async (req, res) => {
      const query = {};
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      const result = await forumCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/api/forum/:id", async (req, res) => {
      const id = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await forumCollection.findOne(query);
      res.send(result);
    });
    // apply as trainer related api
    app.post("/api/applyAsTrainer", async (req, res) => {
      const data = req.body;
      const createAt = new Date();
      const trainerForm = { ...data, createAt };
      const result = await trainerFormCollection.insertOne(trainerForm);
      res.status(201).send(result);
    });
    app.get("/api/applyAsTrainer", async (req, res) => {
      const result = await trainerFormCollection.find().toArray();
      res.send(result);
    });

    // favorite related api
    app.post("/api/favorite", async (req, res) => {
      const data = req.body;
      const result = await favoriteClassCollection.insertOne(data);
      res.status(201).send(result);
    });
    app.get("/api/favorite", async (req, res) => {
      const query = {};
      if (req.query.userId) {
        query.userId = req.query.userId;
      }
      const result = await favoriteClassCollection.find(query).toArray();
      res.send(result);
    });
    // vote related api
    // Vote API
    app.post("/api/vote", async (req, res) => {
      try {
        const { userId, postId, type } = req.body;

        // Validation
        if (!userId || !postId || !type) {
          return res.status(400).send({
            success: false,
            message: "Missing required fields",
          });
        }

        // Check existing vote
        const existVote = await voteCollection.findOne({
          userId,
          postId,
        });

        // No previous vote -> Insert
        if (!existVote) {
          const result = await voteCollection.insertOne({
            userId,
            postId,
            type,
          });

          return res.send({
            success: true,
            message: "Vote added",
            result,
          });
        }

        // Same vote clicked again -> Remove vote (Toggle)
        if (existVote.type === type) {
          const result = await voteCollection.deleteOne({
            _id: existVote._id,
          });

          return res.send({
            success: true,
            message: "Vote removed",
            result,
          });
        }

        // Different vote -> Update
        const result = await voteCollection.updateOne(
          { _id: existVote._id },
          {
            $set: {
              type,
            },
          },
        );

        return res.send({
          success: true,
          message: "Vote updated",
          result,
        });

       
        
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Internal Server Error",
        });
      }
    });

    app.get("/api/vote/:postId",async(req,res)=>{
      const {postId}=req.params;
      const like=await voteCollection.countDocuments({postId,type:"like"})
      const dislike=await voteCollection.countDocuments({postId,type:"dislike"})
      res.send({like,dislike})
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
