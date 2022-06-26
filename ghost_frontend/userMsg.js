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
<input id="upvote-btn" type="image" src="./imgs/up-arrow.png" style="width:28px; height:24px"/> <p id="upvotes"></p>
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
    return ["name", "msg", "upvotes", "ts"];
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
      alert(this.getAttribute("upvotes"));
    };
    this.shadowRoot.querySelector("#upvote-btn").addEventListener("click", this.upvoteHandler);
  }

  attributeChangedCallback(prop, oldVal, newVal) {
    if (prop === "name") this.shadowRoot.querySelector("#name").innerText = newVal;
    if (prop === "msg") this.shadowRoot.querySelector("#msg").innerText = newVal;
    if (prop === "upvotes") this.shadowRoot.querySelector("#upvotes").innerText = newVal;
    if (prop === "ts")
      this.shadowRoot.querySelector("#ts").innerText = "・" + this.getRelativeTime(new Date(newVal + "Z"));
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector("#upvote-btn").removeEventListener("click", this.upvoteHandler);
  }
}

customElements.define("user-msg", UserMsg);
