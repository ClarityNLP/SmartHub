const Joi = require('joi');
const rp = require('request-promise');
const nlpaasUrl =  process.env.NLPAAS_URL || sails.config.nlpaasUrl
const ObjectID = require('mongodb').ObjectID;

module.exports = {

  friendlyName: 'Update values',

  description: 'Update values for activity.',

  inputs: {
    body: {
      type: 'ref',
      example: {
        activityId: '1234',
        values: {
          question1: 'dead',
          question2: 'known'
        }
      },
      required: true
    }
  },

  fn: async function (inputs, exits) {
    try {
      const db = sails.getDatastore("default").manager;

      const schema = Joi.object().keys({
        activityId: Joi.string().required(),
        values: Joi.object()
      });

      const {
        activityId,
        values
      } = await Joi.validate(inputs.body, schema);

      const activity = await db.collection('activity').findOne(
        { _id: new ObjectID(activityId) }
      );

      if (!activity) {
        return exits.error(`Activity ${activityId} not found.`);
      }

      const valuesToSet = Object.keys(values).reduce((acc, q) => {
        return {
          ...acc,
          [`groups.byId.${activity.groupLookup[q]}.questions.byId.${q}.value`]: values[q]
        }
      }, {});

      await db.collection('activity').update(
        { _id: new ObjectID(activityId) },
        { $set: valuesToSet }
      );

      return exits.success();
    } catch(e) {
      return exits.error(e);
    }
  }
};
