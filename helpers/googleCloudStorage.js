require('dotenv').config()
const { Storage } = require("@google-cloud/storage");


let projectId = "sewa-parkir";
const storage = new Storage({
  projectId,
  credentials: {
    private_key: process.env.GKEY_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GKEY_CLIENT_EMAIL
  }
});

const bucket = storage.bucket("sewa-parkir.appspot.com");

module.exports = bucket