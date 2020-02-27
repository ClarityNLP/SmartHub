const Joi = require('joi');
const ObjectID = require('mongodb').ObjectID;
const map = require("async/map");

/* TODO - NOT DONE. */

module.exports = {

  friendlyName: 'Autofill',

  description: 'Autofill',

  inputs: {
    body: {
      type: 'ref',
      example: {
        activityId: '1234',
        questionSlug: 'question1',
        autofill: {
          type: 'radio',
          default: 'other_product',
          cases: [
            {
              queries: [
                {
                  field: 'evidences.cellular_therapy_infusion.byId.Kymriah.items.value_name',
                  operator: "$eq",
                  criteria: 'Kymriah'
                }
              ],
              value: 'tisagenlecleucel_kymriah'
            }
          ]
        },
      },
      description: 'Data to be passed to autofill service.',
      required: true
    }
  },

  fn: async function (inputs, exits) {
    try {
      const db = sails.getDatastore("default").manager;

      const schema = Joi.object().keys({
        activityId: Joi.string().required(),
        questionSlug: Joi.string(), //NOTE: not used, nice to see in outgoing request from Chrome dev tools however.
        autofill: Joi.object().keys({
          type: Joi.string(),
          default: Joi.string(),
          cases: Joi.array().items(
            Joi.object().keys({
              queries: Joi.array(),
              value: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string())
            })
          )
          // cases: Joi.array().items(
          //   Joi.object().keys({
          //     queries: Joi.array().items(
          //       Joi.object().keys({
          //         field: Joi.string(),
          //         criteria: Joi.alternatives().try(Joi.object(), Joi.string())
          //       })
          //     ),
          //     value: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string())
          //   })
          // )
        })
      });

      const validatedBody = await Joi.validate(inputs.body, schema, {
        stripUnknown: true
      });

      const {
        activityId,
        autofill
      } = validatedBody;

      // pseudo code
      // - parse sessionId
      // - parse subjectId from body
      // - parse formSlug from url param
      // - Form.findOne(sessionId, subjectId, formSlug)
      // - doing autofill...

      map(autofill.cases, async (c) => {
        const query = c.queries.reduce((acc, q) => {
          const [ bundle, feature, ...rest ] = q.field.split('.');
          return q.clauses ? (//TODO w/ new style...
            {
              ...acc,
              [q.operator]: q.clauses.map(c => {
                return {
                  [c.field]: { [c.operator]: c.criteria }
                }
              })
            }
          ) : (
            {
              ...acc,
              // [q.field]: { [q.operator]: q.criteria }
              field: `${bundle}.${feature}`,
              [`data.${rest}`]: { [q.operator]: q.criteria }
            }
          )
        }, { activityId: new ObjectID(activityId) } );

        // const match = await db.collection('evidence').find( //do we need more than one match? TODO
        //   query,
        //   {
        //     value: "$$" ?
        //   }
        // )

        // return

        // const isMatch = await db.collection('activity').findOne(
        //   query,
        //   {
        //     _id: 1,
        //
        //   }
        // );
        // const isMatch = await db.collection('activity').aggregate([
        //   { $match: query },
        //   { $project: {
        //       matches: { $filter: {
        //           // input: '$$CURRENT',
        //         // as: 'evidences',
        //         // cond: { $eq: ['$$cars.colour', 'blue']}
        //         cond: {
        //           // $eq: ['this.evidences.cellular_therapy_infusion.byId.Kymriah.items[0].value_name', 'Kymriah' ]
        //           $eq: ["test", "test"]
        //         }
        //       }},
        //       _id: 0
        //   }}
        // ]).toArray();


        //   query,
        //   {
        //     _id: 1,
        //
        //   }
        // );
        // console.log('isMatch: ',isMatch);
        return !!isMatch ? c.value : null;
      }, (err, values) => {
        if (err) {
          return exits.error(err);
        }

        const init = null; //{} //[]

        //log(values)
        // [
        //  'yes'
        //  'maybe'
        //  null
        // ]

        const value = values.reduce((acc, value) => {
          return acc = value || acc;
        }, init);

        // log(value)
        // 'maybe'

        return exits.success(value || autofill.default);
      });
    } catch(e) {
      return exits.error(e);
    }
  }
};
