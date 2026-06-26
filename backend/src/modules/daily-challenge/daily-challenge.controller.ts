// src/modules/daily-challenge/daily-challenge.controller.ts
import { getTodayChallenge } from './daily-challenge.service.js';
import { ApiResponse } from '../../shared/response.js';
import { withAuth } from '../../shared/controllerUtils.js';

export const handleGetTodayChallenge = withAuth('[daily-challenge]', 'get today challenge', async (userId, _req, res) => {
  const data = await getTodayChallenge(userId);
  ApiResponse.success(res, data);
});
