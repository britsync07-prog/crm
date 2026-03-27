module.exports = {
  apps: [
    {
      name: "crm-app-prod",
      cwd: "/var/www/crm",
      script: "server.js",
      interpreter: "node",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: "3001",
        DATABASE_URL: "file:./prisma/dev.db",
        EXTERNAL_API_BASE_URL: "http://localhost:3000",
        EXTERNAL_API_KEY: "your-secure-api-key",
        NEXT_PUBLIC_EXTERNAL_API_BASE_URL: "http://localhost:3000",
        NEXT_PUBLIC_EXTERNAL_API_KEY: "your-secure-api-key",
        LIVEKIT_API_KEY: "devkey",
        LIVEKIT_API_SECRET: "secret",
        LIVEKIT_HOST: "https://meet.truecrm.online",
        NEXT_PUBLIC_LIVEKIT_URL: "wss://meet.truecrm.online",
        APP_URL: "https://truecrm.online",
        NEXT_PUBLIC_APP_URL: "https://truecrm.online",
        NEXTAUTH_URL: "https://truecrm.online"
      }
    }
  ]
};
