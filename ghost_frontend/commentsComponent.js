const commentsTemplate = document.createElement("template");
commentsTemplate.innerHTML = `
<label for="user-select">Send as user:</label>
<select id="user-select"></select>
<br>
<input type="text" id="comment-input">
<button id="send-comment">Comment</button>
<div id="comments-div"></div>
`;

class CommentsComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(commentsTemplate.content.cloneNode(true));
  }

  async connectedCallback() {
    // fetch users and comments from api
    this.users = await fetch("http://localhost:3000/users").then((res) => res.json());
    this.comments = await fetch("http://localhost:3000/comments").then((res) => res.json());

    // attach users to select
    const select = this.shadowRoot.querySelector("#user-select");
    this.users.forEach((obj) => {
      select.options[select.options.length] = new Option(obj.name, obj.id);
    });

    // create user-msg components for each comment
    const commentsEl = this.shadowRoot.getElementById("comments-div");
    this.comments.forEach((obj) => {
      const usermsg = document.createElement("user-msg");
      usermsg.setAttribute("name", obj.name);
      usermsg.setAttribute("msg", obj.msg);
      usermsg.setAttribute("upvotes", obj.upvotes);
      commentsEl.append(usermsg);
    });

    this.shadowRoot.querySelector("#send-comment").addEventListener("click", async () => {
      console.log({
        id: this.shadowRoot.getElementById("user-select").value,
        msg: this.shadowRoot.getElementById("comment-input").value,
      });

      fetch("http://localhost:3000/comment", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userid: this.shadowRoot.getElementById("user-select").value,
          msg: this.shadowRoot.getElementById("comment-input").value,
        }),
      });
    });
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector("#send-comment").removeEventListener("click");
  }
}

customElements.define("comments-comp", CommentsComponent);
