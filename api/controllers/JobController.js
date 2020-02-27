const Joi = require('joi');

module.exports = {

  create: async function(req,res) {
    try {
      const schema = Joi.object().keys({
        formSlug: Joi.string().required(),
        patientIds: Joi.array().items(Joi.string()).required()
      });

      const validatedBody = await Joi.validate(req.body, schema, {
        stripUnknown: true
      });

      sails.helpers.scheduleJob( 'do smartchart', 'now', validatedBody ).switch({
        error: function(err) {
          sails.log.error(err);
          return res.status(500).send( { msg: `Problem scheduling *do smartchart* job` } );
        },
        success: function(job) { //TODO respond with created Job ID...so users can query status...
          return res.status(200).send(job.attrs);
        }
      });
    } catch(e) {
      return res.badRequest(e);
    }
  },

  all: async function(req,res) {
    const jobs = await Job.find();
    return res.send(jobs);
  },

  findById: async function(req,res) {
    try {
      const jobId = req.param('jobId');
      const job = await Job.findOne(jobId);
      if (!job) {
        throw new Error(`No job found with id ${jobId}`);
      }
      return res.send(job);
    } catch(err) {
      return res.badRequest(err);
    }
  },
  //TODO: temporary
  // testWebSocket: async function(req,res) {
  //   sails.sockets.blast('receive job status', {
  //     jobId: '1234',
  //     status: 'complete'
  //   })
  //   return res.ok();
  // }
}
