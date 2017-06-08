const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

function generateRandomString() {
  const POSSIBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const SIZE = 6;
  const result = [];
  for (let i = 0; i < SIZE; i++) {
    result.push(POSSIBLE.charAt(Math.floor(Math.random() * POSSIBLE.length)));
  }
  return result.join('');
}

app.get("/login", (req, res) => {
  if (users[req.cookies.user_id]) {
    res.redirect("/urls");
  } else {
    res.render("login", {user: users[req.cookies.user_id]});
  }
});

app.post("/login", (req, res) => {
  let user;
  for (const id in users) {
    const u = users[id];
    if (u.email === req.body.email && u.password === req.body.password) {
      user = u;
      break;
    }
  }
  if (user) {
    res.cookie("user_id", user.id);
    res.redirect("/urls");
  } else {
    res.status(403).send("wrong email or password");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("register", {user: users[req.cookies.user_id]});
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send("email or password can't be blank");
    return;
  }
  const id = generateRandomString();
  users[id] = { id, email, password };
  
  res.cookie("user_id", id);

  res.redirect("/urls");

});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", {user: users[req.cookies.user_id]});
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase,
    user: users[req.cookies.user_id]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  let key = generateRandomString();
  urlDatabase[key] = req.body.longURL;
  res.redirect(`urls/${key}`);         // Respond with 'Ok' (we will replace this)
});


app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const templateVars = { 
    shortURL: id,
    longURL: urlDatabase[id],
    user: users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.url;
  res.redirect(`/urls/${req.params.id}`);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.send("Not found"); 
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
