import express from "express";
import { get } from "http";
import { MongoClient } from "mongodb";
import path from "path";

const server = express();

server.use(express.static(path.join(__dirname, "/build")));
server.use(express.json());

// Db connection setup
const withDb = async (operations, res) => {
  try {
    const client = await MongoClient.connect("mongodb://localhost:27017", {
      useNewUrlParser: true,
    });

    const db = client.db("my-blog");

    await operations(db);

    client.close();
  } catch (error) {
    res.status(500).json({ message: "Error connection to db ", error });
  }
};

server.get("/api/articles/:name", async (req, res) => {
  const articleName = req.params.name;

  withDb(async (db) => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(articleInfo);
  }, res);
});

server.post("/api/articles/:name/upvote", async (req, res) => {
  const articleName = req.params.name;

  withDb(async (db) => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: { upvotes: articleInfo.upvotes + 1 },
      }
    );

    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

server.post("/api/articles/:name/add-comment", (req, res) => {
  const { username, text } = req.body;
  const articleName = req.params.name;

  withDb(async (db) => {
    const articleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    await db.collection("articles").updateOne(
      { name: articleName },
      {
        $set: { comments: articleInfo.comments.concat({ username, text }) },
      }
    );
    const updatedArticleInfo = await db
      .collection("articles")
      .findOne({ name: articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

server.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/build/index.html"));
});

server.listen(8000, () => console.log("Listening on port 8000"));
