require("dotenv").config();
const express = require("express");

const cors = require("cors");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");

const knex = require("./knex");
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const port = process.env.PORT;

//Initialize tables in database
async function initializeDB() {
  try {
    // Enable foreign key constraint
    knex.raw("PRAGMA foreign_keys = ON;").then(() => {
      console.log("Foreign Key Check activated.");
    });

    await knex.schema.hasTable("users").then((exists) => {
      if (!exists) {
        return knex.schema.createTable("users", (table) => {
          table.increments("id").primary(); // user ID
          table.string("name"); // user name (Display name with caps)
        });
      }
    });
    await knex.schema.hasTable("comments").then((exists) => {
      if (!exists) {
        return knex.schema.createTable("comments", (table) => {
          table.increments("id").primary(); // comment ID
          table.integer("userid"); // relation users
          table.foreign("userid").references("id").inTable("users"); // relation users
          table.timestamp("ts").defaultTo(knex.fn.now()); // comment timestamp
          table.string("msg"); //comment content
        });
      }
    });
    await knex.schema.hasTable("upvotes").then((exists) => {
      if (!exists) {
        return knex.schema.createTable("upvotes", (table) => {
          table.integer("userid");
          table.foreign("userid").references("id").inTable("users"); // relation users
          table.integer("msgid");
          table.foreign("msgid").references("id").inTable("comments"); // relation comment
          table.primary(["userid", "msgid"]);
        });
      }
    });

    // Adding example data
    if ((await knex("users").select("id")).length === 0) {
      await knex("users").insert([{ name: "Shane" }, { name: "Tom" }, { name: "Mary" }, { name: "Paula" }]);
    }
    if ((await knex("comments").select("id")).length == 0) {
      await knex("comments").insert({ userid: 1, msg: "Hi. This is Shane!", ts: "2022-06-12 14:43:36" });
    }
  } catch (err) {
    console.error(err);
  }
}

initializeDB().then((res) => console.log("Database Initialization complete."));

app.use(cors());

// log events in access.log file
const accessLogStream = fs.createWriteStream(path.join(__dirname, "access.log"), { flags: "a" });
app.use(morgan("combined", { stream: accessLogStream }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.send("Hi! I'm the api ✌");
});

//routes
// get list of users for testing purposes
app.get("/users", async (req, res) => {
  try {
    const users = await knex("users");
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// get all comments joined with user names and upvotes
app.get("/comments/:userid", async (req, res) => {
  try {
    if (req.params.userid === undefined) return res.status(400).json("User ID required");
    const comments = await knex.raw(
      `SELECT comments.id, comments.userid, ts, msg, name, COUNT(upvotes.userid) AS upvotes,  COUNT(CASE WHEN upvotes.userid=${req.params.userid} THEN 1 END) AS uservote
      FROM comments
      JOIN users ON comments.userid = users.id
      LEFT JOIN upvotes ON comments.id = upvotes.msgid
      GROUP BY comments.id
      ORDER BY ts DESC`
    );
    res.status(200).json(comments);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// post a comment
app.post("/comment", async (req, res) => {
  try {
    if (req.body.userid === undefined) return res.status(400).json("User ID required");
    if (req.body.msg === undefined) return res.status(400).json("Message required");
    const addComment = await knex("comments").insert({ userid: req.body.userid, msg: req.body.msg });
    if (addComment) res.status(200).json("Comment added");
    else res.status(500).send();
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// cast an upvote
app.post("/upvote", async (req, res) => {
  try {
    if (req.body.userid === undefined) return res.status(400).json("User ID required");
    if (req.body.msgid === undefined) return res.status(400).json("Message ID required");
    const addVote = await knex("upvotes").insert({ userid: req.body.userid, msgid: req.body.msgid });
    if (addVote) res.status(200).json("Vote added");
    else res.status(500).send();
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// undo upvote
app.post("/unvote", async (req, res) => {
  try {
    if (req.body.userid === undefined) return res.status(400).json("User ID required");
    if (req.body.msgid === undefined) return res.status(400).json("Message ID required");
    const addVote = await knex("upvotes").where({ userid: req.body.userid, msgid: req.body.msgid }).del();
    if (addVote) res.status(200).json("Vote removed");
    else res.status(500).send();
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

// catch 404 and forward to error handler
app.use((req, res) => {
  res.status(404).send("Page not found");
});

io.on("connection", (socket) => {
  socket.on("upvote", (obj) => {
    socket.broadcast.emit("upvote-msg", obj);
  });
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
