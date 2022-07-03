const commentsTemplate = document.createElement("template");
commentsTemplate.innerHTML = `
<link href="./bootstrap/bootstrap.min.css" rel="stylesheet">
<label for="user-select">Send as user:</label>
<select id="user-select" class="my-3"></select> <span class="text-muted">(for testing purposes)</span>
<br>
<form class="d-flex" id="comment-form">
  <input type="text" class="form-control me-3" id="comment-input" placeholder="What are your thoughts?">
  <button class="btn btn-primary" type="submit">Comment</button>
</form>
<hr class="my-5"/>
<div id="comments-div"></div>
`;

class CommentsComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(commentsTemplate.content.cloneNode(true));
  }

  async connectedCallback() {
    // fetch users
    this.users = await fetch("http://localhost:3000/users").then((res) => res.json());

    // attach users to select
    const select = this.shadowRoot.querySelector("#user-select");
    this.users.forEach((obj) => {
      select.options[select.options.length] = new Option(obj.name, obj.id);
    });

    // fetch comments for selected user
    this.getcomments = async () => {
      this.comments = await fetch(
        `http://localhost:3000/comments/${this.shadowRoot.getElementById("user-select").value}`
      ).then((res) => res.json());

      // create user-msg components for each comment
      const commentsEl = this.shadowRoot.getElementById("comments-div");

      //remove all child nodes - clear page
      while (commentsEl.hasChildNodes()) {
        commentsEl.removeChild(commentsEl.lastChild);
      }
      this.comments.forEach((obj) => {
        const usermsg = document.createElement("user-msg");
        usermsg.setAttribute("name", obj.name);
        usermsg.setAttribute("msg", obj.msg);
        usermsg.setAttribute("upvotes", obj.upvotes);
        usermsg.setAttribute("ts", obj.ts);
        usermsg.setAttribute("id", obj.id);
        usermsg.setAttribute("uservote", obj.uservote);
        commentsEl.append(usermsg);
      });
    };

    await this.getcomments();

    // Comment submission event handler
    this.sendComment = (event) => {
      event.preventDefault();

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
      })
        .then((res) => res.json())
        .then(async (res) => {
          if (res == "Comment added") {
            // Refresh comments
            await this.getcomments();
            this.shadowRoot.getElementById("comment-input").value = "";
          }
        });
    };

    this.shadowRoot.querySelector("#comment-form").addEventListener("submit", this.sendComment);
    this.shadowRoot.querySelector("#user-select").addEventListener("change", this.getcomments); //for testing
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector("#comment-form").removeEventListener("submit", this.sendComment);
    this.shadowRoot.querySelector("#user-select").removeEventListener("change", this.getcomments); //for testing
  }
}

customElements.define("comments-comp", CommentsComponent);
