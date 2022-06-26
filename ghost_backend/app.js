require("dotenv").config();
const express = require("express");

const cors = require("cors");
const fs = require("fs");
const path = require("path");
const morgan = require("morgan");

const knex = require("./knex");
const app = express();
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
          table.integer("upvotes").defaultTo(0); //comment content
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

app.get("/users", async (req, res) => {
  try {
    const users = await knex("users");
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

app.get("/comments", async (req, res) => {
  try {
    const comments = await knex("comments").join("users", "comments.userid", "users.id").orderBy("ts", "desc");
    res.status(200).json(comments);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

app.post("/comment", async (req, res) => {
  try {
    const addComment = await knex("comments").insert({ userid: req.body.userid, msg: req.body.msg });
    if (addComment) res.status(200).json("Comment added");
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
