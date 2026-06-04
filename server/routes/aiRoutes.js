import express from 'express';
import { queryAICopilot } from '../controllers/aiController.js';

const router = express.Router();

router.post('/query', queryAICopilot);

export default router;
