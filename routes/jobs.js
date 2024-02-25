const express = require("express");
const router = express.Router();

const {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyJob,
} = require("../controllers/jobs");

router.route("/").get(getAllJobs).post(createJob);
router.route("/:id").get(getJob).delete(deleteJob).patch(updateJob);
router.route("/apply").post(applyJob);

module.exports = router;
