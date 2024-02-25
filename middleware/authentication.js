const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { UnauthenticatedError } = require("../errors");

const auth = (req, res, next) => {
  //check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Invalid Authentication or Missing Bearer");
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    //attach the user to the job routes
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    console.log(req.user);
    next();
  } catch (error) {
    throw new UnauthenticatedError("Invalid Authentication Token..!");
  }
};

module.exports = auth;
