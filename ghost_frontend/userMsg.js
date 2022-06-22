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
</style
<div>
<p id="name" style="font-weight: bold"></p>
<p id="msg"></p>
<div class="button-div">
<input id="upvote-btn" type="image" src="./imgs/up-arrow.png" style="width:20px; height:20px"/> <p id="upvotes"></p>
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
  }

  static get observedAttributes() {
    return ["name", "msg", "upvotes"];
  }

  connectedCallback() {
    this.shadowRoot.querySelector("#upvote-btn").addEventListener("click", () => alert(this.getAttribute("upvotes")));
  }

  attributeChangedCallback(prop, oldVal, newVal) {
    if (prop === "name") this.shadowRoot.querySelector("#name").innerText = newVal;
    if (prop === "msg") this.shadowRoot.querySelector("#msg").innerText = newVal;
    if (prop === "upvotes") this.shadowRoot.querySelector("#upvotes").innerText = newVal;
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector("#upvote-btn").removeEventListener("click");
  }
}

customElements.define("user-msg", UserMsg);
