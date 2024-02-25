const express = require("express");
const router = express.Router();

const { getAllUsers, getUser, deleteUser, updateUser, likeUser, unlikeUser } = require("../controllers/users");


router.get("/", getAllUsers);
router.route("/:id").get(getUser).delete(deleteUser).patch(updateUser);
router.post("/like", likeUser);
router.post("/unlike", unlikeUser);

module.exports = router;
