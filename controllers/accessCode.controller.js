const { accessCodeService, actionService } = require("../services");
const { boom } = require("@hapi/boom");

/**
 * @async
 * @description Generate access codes for a grade
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
module.exports.generateAccessCodes = async (req, res, next) => {
  const codes = await accessCodeService.generateAccessCodes(
    req.params.gradeId,
    req.query.count
  );

  if (!codes) return next(boom.notFound("Grade not found"));

  await actionService.recordAction(
    req.user._id,
    req.params.gradeId,
    req.query.count
  );

  res.send(codes);
};