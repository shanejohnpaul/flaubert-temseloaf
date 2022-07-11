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

// reply component
function ReplyMsg(props) {
  let upvoteImg = "./imgs/up-arrow.svg";
  if (props.msg.uservote) upvoteImg = "./imgs/up-arrow-blue.svg";
  return (
    <div className="mb-2">
      <span className="msg-name fs-5">{props.msg.name}</span>{" "}
      <span className="text-muted fs-6">{"・" + getRelativeTime(new Date(props.msg.ts + "Z"))}</span>
      <p className="mb-1">{props.msg.msg}</p>
      <div className="button-div">
        <input className="upvote-btn" type="image" src={upvoteImg} alt="upvote" onClick={props.upvoteHandler} />{" "}
        <p className="upvotes">{props.msg.upvotes}</p>
      </div>
    </div>
  );
}

// UserMsg component
class UserMsg extends React.Component {
  constructor(props) {
    super(props);
    this.state = { replyField: false };
    this.sendReply = this.sendReply.bind(this);
  }

  sendReply(event) {
    event.preventDefault();
    this.props.replyHandler(event.target[0].value);
    event.target.reset();
    this.setState({ replyField: false });
  }

  render() {
    let upvoteImg = "./imgs/up-arrow.svg";
    if (this.props.msg.uservote) upvoteImg = "./imgs/up-arrow-blue.svg";
    const replies = this.props.msg.replies.map((obj, idx) => {
      return <ReplyMsg key={idx} msg={obj} upvoteHandler={() => this.props.upvoteHandler(obj, idx)} />;
    });

    return (
      <div>
        <div className="mb-2">
          <span className="msg-name fs-5">{this.props.msg.name}</span>{" "}
          <span className="text-muted fs-6">{"・" + getRelativeTime(new Date(this.props.msg.ts + "Z"))}</span>
          <p className="mb-1">{this.props.msg.msg}</p>
          <div className="button-div">
            <input
              className="upvote-btn"
              type="image"
              src={upvoteImg}
              alt="upvote"
              onClick={() => this.props.upvoteHandler(this.props.msg)}
            />{" "}
            <p className="upvotes">{this.props.msg.upvotes}</p>
            <button
              className="reply-btn"
              onClick={() => {
                this.setState({ replyField: !this.state.replyField });
              }}
            >
              Reply
            </button>
          </div>
          {this.state.replyField && (
            <form className="d-flex reply-form" onSubmit={this.sendReply}>
              <input type="text" className="form-control me-3 reply-input" placeholder="What are your thoughts?" />
              <button className="btn btn-primary" type="submit">
                Reply
              </button>
            </form>
          )}
        </div>
        <div className="replies-div">{replies}</div>
      </div>
    );
  }
}

class Comments extends React.Component {
  constructor(props) {
    super(props);
    this.state = { users: [], selectedUser: undefined, comments: [] };
    this.sendComment = this.sendComment.bind(this);
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

      let found = false;
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].id === msg.msgid) {
          comments[i].upvotes += msg.vote;
          this.setState({ comments: comments });
          break;
        } else {
          for (let j = 0; j < comments[i].replies.length; j++) {
            if (comments[i].replies[j].id === msg.msgid) {
              comments[i].replies[j].upvotes += msg.vote;
              this.setState({ comments: comments });
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
    });
  }

  async getComments() {
    const comments = await fetch(`http://localhost:3000/comments/${this.state.selectedUser}`).then((res) => res.json());

    // Separate base comments and replies
    const basecomments = [];

    //iterate from oldest to latest comments
    for (let i = comments.length - 1; i >= 0; i--) {
      if (comments[i].parentid == null) basecomments.push({ ...comments[i], replies: [] });
      else {
        const idx = basecomments.findIndex((obj) => obj.id === comments[i].parentid);
        basecomments[idx].replies.push(comments[i]);
      }
    }

    this.setState({ comments: basecomments });
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
  upvoteHandler(idx, msg, childidx) {
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
            if (childidx === -1) {
              comments[idx].uservote = 0;
              comments[idx].upvotes -= 1;
            } else {
              comments[idx].replies[childidx].uservote = 0;
              comments[idx].replies[childidx].upvotes -= 1;
            }

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
            if (childidx === -1) {
              comments[idx].uservote = 1;
              comments[idx].upvotes += 1;
            } else {
              comments[idx].replies[childidx].uservote = 1;
              comments[idx].replies[childidx].upvotes += 1;
            }
            this.setState({ comments: comments });
            this.socket.emit("upvote", { msgid: msg.id, vote: 1 });
          }
        });
    }
  }

  replyHandler(msg, parentid, userid) {
    fetch("http://localhost:3000/comment", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userid: userid,
        msg: msg,
        parentid: parentid,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res === "Comment added") {
          // Refresh comments
          await this.getComments();
        }
      });
  }

  render() {
    const userOptions = this.state.users.map((obj) => {
      return (
        <option key={obj.id} value={obj.id}>
          {obj.name}
        </option>
      );
    });

    const messages = [];

    // do in reverse
    for (let i = this.state.comments.length - 1; i >= 0; i--) {
      const obj = this.state.comments[i];
      messages.push(
        <UserMsg
          key={obj.id}
          msg={obj}
          userid={this.state.selectedUser}
          upvoteHandler={(msg, childidx = -1) => this.upvoteHandler(i, msg, childidx)}
          replyHandler={(msg) => this.replyHandler(msg, obj.id, this.state.selectedUser)}
        />
      );
    }

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
