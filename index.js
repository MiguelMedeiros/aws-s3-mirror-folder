const AWS = require("aws-sdk");
const fs = require("fs");
const chokidar = require("chokidar");
const config = require("./config.json");
const log4js = require('log4js');

// logs
log4js.configure({
  appenders: { cheese: { type: 'file', filename: 'cheese.log' } },
  categories: { default: { appenders: ['cheese'], level: 'error' } }
});
let logger = log4js.getLogger();
logger.level = 'debug';

// AWS
AWS.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.region,
});

let s3 = new AWS.S3();
let scanComplete = false;
let scanReady = false;

if (process.argv.includes("--all")) {
  scanComplete = true;
}

// watcher
logger.info('Starting Watcher.');
let watcher = chokidar.watch(config.folder, {
  ignored: /^\./,
  persistent: true,
  alwaysStat: false,
  awaitWriteFinish: {
    stabilityThreshold: 2000,
    pollInterval: 1000
  },
  usePolling: true,
  interval: 1000,
  binaryInterval: 3000,
});
watcher
  .on("ready", () => {
    scanReady = true;
    scanComplete = false;
    logger.info('Watcher Ready!');
  })
  .on("add", async function(path) {
    if(scanComplete){
      let fileExists = await getFile(path);
      if(!fileExists){
        await saveFile(path);
      }
    }else{
      if(scanReady){
        await saveFile(path);
      }
    }
  })
  .on("change", async function(path) {
    if (scanReady) {
      await saveFile(path);
    }
  })
  .on("unlink", async function(path) {
    if (scanReady) {
      await deleteFile(path);
    }
  })
  .on("error", function(error) {
    logger.error(error);
  });

let saveFile = async (filePath) => {
  try {
    let fileName = getFileName(filePath);
    var params = {
      Bucket: config.bucketName,
      Body: fs.createReadStream(filePath),
      Key: fileName,
    };

    return await s3.upload(params, function(err, data) {
      return handleError("UPLOAD", err, data, fileName);
    });
  } catch (error) {
    // logger.error(error);
    // console.log(error);
  }
};

let getFile = async (filePath) => {
  try {
    let fileName = getFileName(filePath);
    let params = {
      Bucket: config.bucketName,
      Key: fileName,
    };

    const fileExists = await s3.getObject(params, function(err, data) {
      return handleError("GET", err, data, fileName);
    }).promise();

    if(typeof fileExists.Body !== 'undefined'){
      return true;
    }else{
      return false;
    }
  } catch (error) {
    // logger.error(error);
    // console.log(error);
  }
};

let deleteFile = async (filePath) => {
  try {
    let fileName = getFileName(filePath);
    var params = {
      Bucket: config.bucketName,
      Key: fileName,
    };

    return await s3.deleteObject(params, function(err, data) {
      return handleError("DELETE", err, data, fileName);
    });
  } catch (error) {
    // logger.error(error);
    // console.log(error);
  }
};

let getFileName = (filePath) => {
  return filePath.replace(config.folder, "").split("\\").join("/");
};

let handleError = (type, err, data, fileName) => {
  // handle error
  if(type !== 'GET'){
    if (err) {
      logger.error(fileName, err);
      return false;
    }
  }

  // success
  if (data) {
    logger.info(type + ":", fileName);
    return true;
  }else{
    logger.warn(type + " failed:", fileName);
    return false;
  }
};