var Joi = require('joi');
const autofillSchema = require('./autofill');

module.exports = Joi.object({
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
              type: Joi.string(), //spreadsheet not providing this.
              autofill: autofillSchema,
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
  }).required(),
  evidences: Joi.object().pattern(
    /^/,
    Joi.object({
      allIds: Joi.array().items(Joi.string()).required(),
      byId: Joi.object().pattern(
        /^/,
        Joi.object({
          displayType: Joi.string().valid('table','cards').required(),
          items: Joi.string().allow(null).valid(null).required(),
        })
        .when(Joi.object({ displayType: Joi.string().valid('table') }), {
          then: Joi.object({
            title: Joi.string().required(),
            subtitle: Joi.string(),
            cols: Joi.array().items(Joi.object({
              label: Joi.string().required(),
              value: Joi.string().required()
            }))
          })
        })
      )
    })
  ).required()
});
