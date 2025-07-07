module.exports = {
  apps: [
    {
      name: 'shark-api',
      script: 'dist/server/node-build.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'income-scheduler',
      script: 'server/scripts/schedule_income.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      cron_restart: '0 4 * * *', // Restart at 4 AM daily to ensure scheduler is running
      log_file: 'logs/income-scheduler.log',
      error_file: 'logs/income-scheduler-error.log',
      out_file: 'logs/income-scheduler-out.log'
    }
  ]
};
