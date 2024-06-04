const jwt = require('jsonwebtoken')
require('dotenv').config();

const verifyToken = async (req, res, next) => {
  const header = req.header("Authorization") || "";
  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provied" });
  }
  try {
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    req.id_user = payload.id_user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token not valid" });
  }
}


module.exports = { verifyToken }