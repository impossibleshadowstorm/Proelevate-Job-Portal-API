const Job = require("../models/job");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} = require("../errors");

// /route Controllers
const getAllJobs = async (req, res) => {
  const jobs = await Job.find({}).sort("createdAt");
  res.status(StatusCodes.OK).json({ jobs, count: jobs.length });
};

const createJob = async (req, res) => {
  const {
    user: { role },
  } = req;

  if (role === "admin") {
    req.body.createdBy = req.user.userId;
    const job = await Job.create(req.body);
    res.status(StatusCodes.CREATED).json({ job });
  } else {
    throw new UnauthenticatedError(
      "Your Role is not sufficient for this action.!"
    );
  }
};

// /:id route Controllers
const getJob = async (req, res) => {
  const {
    params: { id: jobId },
  } = req;

  const job = await Job.findOne({
    _id: jobId,
  });
  if (!job) {
    throw new NotFoundError(`No job with id ${jobId}`);
  }
  res.status(StatusCodes.OK).json({ job });
};

const updateJob = async (req, res) => {
  const {
    user: { userId, role },
    params: { id: jobId },
    body: { date, link, title }, // Destructure fields from request body
  } = req;

  // Check if any required data is empty
  if (!date && !link && !title) {
    throw new BadRequestError("At least one field must be provided to update");
  }

  try {
    let jobToUpdate = await Job.findById(jobId);

    if (!jobToUpdate) {
      throw new NotFoundError(`No job with id ${jobId}`);
    }

    if (role !== "admin" && String(jobToUpdate.createdBy) !== userId) {
      throw new UnauthenticatedError(
        "Your Role is not sufficient for this action."
      );
    }

    if (date) jobToUpdate.date = date;
    if (link) jobToUpdate.link = link;
    if (title) jobToUpdate.title = title;

    const updatedJob = await jobToUpdate.save();

    res.status(StatusCodes.OK).json({ job: updatedJob });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const deleteJob = async (req, res) => {
  const {
    user: { role, userId },
    params: { id: jobId },
  } = req;

  try {
    const job = await Job.findByIdAndDelete(jobId);

    if (!job) {
      throw new NotFoundError(`No job with id ${jobId}`);
    }

    if (role !== "admin" && String(job.createdBy) !== userId) {
      throw new UnauthenticatedError(
        "Your Role is not sufficient for this action."
      );
    }

    res
      .status(StatusCodes.OK)
      .json({ job: [], msg: "Job was deleted Successfully" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const applyJob = async (req, res) => {
  const {
    user: { userId },
    body: { id: jobId },
  } = req;

  try {
    const job = await Job.findOne({ _id: jobId });
    if (!job) {
      throw new NotFoundError(`No job with id ${jobId}`);
    }

    // Check if the user has already applied for this job
    if (job.usersApplied.includes(userId)) {
      return res
        .status(400)
        .json({ message: "User has already applied for this job" });
    }

    // Add the userId to the list of usersApplied
    job.usersApplied.push(userId);

    // Save the job with the updated list of usersApplied
    await job.save();

    res.status(200).json({ message: "User applied for the job successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyJob,
};
