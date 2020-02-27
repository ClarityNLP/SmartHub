module.exports = {
  all: async function(req,res) {
    const forms = await Form.find();
    return res.send(forms);
  },

  validate: async function(req,res) {
    try {
      const form = req.body;
      await sails.helpers.validateForm(form);
      return res.ok();
    } catch (e) {
      return res.badRequest(e);
    }
  },

  create: async function(req,res) {
    try {
      const form = req.body;
      const validatedForm = await sails.helpers.validateForm(form);
      const groupLookup = validatedForm.groups.allIds.reduce((acc, g) => {
        return {
          ...acc,
          ...validatedForm.groups.byId[g].questions.allIds.reduce((acc, q) => {
            return {
              ...acc,
              [q]: g
            }
          }, {})
        }
      }, {});

      //TODO who should own this?
      const newValidatedForm = {
        ...validatedForm,
        groupLookup
      };

      await Form.create(newValidatedForm);
      return res.ok();
    } catch(err) {
      return res.badRequest(err);
    }
  }
}
