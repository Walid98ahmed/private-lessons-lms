const { studentService, storageService } = require("../services");
const boom = require("@hapi/boom");
const multer = require("multer");
const { constants } = require("../config/constants");

module.exports.updateProfileImage = multer({
  storage: storageService.createGCStorage({
    destination: (req, file, cb) => {
      cb(null, { name: req.user.id, folder: "students" });
    },
    fileType: "image"
  }),
  limits: { fileSize: constants.MAX_FILE_SIZE }
});

/**
 * @async
 * @description get student profile
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Function} next - Express next middleware
 */
module.exports.getProfile = async (req, res, next) => {
  const profile = await studentService.getProfile(req.user.id);

  if (!profile) {
    return next(boom.notFound("Profile not found"));
  }

  res.send(profile);
};

/**
 * @async
 * @description get all students
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Function} next - Express next middleware
 */
module.exports.getStudents = async (req, res, next) => {
  const students = await studentService.getStudents(req.query);

  res.send(students);
};

/**
 * @async
 * @description get a student
 * @param  {Object} req - Express request object
 * @param  {Object} res - Express response object
 * @param  {Function} next - Express next middleware
 */
module.exports.getStudent = async (req, res, next) => {
  const student = await studentService.getProfile(req.params.id);

  if (!student) {
    return next(boom.notFound("Student not found"));
  }

  res.send(student);
};
