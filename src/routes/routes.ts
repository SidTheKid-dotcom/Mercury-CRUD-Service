import { Router } from 'express';
import userRoutes from './userRoutes'; // Import user-related routes
import queryRoutes from './queryRoutes'; // Import query-related routes
import folderRoutes from './folderRoute';

const router: Router = Router();

// Route for user-related endpoints
router.use('/user', userRoutes);

// Route for query-related endpoints
router.use('/query', queryRoutes);

// Route for folder-upload endpoint
router.use('/upload', folderRoutes);

export default router;
