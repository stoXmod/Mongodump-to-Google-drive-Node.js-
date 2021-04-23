# Mongodump to Google drive as a (zip Express)

- Clone or download as a zip
- Open folder with Vscode or something like 
- Open terminal
- Run `npm i`
- Edit .env file with your credentials
- Open config/cron.js and set cron value to * * * * * for development purposes. Its mean cronjob execute every minute.
Use ([CronGuru](https://crontab.guru/)) for calculate cron.
- Open config/backup.js file and change CLIENT_ID,CLIENT_SECRET,REDIRECT_URI,REFRESH_TOKEN and dboption object data.
- Run on terminal `npm start`

