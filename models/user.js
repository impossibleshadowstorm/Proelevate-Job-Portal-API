const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      "Please provide a valid email",
    ],
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  likesUser: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  github: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
});

userSchema.virtual("points").get(function () {
  return this.likesUser.length;
});

userSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);

    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.createJWT = function () {
  const secret_key = process.env.JWT_SECRET;
  if (secret_key) {
    return jwt.sign(
      { userId: this._id, email: this.email, role: this.role },
      process.env.JWT_SECRET,
      {
        // expiresIn: "30s",
        expiresIn: process.env.JWT_LIFETIME,
      }
    );
  } else {
    console.log(secret_key);
  }
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
