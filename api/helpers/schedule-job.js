var agenda = require('../../agenda.js');

module.exports = {

  friendlyName: 'Schedule Agenda Job',
  description: 'Schedule Agenda Job',

  inputs: {
    jobName: {
      type: 'string',
      description: 'Name of Defined Job',
      required: true
    },
    runAt: {
      type: 'string',
      description: 'Human friendly runAt time for job',
      required: true
    },
    data: {
      type: 'ref',
      description: 'Data to be passed to job',
      required: false
    },
    repeatEvery: {
      type: 'string',
      description: 'Human friendly time when to repeat the job',
      required: false
    }
  },

  fn: function(inputs, exits) {

    var job = agenda.create(inputs.jobName, inputs.data );

    job.schedule(inputs.runAt);

    if (inputs.repeatEvery) {
      job.repeatEvery(inputs.repeatEvery)
    }

    job.save(function(err, savedJob) {
      if (err) {
        return exits.error(err);
      }
      return exits.success(savedJob);
    });
  }
}
