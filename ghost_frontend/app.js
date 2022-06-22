const data = [
  { id: "22jqnwken2", user: "shane", msg: "First message from me", upvotes: 0, reply: [] },
  { id: "dasdwqe233", user: "tom", msg: "First message from tom!", upvotes: 2, reply: [] },
];

const commentsEl = document.getElementById("comments");
window.onload = (event) => {
  data.forEach((obj) => {
    const usermsg = document.createElement("user-msg");
    usermsg.setAttribute("user", obj.user);
    usermsg.setAttribute("msg", obj.msg);
    usermsg.setAttribute("upvotes", obj.upvotes);
    commentsEl.append(usermsg);
  });
};
