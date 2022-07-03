const template = document.createElement("template");
template.innerHTML = `
<style>
.button-div{
  display: inline-block;
}
#upvote-btn{
  padding-right: 10px;
  float: left;
}
#upvotes{
  margin: 0;
  float: left;
}
</style>
<link href="./bootstrap/bootstrap.min.css" rel="stylesheet">
<div class="mb-3">
<span id="name" style="font-weight: bold" class="fs-5"></span> <span id="ts" class="text-muted fs-6"></span>
<p id="msg" class="mb-1"></p>
<div class="button-div">
<input id="upvote-btn" type="image" src="./imgs/up-arrow.svg" style="width:28px; height:24px"/> <p id="upvotes"></p>
</div>
<!-- <button id="reply">Reply</button> -->
</div>
`;

class UserMsg extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.shadowRoot.querySelector("#name").innerText = this.getAttribute("name");
    this.shadowRoot.querySelector("#msg").innerText = this.getAttribute("msg");
    this.shadowRoot.querySelector("#upvotes").innerText = this.getAttribute("upvotes");
    this.shadowRoot.querySelector("#ts").innerText = this.getAttribute("ts");
  }

  static get observedAttributes() {
    return ["name", "msg", "upvotes", "ts", "id", "uservote"];
  }

  getRelativeTime(d1, d2 = new Date()) {
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
      if (Math.abs(elapsed) > units[u] || u == "second") return rtf.format(Math.round(elapsed / units[u]), u);
  }

  connectedCallback() {
    this.upvoteHandler = () => {
      //create upvote event - captured by commentsComponent
      if (this.getAttribute("uservote") == 1) {
        fetch("http://localhost:3000/unvote", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userid: this.shadowRoot.getRootNode().host.getRootNode().host.shadowRoot.getElementById("user-select")
              .value,
            msgid: this.getAttribute("id"),
          }),
        })
          .then((res) => res.json())
          .then(async (res) => {
            if (res == "Vote removed") {
              // Refresh comments
              this.setAttribute("uservote", 0);
              this.setAttribute("upvotes", this.getAttribute("upvotes") - 1);
            }
          });
      } else {
        //Send upvote
        fetch("http://localhost:3000/upvote", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userid: this.shadowRoot.getRootNode().host.getRootNode().host.shadowRoot.getElementById("user-select")
              .value,
            msgid: this.getAttribute("id"),
          }),
        })
          .then((res) => res.json())
          .then(async (res) => {
            if (res == "Vote added") {
              // Refresh comments
              this.setAttribute("uservote", 1);
              this.setAttribute("upvotes", parseInt(this.getAttribute("upvotes")) + 1);
            }
          });
      }
    };

    // highlight upvote if the user has voted
    if (this.getAttribute("uservote") == 1)
      this.shadowRoot.querySelector("#upvote-btn").src = "./imgs/up-arrow-blue.svg";

    // Event listener for upvotes
    this.shadowRoot.querySelector("#upvote-btn").addEventListener("click", this.upvoteHandler);
  }

  attributeChangedCallback(prop, oldVal, newVal) {
    if (prop === "name") this.shadowRoot.querySelector("#name").innerText = newVal;
    if (prop === "msg") this.shadowRoot.querySelector("#msg").innerText = newVal;
    if (prop === "upvotes") this.shadowRoot.querySelector("#upvotes").innerText = newVal;
    if (prop === "ts")
      this.shadowRoot.querySelector("#ts").innerText = "・" + this.getRelativeTime(new Date(newVal + "Z"));
    if (prop === "uservote") {
      if (newVal == 1) this.shadowRoot.querySelector("#upvote-btn").src = "./imgs/up-arrow-blue.svg";
      else this.shadowRoot.querySelector("#upvote-btn").src = "./imgs/up-arrow.svg";
    }
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector("#upvote-btn").removeEventListener("click", this.upvoteHandler);
  }
}

customElements.define("user-msg", UserMsg);
