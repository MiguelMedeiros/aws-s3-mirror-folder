const AWS = require("aws-sdk");
const fs = require("fs");
const chokidar = require("chokidar");
const config = require("./config.json");

//configuring the AWS environment
AWS.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey,
  region: config.region,
});

let s3 = new AWS.S3();

let watcher = chokidar.watch(config.folder, {
  ignored: /^\./,
  persistent: true,
});
let scanComplete = false;
let scanReady = false;

if (process.argv.includes("--all")) {
  scanComplete = true;
}

watcher
  .on("ready", () => {
    scanReady = true;
    console.log("Watcher Ready!");
  })
  .on("add", function(path) {
    if (scanReady || scanComplete) {
      // console.log("File", path, "has been added");
      saveFile(path, scanComplete);
    }
  })
  .on("change", function(path) {
    if (scanReady) {
      // console.log("File", path, "has been changed");
      saveFile(path);
    }
  })
  .on("unlink", function(path) {
    if (scanReady) {
      // console.log("File", path, "has been removed");
      deleteFile(path);
    }
  })
  .on("error", function(error) {
    console.error("Error happened", error);
  });

async function saveFile(filePath, scanComplete = false) {
  let fileName = filePath.replace(config.folder, "");
  fileName = fileName.split("\\");
  fileName = fileName.join("/");
  console.log("Upload Started:", fileName);

  // Config Variables
  let getParams = {
    Bucket: config.bucketName, // your bucket name,
    Key: fileName, // path to the object you're looking for
  };

  let uploadParams = {
    Bucket: config.bucketName,
    Body: fs.createReadStream(filePath),
    Key: fileName,
  };

  if (scanComplete) {
    s3.getObject(getParams, function(err, data) {
      // Handle any error and exit
      if (err) return err;

      // No error happened
      // Convert Body from a Buffer to a String
      // let objectData = data.Body.toString("utf-8"); // Use the encoding necessary
      if (!data) {
        // console.log(data);

        return s3.upload(uploadParams, function(err, data) {
          // handle error
          if (err) {
            console.log("Error", err);
          }

          // success
          if (data) {
            console.log("Uploaded file:", data.Location);
          }
        });
      } else {
        console.log(fileName + " already uploaded!");
      }
    });
  } else {
    // configuring parameters
    var params = {
      Bucket: config.bucketName,
      Body: fs.createReadStream(filePath),
      Key: fileName,
    };

    return s3.upload(params, function(err, data) {
      // handle error
      if (err) {
        console.log("Error", err);
      }

      // success
      if (data) {
        console.log("Uploaded file:", data.Location);
      }
    });
  }
}

async function deleteFile(filePath) {
  let fileName = filePath.replace(config.folder, "");
  fileName = fileName.split("\\");
  fileName = fileName.join("/");

  // configuring parameters
  var params = {
    Bucket: config.bucketName,
    Key: fileName,
  };

  return await s3.deleteObject(params, function(err, data) {
    // handle error
    if (err) {
      console.log("Error", err);
    }

    // success
    if (data) {
      console.log("Deleted file:", fileName);
    }
  });
}
