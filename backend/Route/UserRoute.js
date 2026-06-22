const express = require("express");
const router = express.Router();
const User = require("../Model/UserModel");
const UserController = require("../Controller/UserController");

router.get("/",UserController.getAllUsers);
router.post("/",UserController.addUser);
router.get("/:id",UserController.getById);
router.put("/:id",UserController.updateUser);
router.delete("/:id",UserController.deleteUser);

module.exports = router;

