const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    link: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
    },
    usersApplied: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      require: [true, "Please provide user"],
    },
  },
  { timestamps: true }
);

jobSchema.pre("save", function (next) {
  if (!this.link) {
    this.link = `http://localhost:8000/api/jobs/${this._id}`;
  }
  next();
});

module.exports = mongoose.model("Job", jobSchema);
