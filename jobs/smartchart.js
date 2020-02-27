const request = require("request");
const axios = require('axios'); //PICK ONE REQ LIBRARY PLEASE...
const mapSeries = require("async/mapSeries");
const map = require("async/map");
const rp = require('request-promise');
const ObjectID = require('mongodb').ObjectID;
const nlpaasUrl =  process.env.NLPAAS_URL || sails.config.nlpaasUrl
const doGroupsInParallel = true;

module.exports = function(agenda) {

  //functions -- TODO move to another file to be shared with controller logic...

  const findOrCreateActivity = (db, formSlug, id) => {
    return new Promise(async function(resolve, reject) {
      try {
        const activity = await db.collection('activity').findOne(
          { slug: formSlug, patientId: id },
          { _id: 1, groups: 1, evidences: 1, slug: 1 } //sourceId?
        );

        if (!activity) {
          const form = await db.collection('form').findOne(
            { slug: formSlug },
            { _id: 0 }
          );
          if (!form) {
            reject(`Form ${formSlug} not found.`);
          }
          const { insertedId: newActivityId } = await db.collection('activity').insertOne(
            // { patientId: id, ...form }
            { progress: 0, patientName: 'Timmy', patientId: id, ...form }
          );
          const newActivity = await db.collection('activity').findOne(
            { _id: new ObjectID(newActivityId) },
            { _id: 1, groups: 1, evidences: 1, slug: 1 } //sourceId?
          )
          resolve(newActivity);
        }
        resolve(activity);
      } catch(e) {
        reject(e);
      }
    });
  };

  const maybeGetEvidence = (evid, activity) => {
    return new Promise(async function(resolve, reject) {
      try {
        // if (allEvidences[evid].byId) { //TODO now it's harder to do this since data is nested under features, but need to do...
        //   return resolve('Evidence already retrieved, no need to fire request.');
        // }

        await sails.helpers.createEvidence({
          evidenceSlug: evid,
          activityId: new ObjectID(activity._id).toHexString(),
          fhirClient: {}, //TODO
          fhirVersion: 2, // TODO
          source_id: "1234",
          formSlug: activity.slug //TODO won't need this when NLPaaS gets changed...
        }, false);//NOTE we don't need evidence returned in headless mode.
        return resolve();
      } catch(e) {
        return reject(e);
      }
    });
  }

  const maybeAutofill = (question, activityId) => {
    return new Promise(async function(resolve, reject) {
      try {
        //NOTE: Question has value already or question does not contain autofill operation.
        if (question.value || !question.autofill) {
          return resolve(question.value);
        }

        const value = await sails.helpers.autofill({ ...question, activityId });
        return resolve(value);
      } catch(e) {
        return reject(e);
      }
    });
  }

  const doGroup = (db, groupId, activity) => {
    return new Promise(async function(resolve, reject) {
      try {
        const values = await map(activity.groups.byId[groupId].evidences, async (evid) => {
          await maybeGetEvidence(evid, activity); //TODO needs intelligence
          //as to when to not go get evidence...if same bundle already in progress...
          //think same bundle in difference groups...
          const values = await map(
            activity.groups.byId[groupId].questions.allIds
            .filter(q => activity.groups.byId[groupId].questions.byId[q].evidence === evid),
            async (q) => {
              return { [q]: await maybeAutofill({ ...activity.groups.byId[groupId].questions.byId[q], slug: q }, new ObjectID(activity._id).toHexString()) }
            }
          )
          return values.reduce((acc, v) => {
            return {
              ...acc,
              ...v
            };
          }, {});
        });
        const flatValues = values.reduce((acc, v) => {
          return {
            ...acc,
            ...v
          }
        }, {});
        await sails.helpers.updateValues({
          activityId: new ObjectID(activity._id).toHexString(),
          values: flatValues
        });
        await sails.helpers.updateProgress(new ObjectID(activity._id).toHexString())
        //TODO say group isLoaded...
        resolve();
      } catch(e) {
        reject(e);
      }
    })
  };

  agenda.define('do smartchart', async function(job, done) {
    try {
      const db = sails.getDatastore("default").manager;

      const {
        patientIds,
        formSlug
      } = job.attrs.data;

      await mapSeries(patientIds, async (patientId) => {
        const activity = await findOrCreateActivity(db, formSlug, patientId);
        const myMap = doGroupsInParallel ? map : mapSeries;
        return await myMap(activity.groups.allIds, async(groupId) => {
          return await doGroup(db, groupId, activity);
        });
        //TODO notify that activity is done...via headless job...think more about statuses...
      });
      //TODO notify that the entire job is done...cool...
      done();
    } catch(e) {
      console.log('E: ',e);
      done();
    }

    //pseudo code

    //iterate over patientIds
    //--> check (patientId + formSlug) doesn't have activityId already
    //--> if if does not, create new activity (set status, set jobId, etc.)
    //--> probably do one activity at a time (as to not overload nlpaas/clarityNLP)
    //--> NOTE: explain this above to team, highlight why nlpaas needs to be removed/refactored.
    //--> broadcast socket messages as we go along, fuel real-time view on smarthub mgmt ui
  });
}
