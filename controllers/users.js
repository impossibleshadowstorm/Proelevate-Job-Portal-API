const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} = require("../errors");

// /route Controllers
const getAllUsers = async (req, res) => {
  if (req.user.role === "admin") {
    try {
      let sortCriteria = {};

      if (req.query.sort) {
        const sortFields = req.query.sort.split(",");

        sortFields.forEach((field) => {
          if (field.startsWith("-")) {
            sortCriteria[field.substr(1)] = -1;
          } else {
            sortCriteria[field] = 1;
          }
        });
      }

      const users = await User.aggregate([
        {
          $addFields: {
            points: { $size: "$likesUser" },
          },
        },
        { $sort: sortCriteria },
      ]);

      res.status(StatusCodes.OK).json({ users, count: users.length });
    } catch (error) {
      res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  } else {
    throw new UnauthenticatedError(
      "Your Role is not sufficient for this action.!"
    );
  }
};

// /:id route Controllers
const getUser = async (req, res) => {
  const {
    params: { id: userId },
  } = req;

  const user = await User.findById(userId);
  res.status(StatusCodes.OK).json({ user });
};

const updateUser = async (req, res) => {
  const {
    body: { name, email, password, github, role },
    params: { id: userIdToUpdate },
  } = req;

  if (!name && !email && !password && !github && !role) {
    throw new BadRequestError("At least one field must be provided to update");
  }

  try {
    let userToUpdate = await User.findById(userIdToUpdate);

    if (!userToUpdate) {
      throw new NotFoundError(`User with id ${userIdToUpdate} not found`);
    }

    if (name) userToUpdate.name = name;
    if (email) userToUpdate.email = email;
    if (password) userToUpdate.password = password;
    if (github) userToUpdate.github = github;
    if (role) userToUpdate.role = role;

    const updatedUser = await userToUpdate.save();

    res.status(StatusCodes.OK).json({ user: updatedUser });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  const {
    user: { role },
    params: { id: userId },
  } = req;

  if (role !== "admin") {
    throw new UnauthenticatedError(
      "Your Role is not sufficient for this action."
    );
  }

  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new NotFoundError(`No user with id ${userId}`);
    }

    res
      .status(StatusCodes.OK)
      .json({ user, msg: "User was deleted successfully" });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

// /like route controller
const likeUser = async (req, res) => {
  try {
    const {
      user: { userId },
      body: { id: likeUserId },
    } = req;

    // Check if the liker user exists
    const likerUser = await User.findById(userId);
    if (!likerUser) {
      return res.status(404).json({ message: "Liker user not found" });
    }

    // Check if the user to be liked exists
    const likedUser = await User.findById(likeUserId);
    if (!likedUser) {
      return res.status(404).json({ message: "Liked user not found" });
    }

    // Check if the liker user has already liked the liked user
    if (likerUser.likesUser.includes(likeUserId)) {
      return res.status(400).json({ message: "User already liked" });
    }

    // Add the liked user to the liker user's likesUser array
    likerUser.likesUser.push(likeUserId);

    // Save the changes
    await likerUser.save();

    res.status(200).json({ message: "User liked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// /unlike route controller
const unlikeUser = async (req, res) => {
  try {
    const {
      user: { userId },
      body: { id: likeUserId },
    } = req;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the liked user exists
    const likedUser = await User.findById(likeUserId);
    if (!likedUser) {
      return res.status(404).json({ message: "Liked user not found" });
    }

    // Check if the user has already liked the liked user
    if (!user.likesUser.includes(likeUserId)) {
      return res.status(400).json({ message: "User has not liked this user" });
    }

    // Remove the liked user from the user's likesUser array
    user.likesUser = user.likesUser.filter(
      (id) => id.toString() !== likeUserId
    );

    // Save the changes
    await user.save();

    res.status(200).json({ message: "User unliked successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUser,
  deleteUser,
  updateUser,
  likeUser,
  unlikeUser,
};
