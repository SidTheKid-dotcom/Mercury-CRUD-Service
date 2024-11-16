import { Router } from 'express';
import { createUser, getUserById } from '../controllers/userController'; // import your controller functions

const router: Router = Router();

// Example of user routes
router.post('/create', createUser); // POST /api/user
router.get('/:id', getUserById); // GET /api/user/:id

export default router;
