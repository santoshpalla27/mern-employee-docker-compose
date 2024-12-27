import { MongoClient, ServerApiVersion } from "mongodb";

// Get the Mongo URI from environment variables, defaulting to the one specified in docker-compose
const URI = process.env.MONGO_URI || "mongodb://mongodb:27017";  // Default to employee database
const client = new MongoClient(URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

try {
  // Connect the client to the server
  await client.connect();
  // Send a ping to confirm a successful connection
  await client.db().command({ ping: 1 });  // Default to the "employee" database from the URI
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
} catch (err) {
  console.error(err);
}

// The "employee" database is already specified in the URI, no need to explicitly mention it here
let db = client.db("employees");

export default db;
