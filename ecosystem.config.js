module.exports = {
  apps: [{
    name: 'inventory-backend',
    script: './server.js',
    instances: 'max', // Use all available CPU cores
    exec_mode: 'cluster',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Logging
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    
    // Process management
    autorestart: true,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    
    // Performance
    node_args: '--max-old-space-size=2048',
    
    // Watch options (disable in production)
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads', 'invoices'],
    
    // Error handling
    kill_timeout: 5000,
    listen_timeout: 3000,
    
    // Cron restart (optional - restart at 3 AM daily)
    // cron_restart: '0 3 * * *',
  }]
};

