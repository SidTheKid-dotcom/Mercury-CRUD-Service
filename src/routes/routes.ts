import { Router } from 'express';
import userRoutes from './userRoutes'; // Import user-related routes
import queryRoutes from './queryRoutes'; // Import query-related routes
import folderRoutes from './uploadRoute';
import analyticsRoutes from './analyticsRoute';
import talkRoutes from './talkRoute';

const router: Router = Router();

// Route for user-related endpoints
router.use('/user', userRoutes);

// Route for query-related endpoints
router.use('/query', queryRoutes);

// Route for folder-upload endpoint
router.use('/upload', folderRoutes);

// Route for talking to files
router.use('/talk', talkRoutes)

// Route for analytics endpoint
router.use('/analytics', analyticsRoutes);

export default router;
