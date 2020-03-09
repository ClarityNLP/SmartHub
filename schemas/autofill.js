var Joi = require('joi');

module.exports = function(opt) {
  return Joi.object({
    type: opt.strict ? Joi.string().lowercase().required() : Joi.string().lowercase(),
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
    )
  }).allow('', null).or('default', 'cases');
}
