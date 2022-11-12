require("dotenv").config({ path: "./.env" });
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const { User, Post, Media } = require("./models");
const jwt = require("jsonwebtoken");
const authentication = require("./middlewares/authentication");
const bucket = require("./helpers/googleCloudStorage");
const multer = require("./middlewares/multer");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Server is running",
  });
});

app.get("/user", async (req, res) => {
  try {
    const data = await User.findAll();

    res.status(200).json({
      data,
    });
  } catch (err) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/user", async (req, res) => {
  const { username, password } = req.body;
  try {
    await User.create({
      username,
      password,
    });

    res.status(201).json({
      message: "User created",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/login", async (req, res) => {
  console.log(req.body);
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw { message: "empty field" };
    }

    const user = await User.findOne({
      where: {
        username: username,
      },
    });

    if (!user || user.password !== password) {
      throw { message: "wrong credential" };
    } else {
      const token = jwt.sign(user.id, process.env.JWT_KEY);
      res.status(200).json({
        access_token: token,
      });
    }
  } catch (err) {
    console.log(err);
    if (err.message === "empty field") {
      res.status(400).json({
        message: "Empty username/password",
      });
    } else if (err.message === "wrong credential") {
      res.status(401).json({
        message: "Wrong username/password",
      });
    } else {
      res.status(500).json({
        message: "Internal Server Error",
      });
    }
  }
});

app.get("/post", async (req, res) => {
  try {
    const result = await Post.findAll({
      order: [["id", "DESC"]],
    });

    // console.log(result);
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.get("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const result = await Post.findByPk(id);

    console.log(result);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

app.get("/media", async (req, res) => {
  try {
    const data = await Media.findAll();
    res.status(200).json({
      data,
    });
  } catch (err) {
    console.log(err);
  }
});

app.use(authentication);

app.post("/post", multer.single("image"), async (req, res) => {
  try {
    if (req.file) {
      const blob = bucket.file(req.file.originalname);

      const blobStream = blob.createWriteStream();

      const prefix = "post-websiteremaja";
      const name = req.body.title;
      blobStream.on("finish", async () => {
        await bucket
          .file(req.file.originalname)
          .rename(`${prefix}-${name.replace(" ", "-")}-1`);
        console.log("success");
      });
      blobStream.end(req.file.buffer);

      await Post.create({
        title: req.body.title,
        highlight: req.body.highlight,
        body: req.body.body,
        addedBy: req.user.username,
        imgUrl: `https://storage.googleapis.com/sewa-parkir.appspot.com/${prefix}-${name.replace(
          " ",
          "-"
        )}-1`,
        version: 1,
      });

      res.status(201).json({
        message: `${req.body.title} created`,
        imgUrl: `https://storage.googleapis.com/sewa-parkir.appspot.com/${prefix}-${name.replace(
          " ",
          "-"
        )}-1`,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "error post",
    });
  }
});

app.put("/post/:id", multer.single("image"), async (req, res) => {
  try {
    console.log(req.body);
    const { id } = req.params;
    const { title, highlight, body } = req.body;
    const user = req.user.username;
    const prefix = "post-websiteremaja";
    if (!req.file) {
      const data = await Post.findByPk(id);
      const version = data.version;
      await bucket
        .file(`${prefix}-${data.title.replace(" ", "-")}-${version}`)
        .rename(`${prefix}-${title.replace(" ", "-")}-${version}`);

      await Post.update(
        {
          title: title,
          highlight: highlight,
          body: body,
          modifiedBy: user,
          imgUrl: `https://storage.googleapis.com/sewa-parkir.appspot.com/${prefix}-${req.body.title.replace(
            " ",
            "-"
          )}-${Number(version)}`,
        },
        { where: { id: id } }
      );

      res.status(200).json({
        message: "Post updated",
      });
    } else {
      const data = await Post.findByPk(id);
      const version = data.version;
      const prefix = "post-websiteremaja";
      await bucket
        .file(`${prefix}-${data.title.replace(" ", "-")}-${version}`)
        .delete();

      const blob = bucket.file(req.file.originalname);

      const blobStream = blob.createWriteStream();

      const name = req.body.title;
      blobStream.on("finish", async () => {
        await bucket
          .file(req.file.originalname)
          .rename(`${prefix}-${name.replace(" ", "-")}-${Number(version) + 1}`);
        console.log("success");
      });
      blobStream.end(req.file.buffer);

      await Post.update(
        {
          title: req.body.title,
          highlight: req.body.highlight,
          body: req.body.body,
          modifiedBy: user,
          imgUrl: `https://storage.googleapis.com/sewa-parkir.appspot.com/${prefix}-${name.replace(
            " ",
            "-"
          )}-${Number(version) + 1}`,
          version: version + 1,
        },
        { where: { id: id } }
      );

      res.status(201).json({
        message: `Post updated`,
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.delete("/post/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Post.findByPk(id);
    const version = data.version;
    const prefix = "post-websiteremaja";
    await bucket
      .file(`${prefix}-${data.title.replace(" ", "-")}-${version}`)
      .delete();

    await Post.destroy({ where: { id } });

    const newData = await Post.findAll();

    res.status(200).json({
      message: "Post deleted",
      newData,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.post("/media", async (req, res) => {
  try {
    const { url, title } = req.body;

    let id = "";

    let count = 0;
    for (let i = 0; i < url.length; i++) {
      if (url[i] == "&") {
        break;
      }
      if (count > 0) {
        id += url[i];
      }
      if (url[i] == "=" && url[i - 1] == "v") {
        count = 1;
      }
    }

    console.log(id);
    await Media.create({
      link: url,
      title,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    });

    res.status(200).json({
      message: "Media created",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.delete("/media/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await Media.destroy({
      where: {
        id,
      },
    });

    const data = await Media.findAll()
    res.status(200).json({
      data
    })
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'ISE'
    })
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
