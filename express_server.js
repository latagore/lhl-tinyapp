const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  secret: "uhaeontuhntoidgp,rabiurobkdirpaeueohdp,rudiroedue",
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set("view engine", "ejs");
app.use(express.static('site'));

const urlDatabase = {};
const users = {};


// ============
// utilities
// ============
function generateRandomString() {
  const POSSIBLE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const SIZE = 6;
  const result = [];
  for (let i = 0; i < SIZE; i++) {
    result.push(POSSIBLE.charAt(Math.floor(Math.random() * POSSIBLE.length)));
  }
  return result.join('');
}

function urlsForUser(user_id) {
  const result = {};
  let hasResults = false;
  for (let key in urlDatabase) {
    const urlEntry = urlDatabase[key];
    if (urlEntry.ownerId === user_id) {
      result[key] = urlEntry;
      hasResults = true;
    }
  }
  return hasResults ? result : undefined;
}

// ============================
// user login management routes
// ============================
app.get("/login", (req, res) => {
  if (users[req.session.user_id]) {
    res.redirect("/urls");
  } else {
    res.render("login", {user: users[req.session.user_id]});
  }
});

app.get("/register", (req, res) => {
  res.render("register", {user: users[req.session.user_id]});
});

// ==================
// login API routes
// ==================
app.post("/login", (req, res) => {
  let user;
  // find the given user
  for (const id in users) {
    const u = users[id];
    if (u.email === req.body.email &&
        bcrypt.compareSync(req.body.password, u.hash)) {
      user = u;
      break;
    }
  }
  
  if (user) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("wrong email or password");
  }
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email === "" || password === "") {
    res.status(400).send("email or password can't be blank");
    return;
  }
  const id = generateRandomString();
  const hash = bcrypt.hashSync(password, 10);
  users[id] = { id, email, hash };
  
  req.session.user_id = id;

  res.redirect("/urls");

});

app.get("/logout", logoutRoute);
app.post("/logout", logoutRoute);
function logoutRoute(req, res) {
  req.session = null;
  res.redirect("/urls");
}

// ====================
// URL page routes
// ====================

// Create new URL page route
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    res.render("urls_new", {user: users[req.session.user_id]});
  } else {
    res.redirect("/login");
  }
});

// main page route
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Show URLs route
app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

// View/edit URL page route
app.get("/urls/:id", (req, res, next) => {
  const urlEntry = urlDatabase[req.params.id];
  
  if (urlEntry && req.session.user_id === urlEntry.ownerId) {
    const id = req.params.id;
    const templateVars = { 
      shortURL: id,
      longURL: urlEntry.link,
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  } else if (urlEntry) {
    res.status(403).send("Not authorized");
  } else {
    res.status(404).send("Not found");
  }
});

// ================
// URL API routes
// ================

// Create new URL API route
app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    let key = generateRandomString();
    urlDatabase[key] = {
      ownerId: req.session.user_id,
      link: req.body.longURL
    };
    res.redirect(`urls/${key}`);         // Respond with 'Ok' (we will replace this)
  } else {
    res.status(403).send("not authorized to create a url");
  }
});

// Delete URL API route
app.post("/urls/:id/delete", (req, res) => {
  const urlEntry = urlDatabase[req.params.id];
  if (req.session.user_id === urlEntry.ownerId) {
    delete urlDatabase[req.params.id];
    res.redirect('/urls');
  } else {
    res.status(403).send("not authorized to delete this url");
  }
});

// Update URL API route
app.post("/urls/:id/update", (req, res) => {
  const urlEntry = urlDatabase[req.params.id];
  if (req.session.user_id === urlEntry.ownerId) {
    urlDatabase[req.params.id].link = req.body.url;
    res.redirect(`/urls/${req.params.id}`);
  } else {
    res.status(403).send("not authorized to edit this url");
  }
});


// ============================
// URL shorten/redirect route
// ============================
app.get("/u/:shortURL", (req, res, next) => {
  let urlEntry = urlDatabase[req.params.shortURL];
  if (urlEntry) {
    res.redirect(urlEntry.link);
  } else {
    res.status(404).send("Not found");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
