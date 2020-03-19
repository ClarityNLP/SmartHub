const db = sails.getDatastore("default").manager;
const Joi = require('joi');
const ObjectID = require('mongodb').ObjectID;

module.exports = {
  all: async function(req,res) {
    const activities = await db.collection('activity').find(
      {},
      {
        _id: 1,
        progress: 1,
        patientName: 1,
        name: 1//TODO make these fields nested and nice...
      }
    ).toArray();
    return res.send(activities);
  },
  findById: async function(req,res) {
    try {
      const activityId = req.param('activityId');
      const activity = await db.collection('activity').findOne(
        { _id: new ObjectID(activityId)},
        {
          _id: 1,
          patientId: 1,
          name: 1,
          slug: 1,
          groups: 1,
          evidences: 1
        }
      );
      return res.send(activity);
    } catch(err) {
      return res.badRequest(err);
    }
  },
  create: async function(req,res) {
    try {
      const schema = Joi.object().keys({
        formSlug: Joi.string().required(),
        patientId: Joi.string().required()
      });

      const {
        formSlug,
        patientId
      } = await Joi.validate(req.body, schema);

      const activityId = await db.collection('activity').findOne(
        { slug: formSlug, patientId: patientId },
        { _id: 1 }
      );

      if (!activityId) {
        const form = await db.collection('form').findOne(
          { slug: formSlug },
          { _id: 0 }
        );
        if (!form) {
          return res.badRequest(`Form ${formSlug} does not exist.`);
        }
        const { insertedId: newActivityId } = await db.collection('activity').insertOne(
          { patientId: patientId, ...form }
          // { progress: 45, patientName: 'Timmy', patientId: patientId, ...form } //TODO: actually implement progress and patientName...
        )
        return res.send(newActivityId);
      }
      return res.send(activityId._id);
    } catch (err) {
      return res.badRequest(err);
    }
  },
  updateValues: async function(req,res) {
    try {
      const body = {
        ...req.params,
        values: req.body
      };
      await sails.helpers.updateValues(body);
      return res.ok();
    } catch(e) {
      return res.badRequest(e);
    }
  },
  updateAutofillIds: async function(req,res) {
    try {
      const schema = Joi.object().keys({
        activityId: Joi.string().required(),
        autofillIds: Joi.object()
      });

      const payload = {
        ...req.params,
        autofillIds: req.body
      };

      const {
        activityId,
        autofillIds
      } = await Joi.validate(payload, schema);

      const activity = await db.collection('activity').findOne(
        { _id: new ObjectID(activityId) },
        { groupLookup: 1 }
      );

      if (!activity) {
        return res.badRequest(`Activity ${activityId} not found.`);
      }

      const sets = Object.keys(autofillIds).reduce((acc, q) => {
        return {
          ...acc,
          [`groups.byId.${activity.groupLookup[q]}.questions.byId.${q}.autofillId`]: autofillIds[q],
          [`groups.byId.${activity.groupLookup[q]}.questions.byId.${q}.isAutofillLoaded`]: true
          //TODO -- if autofill error occurs in user-mode or headless-mode, the error will not be persisted.
        }
      }, {});

      await db.collection('activity').update(
        { _id: new ObjectID(activityId) },
        { $set: sets }
      );

      return res.ok();
    } catch(error) {
      return res.badRequest(error);
    }
  },
  updateGroupLoadingStates: async function(req,res) {
    try {
      const schema = Joi.object().keys({
        activityId: Joi.string().required(),
        groupLoadingStates: Joi.object()
      });

      const payload = {
        ...req.params,
        groupLoadingStates: req.body
      };

      const {
        activityId,
        groupLoadingStates
      } = await Joi.validate(payload, schema);

      const activity = await db.collection('activity').findOne(
        { _id: new ObjectID(activityId) },
        { groups: 1 }
      );

      if (!activity) {
        return res.badRequest(`Activity ${activityId} not found.`);
      }

      const newGroupsById = activity.groups.allIds.reduce((acc, g) => {
        acc[g] = {
          ...activity.groups.byId[g],
          isLoaded: groupLoadingStates[g]
        }
        return acc
      }, {});

      await db.collection('activity').update(
        { _id: new ObjectID(activityId) },
        { $set: { 'groups.byId': newGroupsById } }
      );

      return res.ok();
    } catch(error) {
      return res.badRequest(error);
    }
  },
  reset: async function(req,res) {
    try {
      await sails.helpers.resetActivities(req.body);
      return res.ok();
    } catch(err) {
      return res.badRequest(err);
    }
  },
}
