const formSchema = require('../../schemas/form');

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
      const schema = formSchema;
      const validatedForm = await Joi.validate(inputs.form, schema, {
        stripUnknown: true
      });

      return exits.success(validatedForm);
    } catch (e) {
      return exits.error(e);
    }
  }
};
