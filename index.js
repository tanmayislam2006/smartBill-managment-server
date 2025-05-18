const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(cors());
app.use(express.json());
// console.log(process.env.DB_USER, process.env.DB_PASSWORD);
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kn8r7rw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    const smartBillUsersCollection = client
      .db("smartBillUser")
      .collection("smartUsers");
    const createdBillCollection = client
      .db("createdBillCollection")
      .collection("createdBill");
    const transictionCollection = client
      .db("transictionCollection")
      .collection("transiction");
      // crete user
    app.post("/register", async (req, res) => {
      const userInformation = req.body;
      const result = await smartBillUsersCollection.insertOne(userInformation);
      res.send(result);
    });
    // update user login information 
    app.patch("/login", async (req, res) => {
      const { email, lastSignInTime } = req.body;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          lastSignInTime,
        },
      };
      const result = await smartBillUsersCollection.updateOne(
        filter,
        updateDoc
      );
      res.send(result);
    });
    // get all bill from db
    app.get("/mybill/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid: uid };
      const result = await createdBillCollection.find(query).toArray();
      res.send(result);
    });
    // single bill details 
    app.get("/bill/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await createdBillCollection.findOne(query);
      res.send(result);
    });
    // load user transiction 
    app.get("/transiction/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid: uid };
      const result = await transictionCollection.find(query).toArray();
      res.send(result);
    });
    // transiction created 
    app.post("/bill/:id", async (req, res) => {
      const transictionInformation = req.body;
      console.log(transictionInformation);
      const result = await transictionCollection.insertOne(
        transictionInformation
      );
      res.send(result);
    });
    // create bill
    app.post("/createdbill", async (req, res) => {
      const billInformation = req.body;
      const result = await createdBillCollection.insertOne(billInformation);
      res.send(result);
    });
    // edit bill 
    app.patch("/editbill/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateBillInformation = req.body
      const updateDoc = {
        $set: {
          ...updateBillInformation,
        },
      };
      const result = await createdBillCollection.updateOne(filter, updateDoc);
      res.send(result);
    });
    // deleted specific bil
    app.delete("/bill/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await createdBillCollection.deleteOne(query);
      res.send(result);
    });
    // get user by email
    app.get("/user/:uid", async (req, res) => {
      const uid = req.params.uid;
      const query = { uid: uid };
      const user = await smartBillUsersCollection.findOne(query);
      res.send(user);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("server work succesfully");
});

app.listen(port, () => {
  console.log(`server is runnig on http://localhost:${port}`);
});
