const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { User, Post } = require("./db/db");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser")
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const app = express();
const PORT = 3001;
const salt = bcrypt.genSaltSync(10);
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(cookieParser());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  });
  
  app.use("/signin", limiter);
app.post("/signup", async (req, res) => {
  const { username, password, email, name } = req.body;

  try {
    const newUser = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
      email,
      name,
    });
    console.log(newUser);
    res.json(newUser);
  } catch (err) {
    res.status(400).json(err);
  }
});

app.post("/signin", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  const passOk = bcrypt.compareSync(password, user.password);
  if (passOk) {
    jwt.sign(
      { username, id: user._id },
      process.env.JWT_SECRET,
      {},
      (err, token) => {
        if (err) throw err;
        res.cookie("token", token).json({
            id:user._id,
            username
        });
      }
    );
  } else {
    res.status(401).json("Wrong Credentials");
  }
});


app.get("/posts", async (req, res) => {
   
  try{
    const posts = await Post.find()

    res.json(posts)
}
catch (err){
    console.log("Error getting posts", err)

    res.status(500).json({message: "Failed to fetch posts"})
}
});
app.post('/logout', (req, res) => {
    res.clearCookie('token').redirect('/signin');
  });
  

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
