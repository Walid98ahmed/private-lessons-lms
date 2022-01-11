const { bucket } = require("../config/firebase");
const boom = require("@hapi/boom");

/**
 * @async
 * @description Get a v4 signed URL for uploading file
 * @param {String} folder - Folder name
 * @param {String} name - File name
 * @param {Number} expires - Expiration duration in milliseconds
 * @returns {Promise<String>} Signed URL
 */
module.exports.getSignedUrl = async (folder, name, expires) => {
  const [url] = await bucket.file(`${folder}/${name}`).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + (expires || 15 * 60 * 1000) /* 15 minutes */,
    contentType: "application/octet-stream"
  });

  return url;
};

/**
 * @async
 * @description Gets file meta data
 * @param {String} folder - Folder name
 * @param {String} name - File name
 * @returns {Promise<Array>} File meta data
 */
module.exports.getFileMetaData = async (folder, name) =>
  await bucket.file(`${folder}/${name}`).getMetadata();

/**
 * @async
 * @description Streams Video
 * @param {String} folder - Folder name
 * @param {String} name - File name
 * @param {Object} { start, end } - Range
 * @returns {Promise<any>} Stream
 */
module.exports.streamVideo = async (folder, name, { start, end }) =>
  await bucket.file(`${folder}/${name}`).createReadStream({ start, end });

/**
 * @async
 * @description Deletes file
 * @param {String} folder - Folder name
 * @param {String} name - File name
 * @returns {Promise<any>}
 */
module.exports.deleteFile = async (folder, name) =>
  await bucket.file(`${folder}/${name}`).delete();

/**
 * @class
 * @description Multer Google Cloud Storage uploader
 */
class GCStorage {
  constructor(opts) {
    /**
     * @description Multer options
     */
    if (!opts.destination) {
      throw new Error("destination is required");
    }

    this.getDestination = opts.destination;
  }

  _handleFile(req, file, cb) {
    this.getDestination(req, file, (err, { name, folder }) => {
      if (err) return cb(err);

      let totalSize = 0;
      file.stream
        .on("data", chunk => {
          totalSize += chunk.length;
          if (totalSize > 5 * 1024 * 1024)
            return cb(boom.entityTooLarge("File too large (Max: 5MB)"));
        })
        .pipe(bucket.file(`${folder}/${name}`).createWriteStream())
        .on("error", err => cb(boom.boomify(err)))
        .on("finish", cb);
    });
  }

  _removeFile(req, file, cb) {
    this.getDestination(req, file, async (err, { folder, name }) => {
      if (err) return cb(err);

      const res = await bucket.file(`${folder}/${name}`).delete();;
      cb(null, res);
    });
  }
}

/**
 * @description Create a GCStorage instance
 * @param {Object} opts - Options
 */
module.exports.createGCStorage = (opts = {}) => new GCStorage(opts);
