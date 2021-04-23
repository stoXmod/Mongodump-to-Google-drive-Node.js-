const CronJob = require('cron').CronJob;
const Cron = require('./backup.js');


// AutoBackUp every week (at 00:00 on Sunday)
new CronJob(
  '0 0 * * *', //Replace with your cron time. this will be execute everyday 00.00 [set * * * * * to every minutes for testing purposes]
  function() {
    Cron.dbAutoBackUp();
    console.log('backupping...')
  },
  null,
  true,
  'Asia/Colombo' //Change your timezone
);