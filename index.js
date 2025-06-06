const express = require("express");
const app = express();
const port = process.env.PORT || 4000;
require("dotenv").config();
const cors = require("cors");
const coiikieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://smart-bill-manager-8076b.web.app",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(coiikieParser());
const jwt = require("jsonwebtoken");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kn8r7rw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const admin = require("firebase-admin");

const serviceAccount = require("./firebaseAdmin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyToken = (req, res, next) => {
  // get token
  const getToken = req.cookies.yourToken;
  if (!getToken) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(getToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};
const verifyFirebaseToken = async (req, res, next) => {
  const authoriztion = req.headers?.authoriztion;
  if (!authoriztion || !authoriztion.startsWith(`Bearer `)) {
    return res.status(401).send({ message: "unauthorized access" });
    // now get token
  }
  const getToken = authoriztion.split(" ")[1];
  try {
    const  userInfo =await admin.auth().verifyIdToken(getToken)
    req.tokenUid=userInfo.uid

    next();
  } catch {
    return res.status(401).send({ message: "unauthorized access" });
  }
};
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
    // get user with his email
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await smartBillUsersCollection.findOne(query);
      res.send(user);
    });
    app.post("/jsonwebtoken", async (req, res) => {
      const userUid = req.body;
      const token = jwt.sign(userUid, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });

      res.cookie("yourToken", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      res.send({ success: "your token set in cookie" });
    });
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
    app.get("/mybill/:uid", verifyToken, async (req, res) => {
      const uid = req.params.uid;
      const decodedUid = req.decoded.uid;
      if (uid !== decodedUid) {
        return res.status(403).send({ message: "forbidden access" });
      }
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
    app.get("/transiction/:uid", verifyFirebaseToken, async (req, res) => {
      const uid = req.params.uid;
      if(req.tokenUid !== uid){
         return res.status(403).send({ message: "forbidden access" });
      }
      const query = { uid: uid };
      const result = await transictionCollection.find(query).toArray();
      res.send(result);
    });
    // transiction created
    app.post("/bill/:id", async (req, res) => {
      const transictionInformation = req.body;

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
      const updateBillInformation = req.body;
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
    // get user by uid

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
