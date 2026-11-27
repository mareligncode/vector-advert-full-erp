import JobOrder from '../models/JobOrder.js';

/**
 * Validate customer feedback ratings
 */
export const validateFeedbackRatings = (req, res, next) => {
  const ratings = req.body.ratings;
  if (!ratings || ratings.overallSatisfactionScore === undefined) {
    return res.status(400).json({
      success: false,
      message: 'overallSatisfactionScore is required in ratings'
    });
  }

  const score = Number(ratings.overallSatisfactionScore);
  if (isNaN(score) || score < 1 || score > 5) {
    return res.status(400).json({
      success: false,
      message: 'overallSatisfactionScore must be a number between 1 and 5'
    });
  }

  if (req.body.npsScore !== undefined) {
    const nps = Number(req.body.npsScore);
    if (isNaN(nps) || nps < 0 || nps > 10) {
      return res.status(400).json({
        success: false,
        message: 'npsScore must be a number between 0 and 10'
      });
    }
  }

  next();
};

/**
 * Verify referenced JobOrder exists and has warranty registration
 */
export const verifyWarrantyJobExists = async (req, res, next) => {
  try {
    const jobOrderId = req.body.jobOrderId || req.params.jobOrderId;
    if (!jobOrderId) {
      return res.status(400).json({
        success: false,
        message: 'jobOrderId is required'
      });
    }

    const jobOrder = await JobOrder.findById(jobOrderId);
    if (!jobOrder) {
      return res.status(404).json({
        success: false,
        message: `JobOrder with ID ${jobOrderId} not found`
      });
    }

    req.jobOrder = jobOrder;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to verify warranty job order',
      error: error.message
    });
  }
};
