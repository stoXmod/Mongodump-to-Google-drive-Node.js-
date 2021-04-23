const fs = require("fs");
const _ = require("lodash");
const exec = require("child_process").exec;
const path = require("path");
const zipFolder = require("zip-folder");
const { google } = require("googleapis");

const CLIENT_ID =
  "CLIENT ID";
const CLIENT_SECRET = "CLIENT SECRET";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";

const REFRESH_TOKEN =
  "REFRESH TOKEN";

const oauth2client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: "v3",
  auth: oauth2client,
});

// Concatenate root directory path with our backup folder.
const backupDirPath = path.join(__dirname, "../database-backup/");

const dbOptions = {
  user: process.env.DB_USER, //Database Username
  pass: process.env.DB_PASS, //Database Password
  host: "localhost",  //Host
  auth: "admin", //Auth database
  port: 27017,  //Port
  database: "DATABASE_NAME", //Database Name
  autoBackup: true,
  removeOldBackup: true,
  keepLastDaysBackup: 2,
  autoBackupPath: backupDirPath,
};

// return stringDate as a date object.
exports.stringToDate = (dateString) => {
  return new Date(dateString);
};

// Check if variable is empty or not.
exports.empty = (mixedVar) => {
  let undef, key, i, len;
  const emptyValues = [undef, null, false, 0, "", "0"];
  for (i = 0, len = emptyValues.length; i < len; i++) {
    if (mixedVar === emptyValues[i]) {
      return true;
    }
  }
  if (typeof mixedVar === "object") {
    for (key in mixedVar) {
      return false;
    }
    return true;
  }
  return false;
};

// Auto backup function
exports.dbAutoBackUp = () => {
  // check for auto backup is enabled or disabled
  if (dbOptions.autoBackup == true) {
    let date = new Date();
    let beforeDate, oldBackupDir, oldBackupPath;

    // Current date
    currentDate = this.stringToDate(date);
    let newBackupDir =
      currentDate.getFullYear() +
      "-" +
      (currentDate.getMonth() + 1) +
      "-" +
      currentDate.getDate();

    // New backup path for current backup process
    let newBackupPath =
      dbOptions.autoBackupPath + "uscodbackup-" + newBackupDir;
    // check for remove old backup after keeping # of days given in configuration
    if (dbOptions.removeOldBackup == true) {
      beforeDate = _.clone(currentDate);
      // Substract number of days to keep backup and remove old backup
      beforeDate.setDate(beforeDate.getDate() - dbOptions.keepLastDaysBackup);
      oldBackupDir =
        beforeDate.getFullYear() +
        "-" +
        (beforeDate.getMonth() + 1) +
        "-" +
        beforeDate.getDate();
      // old backup(after keeping # of days)
      oldBackupPath = dbOptions.autoBackupPath + "uscodbackup-" + oldBackupDir;
    }

    // Command for mongodb dump process
    let cmd =
      "mongodump --host " +
      dbOptions.host +
      " --port " +
      dbOptions.port +
      " --db " +
      dbOptions.database +
      " --username " +
      dbOptions.user +
      " --password " +
      dbOptions.pass +
      " --authenticationDatabase " +
      dbOptions.auth +
      " --out " +
      newBackupPath;

    exec(cmd, (error, stdout, stderr) => {
      if (this.empty(error)) {
        console.log("DB backup generated ... ");

        //zip backup
        zipFolder(
          __dirname + "/../database-backup/" + "uscodbackup-" + newBackupDir, //source
          __dirname +
            "/../database-backup/" +
            "uscodbackup-" +
            newBackupDir +
            ".zip", //destination
          function (err) {
            if (err) {
              console.log("Zip error ... ");
              console.log("Backup error!", err);
            } else {
              console.log("Backup zipped successful");
              exec(
                "rm -rf " +
                  __dirname +
                  "/../database-backup/" +
                  "uscodbackup-" +
                  newBackupDir,
                (err) => {}
              );

              //Upload to gdrive
              const filePath = __dirname +
              "/../database-backup/" +
              "uscodbackup-" +
              newBackupDir +
              ".zip";

              async function uploadFile() {
                try {
                  const response = await drive.files.create({
                    requestBody: {
                      name: "uscodbackup-" +
                      newBackupDir +
                      ".zip",
                      mimeType: "application/zip",
                    },
                    media: {
                      mimeType: "application/zip",
                      body: fs.createReadStream(filePath),
                    },
                  });
                  console.log('Success : Backup success to Gdrive...');
                  exec(
                    "rm -rf " +
                      __dirname +
                      "/../database-backup/" +
                      "uscodbackup-" +
                      newBackupDir +
                      ".zip",
                    (err) => {}
                  );
                } catch (error) {
                  console.log(error.message);
                }
              }
              uploadFile();
            }
          }
        );
        // check for remove old backup after keeping # of days given in configuration.
        if (dbOptions.removeOldBackup == true) {
          if (fs.existsSync(oldBackupPath)) {
            exec("rm -rf " + oldBackupPath, (err) => {});
          }
        }
      }
      if (error) {
        console.log("Backup Fail " + error);
      }
    });
  }
};
