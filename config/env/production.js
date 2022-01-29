const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOSTNAME,
  MONGO_CONTAINER_PORT,
  MONGO_DATABASE,
  REDIS_HOSTNAME,
  REDIS_CONTAINER_PORT,
  LOG_LEVEL,
  PROTOCOL,
  SMARTHUB_UI_ORIGIN,
} = process.env;

module.exports = {
  datastores: {
    default: {
      adapter: 'sails-mongo',
      url: `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_CONTAINER_PORT}/${MONGO_DATABASE}`
    }
  },

  models: {
    migrate: 'safe',
  },

  blueprints: {
    shortcuts: false,
  },

  security: {
    cors: {
      allRoutes: true,
      allowOrigins: '*',
      allowCredentials: true,
      allowAnyOriginWithCredentialsUnsafe: true
    }
  },

  session: {
    secret: 'fcea8be379be2dc12d47a5a40a0f7a98',
    adapter: '@sailshq/connect-redis',
    url: `redis://${REDIS_HOSTNAME}:${REDIS_CONTAINER_PORT}/0`,
    cookie: {
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,  // 24 hours
    }
  },

  sockets: {
    onlyAllowOrigins: [
      "http://localhost:1337"
    ],
    adapter: '@sailshq/socket.io-redis',
    url: `redis://${REDIS_HOSTNAME}:${REDIS_CONTAINER_PORT}/0`,
    grant3rdPartyCookie: true,
  },

  log: {
    level: LOG_LEVEL || 'info'
  },

  http: {
    cache: 365.25 * 24 * 60 * 60 * 1000, // One year
    trustProxy: true,
  }
};
