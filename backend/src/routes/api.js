const express = require('express');
const router = express.Router();
const perplexityService = require('../services/perplexityService');

router.post('/research', async (req, res, next) => {
  try {
    const { text, sourceUrl } = req.body;
    const result = await perplexityService.researchTopic(text, sourceUrl);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router; 