module.exports = {
  all: async function(req,res) {
    try {
      const db = sails.getDatastore("default").manager;
      const forms = await db.collection('form').find(
        {},
        {
          _id: 1,
          name: 1,
          slug: 1
        }
      ).toArray();
      return res.send(forms);
    } catch (e) {
      return res.badRequest(e);
    }
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
    } catch (e) {
      return res.badRequest(e);
    }
  },

  update: async function(req,res) {
    try {
      const db = sails.getDatastore("default").manager;
      const slug = req.param('formId');
      const form = {
        ...req.body,
        slug: slug
      };
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

      await db.collection('form').update(
        { slug: slug },
        newValidatedForm,
        {
          upsert: true
        }
      );
      return res.ok();
    } catch (e) {
      return res.badRequest(e);
    }
  }
}
