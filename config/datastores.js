module.exports.datastores = {
  default: {
    adapter: 'sails-mongo',
    url: process.env.DATABASE_CONNECTION_STRING
  }
};
