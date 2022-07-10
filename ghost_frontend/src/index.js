import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "bootstrap/dist/css/bootstrap.css";
import { io } from "socket.io-client";

// to derive relative time in words
function getRelativeTime(d1, d2 = new Date()) {
  const units = {
    year: 24 * 60 * 60 * 1000 * 365,
    month: (24 * 60 * 60 * 1000 * 365) / 12,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
    second: 1000,
  };
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const elapsed = d1 - d2;

  // "Math.abs" accounts for both "past" & "future" scenarios
  for (var u in units)
    if (Math.abs(elapsed) > units[u] || u === "second") return rtf.format(Math.round(elapsed / units[u]), u);
}

// UserMsg component
function UserMsg(props) {
  let upvoteImg = "./imgs/up-arrow.svg";
  if (props.msg.uservote) upvoteImg = "./imgs/up-arrow-blue.svg";
  return (
    <div className="mb-3">
      <span className="msg-name fs-5">{props.msg.name}</span>{" "}
      <span className="text-muted fs-6">{"・" + getRelativeTime(new Date(props.msg.ts + "Z"))}</span>
      <p className="mb-1">{props.msg.msg}</p>
      <div className="button-div">
        <input className="upvote-btn" type="image" src={upvoteImg} alt="upvote" onClick={props.upvoteHandler} />{" "}
        <p className="upvotes">{props.msg.upvotes}</p>
      </div>
      {/* <button id="reply">Reply</button> */}
    </div>
  );
}

class Comments extends React.Component {
  constructor(props) {
    super(props);
    this.state = { users: [], selectedUser: undefined, comments: [] };
    this.sendComment = this.sendComment.bind(this);
    // this.upvoteHandler = this.upvoteHandler.bind(this);
  }

  async componentDidMount() {
    const users = await fetch("http://localhost:3000/users").then((res) => res.json());
    if (users.length) {
      this.setState({ users: users, selectedUser: users[0].id }, async () => await this.getComments());
    }

    //socket connection
    this.socket = io("ws://localhost:3000");

    //update upvote on vote message
    this.socket.on("upvote-msg", (msg) => {
      const comments = this.state.comments.slice();
      const idx = comments.findIndex((obj) => obj.id === msg.msgid);

      if (idx > -1) {
        comments[idx].upvotes += msg.vote;
        this.setState({ comments: comments });
      }
    });
  }

  async getComments() {
    const comments = await fetch(`http://localhost:3000/comments/${this.state.selectedUser}`).then((res) => res.json());
    this.setState({ comments: comments });
  }

  sendComment(event) {
    event.preventDefault();

    fetch("http://localhost:3000/comment", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userid: this.state.selectedUser,
        msg: event.target[0].value,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res === "Comment added") {
          // Refresh comments
          await this.getComments();
          event.target.reset();
        }
      });
  }

  // Handle upvotes and unvotes
  upvoteHandler(msg, idx) {
    if (msg.uservote === 1) {
      // unvote
      fetch("http://localhost:3000/unvote", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userid: this.state.selectedUser,
          msgid: msg.id,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res === "Vote removed") {
            // Refresh comments
            const comments = this.state.comments.slice();
            comments[idx].uservote = 0;
            comments[idx].upvotes -= 1;
            this.setState({ comments: comments });
            this.socket.emit("upvote", { msgid: msg.id, vote: -1 });
          }
        });
    } else {
      //upvote
      fetch("http://localhost:3000/upvote", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userid: this.state.selectedUser,
          msgid: msg.id,
        }),
      })
        .then((res) => res.json())
        .then(async (res) => {
          if (res === "Vote added") {
            // Refresh comments
            const comments = this.state.comments.slice();
            comments[idx].uservote = 1;
            comments[idx].upvotes += 1;
            this.setState({ comments: comments });
            this.socket.emit("upvote", { msgid: msg.id, vote: 1 });
          }
        });
    }
  }

  render() {
    const userOptions = this.state.users.map((obj) => {
      return (
        <option key={obj.id} value={obj.id}>
          {obj.name}
        </option>
      );
    });

    const messages = this.state.comments.map((obj, idx) => {
      return (
        <UserMsg
          key={obj.id}
          msg={obj}
          userid={this.state.selectedUser}
          upvoteHandler={() => this.upvoteHandler(obj, idx)}
        />
      );
    });

    return (
      <div className="container my-3">
        <h3 className="comment-title">Discussion</h3>
        <label htmlFor="user-select">Send as user:</label>{" "}
        <select
          id="user-select"
          className="my-3"
          value={this.state.selectedUser}
          onChange={(event) =>
            this.setState({ selectedUser: event.target.value }, async () => await this.getComments())
          }
        >
          {userOptions}
        </select>{" "}
        <span className="text-muted">(for testing purposes)</span>
        <br />
        <form className="d-flex comment-form" onSubmit={this.sendComment}>
          <input type="text" className="form-control me-3 comment-input" placeholder="What are your thoughts?" />
          <button className="btn btn-primary" type="submit">
            Comment
          </button>
        </form>
        <hr className="my-5" />
        <div className="comments-div">{messages}</div>
      </div>
    );
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Comments />);
