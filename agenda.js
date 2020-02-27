const Agenda = require('agenda');
const {
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOSTNAME,
  MONGO_CONTAINER_PORT,
  MONGO_DATABASE
} = process.env;

var agenda = new Agenda(
  {
    db: {
      address: `${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_CONTAINER_PORT}/${MONGO_DATABASE}`,
      collection: 'job'
    }
  }
);

const jobTypes = ['smartchart'];
// var jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : [];

jobTypes.forEach(function(type) {
  require('./jobs/' + type)(agenda);
})


if(jobTypes.length) {
  agenda.processEvery('two seconds').on('ready', function() {
    agenda.start();
  });
}

module.exports = agenda;
