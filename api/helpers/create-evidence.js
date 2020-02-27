const Joi = require('joi');
const rp = require('request-promise');
const nlpaasUrl =  process.env.NLPAAS_URL || sails.config.nlpaasUrl
const ObjectID = require('mongodb').ObjectID;
const map = require("async/map");

module.exports = {

  friendlyName: 'Create evidence',

  description: 'Create round-trip job w/ NLPaas for evidence.',
  //NOTE: ultimately, NLPaaS needs to be refactored, round-trip jobs
  //are not scalable.

  inputs: {
    body: {
      type: 'ref',
      example: {
        evidenceSlug: 'wbc_hematologic_findings',
        activityId: '1234',
        fhirClient: {},
        fhirVersion: 2,
        source_id: '1234',
        formSlug: '4100_r4'
      },
      description: 'Data to be passed to job.',
      required: true
    },
    returnEvidence: {
      type: 'boolean',
      description: 'Return evidence or not. UI callers will want this to be true.',
      required: false,
      defaultsTo: true
    }
  },

  fn: async function (inputs, exits) {
    try {
      const db = sails.getDatastore("default").manager;

      const schema = Joi.object().keys({
        evidenceSlug: Joi.string().required(),
        activityId: Joi.string().required(),
        fhirClient: Joi.object().required(),
        fhirVersion: Joi.number().required(),
        source_id: Joi.string().required(),
        formSlug: Joi.string().required() // TODO won't need this what NLPaaS gets changed.
      });

      const validatedPayload = await Joi.validate(inputs.body, schema);

      const {
        evidenceSlug,
        activityId,
        fhirClient,
        fhirVersion,
        source_id,
        formSlug // TODO won't need this what NLPaaS gets changed.
      } = validatedPayload;

      const options = {
        method: 'POST',
        uri: `${nlpaasUrl}/job/NLPQL_form_content/${formSlug}/${evidenceSlug}`,
        body: {
          fhir: fhirClient,
          fhirVersion: fhirVersion,
          source_id: source_id
        },
        json: true
      };

      const evidence = await rp(options);
      const evidenceById = evidence.reduce((acc, item) => {
        return {
          ...acc,
          [item.nlpql_feature]: [
            ...(acc[item.nlpql_feature] || []), //NOTE: '|| []' incase acc[item.nlqpl_feature] not iterable
            item
          ]
        };
      }, {});

      const activity = await db.collection('activity').findOne(
        { _id: new ObjectID(activityId) },
        { [`evidences.${evidenceSlug}.byId`]: 1,
          [`evidences.${evidenceSlug}.allIds`]: 1
        }
      );

      if (!activity) {
        return exits.error(`Activity ${activityId} not found.`);
      }

      const mergedEvidenceById = activity.evidences[evidenceSlug].allIds.reduce((acc, feature) => {
        return {
          ...acc,
          [feature]: {
            ...acc[feature],
            ...activity.evidences[evidenceSlug].byId[feature],
            items: evidenceById[feature]
          }
        }
      }, {});

      await db.collection('activity').update(
        { _id: new ObjectID(activityId) },
        { $set: { [`evidences.${evidenceSlug}.byId`]: mergedEvidenceById } }
      );

      // Insert flattened evidence as individual records for autofill service.
      // Helps with questions of type "text".
      await map(Object.keys(evidenceById), async (feature) => {
        const evidencesForInsertMany = evidenceById[feature].map(evid => {
          const { _id, ...rest } = evid;
          return {
            //_id, //TODO do we need to use ClarityNLP's evidence _id or gen. new one.
            data: rest,
            sourceId: source_id,
            activityId: new ObjectID(activityId),
            field: `${evidenceSlug}.${feature}`
          }
        });
        return await db.collection('evidence').insertMany(evidencesForInsertMany);
      });
      return exits.success(inputs.returnEvidence ? mergedEvidenceById : null);
    } catch(e) {
      return exits.error(e);
    }
  }
};
