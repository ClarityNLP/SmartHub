const Agenda = require('agenda');

var agenda = new Agenda(
  {
    db: {
      address: sails.config.datastores.default.url,
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
