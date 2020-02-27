const Joi = require('joi');
const map = require("async/map");
const ObjectID = require('mongodb').ObjectID;

module.exports = {

  friendlyName: 'Reset activities',

  description: 'Reset activities',

  inputs: {
    activityIds: {
      type: 'ref',
      example: ['1234','5678'],
      description: 'Activity IDs to be passed to job.',
      required: true
    }
  },

  fn: async function (inputs, exits) {
    try {
      const db = sails.getDatastore("default").manager;
      const schema = Joi.array().items(Joi.string())
      const activityIds = await Joi.validate(inputs.activityIds, schema);

      await map(activityIds, async (activityId) => {
        const activity = await db.collection('activity').findOne(
          { _id: new ObjectID(activityId) },
          { slug: 1, patientId: 1, patientName: 1 }
        );

        if (!activity) {
          throw new Error(`Activity ${activityId} not found.`);
        }

        const form = await db.collection('form').findOne(
          { slug: activity.slug },
          { _id: 0 }
        );

        if (!form) {
          throw new Error(`Form ${activity.slug} not found.`);
        }

        await db.collection('activity').updateOne(
          { _id: new ObjectID(activityId) },
          {
            patientId: activity.patientId,
            patientName: activity.patientName,
            progress: 0,
            ...form
          }
        );

        //TODO handle shrink-wrapping
        return await db.collection('evidence').deleteMany(
          { activityId: new ObjectID(activityId) }
        );
      });
      return exits.success();
    } catch(e) {
      console.log('ERR: ',e);
      return exits.error(e);
    }
  }
};
