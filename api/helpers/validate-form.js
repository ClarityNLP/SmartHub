const Joi = require('joi');
const map = require("async/map");
const ObjectID = require('mongodb').ObjectID;

module.exports = {

  friendlyName: 'Validate form schema',

  description: 'Validate form schema',

  inputs: {
    form: {
      type: 'ref',
      description: 'Form to be validated.',
      required: true
    }
  },

  fn: async function (inputs, exits) {
    try {
      const schema = Joi.object({
        name: Joi.string().required(),
        slug: Joi.string().required(),
        groups: Joi.object({
          byId: Joi.object().pattern(
            /^/,
            Joi.object({
              name: Joi.string().required(),
              questions: Joi.object({
                byId: Joi.object().pattern(
                  /^/,
                  Joi.object({
                    number: Joi.number().required(),
                    name: Joi.string().required(),
                    type: Joi.string().required(),
                    autofill: Joi.object({
                      type: Joi.string().required(),
                      default: Joi.alternatives().try(
                        Joi.array().items(Joi.string()),
                        Joi.string().allow('', null)
                      ),
                      cases: Joi.array().items(
                        Joi.object({
                          queries: Joi.array().items(
                            Joi.object({
                              field: Joi.string(),
                              operator: Joi.string(),
                              criteria: Joi.alternatives().try(
                                Joi.string(),
                                Joi.number(),
                                Joi.boolean()
                              ).required(),
                              clauses: Joi.array().items(
                                Joi.object({
                                  field: Joi.string().required(),
                                  operator: Joi.string().required(),
                                  criteria: Joi.alternatives().try(
                                    Joi.string(),
                                    Joi.number(),
                                    Joi.boolean()
                                  ).required()
                                })
                              )
                            })
                            .when(Joi.object({ operator: Joi.any().valid('$or') }), {
                              then: Joi.object({
                                clauses: Joi.required(),
                                field: Joi.forbidden(),
                                criteria: Joi.forbidden()
                              }),
                              otherwise: Joi.object({
                                clauses: Joi.forbidden(),
                                field: Joi.required(),
                                criteria: Joi.required()
                              })
                            })
                          ),
                          value: Joi.string().required()
                        })
                      ).required()
                    }).allow('', null),
                    options: Joi.array().items(Joi.object({
                      label: Joi.string().required(),
                      value: Joi.string().required()
                    })).when('type', {
                      is: 'RADIO',
                      then: Joi.required()
                    }),
                    validationType: Joi.string(),
                    validations: Joi.array().items(Joi.object({
                      type: Joi.string().required(),
                      params: Joi.array().required()
                    })),
                    value: Joi.alternatives().try(
                      Joi.array().items(Joi.string()),
                      Joi.string().allow('', null)
                    ),
                    evidence: Joi.string().allow(null)
                  }).and('validationType', 'validations')
                ),
                allIds: Joi.array().items(Joi.string()).required()
              }),
              evidences: Joi.array().items(Joi.string()).required()
            })
          ),
          allIds: Joi.array().items(Joi.string()).required()
        })
      });

      const validatedForm = await Joi.validate(inputs.form, schema, {
        stripUnknown: true
      });

      return exits.success(validatedForm);
    } catch (e) {
      return exits.error(e);
    }
  }
};
