const Joi = require('joi');
const rp = require('request-promise');
const ObjectID = require('mongodb').ObjectID;

module.exports = {

  friendlyName: 'Update activity progress',

  description: 'Update activity progress',

  inputs: {
    activityId: {
      type: 'string',
      example: '1234',
      required: true
    }
  },

  fn: async function (inputs, exits) {
    try {
      const db = sails.getDatastore("default").manager;
      const schema = Joi.string().required()
      const activityId = await Joi.validate(inputs.activityId, schema);

      const activity = await db.collection('activity').findOne(
        { _id: new ObjectID(activityId) },
        { groups: 1 }
      );

      if (!activity) {
        return exits.error(`Activity ${activityId} not found.`);
      }

      const values = activity.groups.allIds.reduce((acc, g) => {
        const groupValues = activity.groups.byId[g].questions.allIds.reduce((acc, q) => {
          return {
            ...acc,
            [q]: activity.groups.byId[g].questions.byId[q].value
          }
        }, {});
        return {
          ...acc,
          ...groupValues
        }
      }, {});

      const numQues = Object.keys(values).length;
      const numAnsQues = Object.keys(values).reduce((acc, q) => {
        return values[q] ? acc + 1 : acc;
      }, 0);

      await db.collection('activity').update(
        { _id: new ObjectID(activityId) },
        { $set: { progress: Math.floor((numAnsQues/numQues) * 100) } }
      );

      return exits.success();
    } catch(e) {
      return exits.error(e);
    }
  }
};
