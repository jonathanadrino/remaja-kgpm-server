"use strict";
const { verify } = require("jsonwebtoken");
const { User } = require("../models");

const authentication = async function (req, res, next) {
  try {
    const { access_token } = req.headers;

    console.log(req.headers);

    console.log(access_token, 'token nih');

    console.log(process.env.JWT_KEY, 'dari auth');
    const payloadData = verify(access_token, process.env.JWT_KEY);
    console.log(payloadData);

    const user = await User.findByPk(payloadData);

    if (!user) {
      throw { name: "invalidToken" };
    } else {
      console.log('masuk');
    }
    req.user = {
      id: user.id,
      username: user.username
    };

    console.log(req.user);
    next();
  } catch (err) {
   console.log(err);
  }
};

module.exports = authentication;
