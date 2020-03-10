const Joi = require('joi');
const ObjectID = require('mongodb').ObjectID;
const map = require("async/map");
const get = require('lodash/get');
const AutofillError = require('../../errors/autofill-error');
const autofillSchema = require('../../schemas/autofill');

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

      const schema = Joi.object({
        activityId: Joi.string().required(),
        questionSlug: Joi.string().required(),
        autofill: autofillSchema({ strict: true })
      });

      const validatedBody = await Joi.validate(inputs.body, schema, {
        stripUnknown: true
      });

      const {
        activityId,
        questionSlug,
        autofill
      } = validatedBody;

  /***************************************************************************
  *                                                                          *
  * Find or create autofill record. Good idea to instantiate the record      *
  * early in the autofill service so we can pin a thrown exception to        *
  * something tangible.                                                      *
  *                                                                          *
  ***************************************************************************/

      const { value: autofillRecord } = await db.collection('autofill').findAndModify(
        {
          activityId: new ObjectID(activityId),
          questionSlug: questionSlug
        },
        {},
        {
          $setOnInsert: {
            activityId: new ObjectID(activityId),
            questionSlug: questionSlug
          },
          $unset: {
            error: null,
            trace: null,
            value: null
          }
        },
        {
          new: true,
          upsert: true,
        }
      )

      const { _id: autofillId } = autofillRecord;

  /***************************************************************************
  *                                                                          *
  * What the autofill service is doing:                                      *
  *                                                                          *
  * (1) Iterate over cases                                                   *
  *  --> (1a) Construct query (data + activityId)                            *
  *  --> (1b) Determine if there is a value reference ($$)                   *
  *  --> (1c) Finding matching document (.findOne for now)                   *
  * (2) Massage values based on question type                                *
  * (3) Update autofill record to contain trace/value information            *                                                   *
  *                                                                          *
  ***************************************************************************/

      try {
        let matchQuery, match;

        if (!autofill.cases) {
          return exits.success({
            value: autofill.default,
            id: autofillId
          });
        }

        const rawValues = await map(autofill.cases, async (c) => {
          const query = c.queries.reduce((acc, q) => {
            if (q.clauses) {
              return {
                ...acc,
                [q.operator]: q.clauses.map(c => {
                  const [ bundle, feature, ...rest ] = c.field.split('.');
                  return {
                    field: `${bundle}.${feature}`,
                    [`data.${rest.join('.')}`]: { [c.operator]: c.criteria }
                  }
                })
              };
            } else {
              const [ bundle, feature, ...rest ] = q.field.split('.');
              return {
                ...acc,
                field: `${bundle}.${feature}`,
                [`data.${rest.join('.')}`]: { [q.operator]: q.criteria }
              };
            }
          }, { activityId: new ObjectID(activityId) } );

          const getValRef = (value) => {
            const [ bundle, feature, ...rest ] = value.split('.');
            return `data.${rest.join('.')}`;
          }

          const valRef = c.value.substring(0,2) === "$$" ? getValRef(c.value) : null

          match = await db.collection('evidence').findOne(
            query,
            valRef ? { [valRef]: 1 } : { _id: 1 }
          );

          console.log('match: ',match);

          return !!!match ? null               :
                   valRef ? get(match, valRef) :
                            c.value            ;
        });

        const initMap = {
          radio: null,
          date: null,
          text: null,
          checkbox: [],
          select: []
        }

        const init = initMap[autofill.type] || null;

        /*
          log(values)
          [
           'yes'
           'maybe'
           null
          ]
        */

        const truthy = (type, values) => {
          switch (type) {
            case 'radio': // Fallthrough
            case 'date': // Fallthrough
            case 'text': {
              return values ? true : false;
            }
            case 'checkbox': // Fallthrough
            case 'select': {
              return values.length > 0 ? true : false;
            }
            default: {
              return false
            }
          }
        };

        const values = rawValues.reduce((acc, value) => {
          switch(autofill.type) {
            case 'radio': // Fallthrough
            case 'date': //Fallthrough
            case 'text':
              return value || acc;
            case 'checkbox': // Fallthrough
            case 'select': {
              return value ? [...acc, value] : acc;
            }
          }
        }, init);

        // log(value)
        // 'maybe'

        const truthyValue = truthy(autofill.type, values) ? values : autofill.default || null;

  /***************************************************************************
  *                                                                          *
  * Update autofill record to trace what happened.                           *
  *                                                                          *
  ***************************************************************************/

        await db.collection('autofill').updateOne(
          { _id: new ObjectID(autofillId) },
          {
            $set: {
              trace: {
                command: autofill,
                evidence: match
              },
              value: truthyValue
            }
          }
        );

        return exits.success({
          value: truthyValue,
          id: autofillId
        });
      } catch(e) {
        throw new AutofillError(
          autofillId,
          e.message || e
        );
      }
    } catch(e) {
      if (e instanceof AutofillError) {
        try {
          const db = sails.getDatastore("default").manager;

  /***************************************************************************
  *                                                                          *
  * Insert one error record.                                                 *
  *                                                                          *
  ***************************************************************************/

          const { insertedId: newErrorId } = await db.collection('error').insertOne({
            ...e,
            stack: e.stack,
            message: e.message
          });

  /***************************************************************************
  *                                                                          *
  * Update autofill record to include the error.                             *
  *                                                                          *
  ***************************************************************************/

          await db.collection('autofill').updateOne(
            { _id: new ObjectID(e.autofillId) },
            {
              $set: {
                error: {
                  date: e.date,
                  stack: e.stack,
                  message: e.message,
                  _id: newErrorId
                }
              }
            }
          );
          return exits.error({ message: e.message, id: e.autofillId });
        } catch (e) {
          return exits.error({ message: e.message, id: e.autofillId });
        }
      }
      return exits.error(e.message || e);
    }
  }
};
