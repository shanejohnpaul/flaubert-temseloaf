const template = document.createElement("template");
template.innerHTML = `
<div class="user-card">
<p id="user"></p>
<p id="msg"></p>
<button id="upvotes"></button>
</div>
`;

class UserMsg extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.shadowRoot.querySelector("#user").innerText = this.getAttribute("user");
    this.shadowRoot.querySelector("#msg").innerText = this.getAttribute("msg");
    this.shadowRoot.querySelector("#upvotes").innerText = this.getAttribute("upvotes");
  }

  static get observedAttributes() {
    return ["user", "msg", "upvotes"];
  }

  connectedCallback() {
    this.shadowRoot.querySelector("#upvotes").addEventListener("click", () => alert(this.getAttribute("upvotes")));
  }

  attributeChangedCallback(prop, oldVal, newVal) {
    if (prop === "user") this.shadowRoot.querySelector("#user").innerText = newVal;
    if (prop === "msg") this.shadowRoot.querySelector("#msg").innerText = newVal;
    if (prop === "upvotes") this.shadowRoot.querySelector("#upvotes").innerText = newVal;
  }

  disconnectedCallback() {
    this.shadowRoot.querySelector("#upvotes").removeEventListener("click");
  }
}

customElements.define("user-msg", UserMsg);
