"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController"); // import your controller functions
const router = (0, express_1.Router)();
// Example of user routes
router.post('/create', userController_1.createUser); // POST /api/user
router.get('/:id', userController_1.getUserById); // GET /api/user/:id
exports.default = router;
