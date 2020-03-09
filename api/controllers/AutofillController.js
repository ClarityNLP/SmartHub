const wait = ms => new Promise((r, j)=>setTimeout(r, ms))
const ObjectID = require('mongodb').ObjectID;

module.exports = {

  doAutofill: async function(req,res) {
    try {
      const body = {
        ...req.body,
        ...req.params
      };
      const value = await sails.helpers.autofill(body);
      return res.ok(value);
    } catch(e) {
      return res.badRequest(e.raw || 'Problem with autofill.');
    }
  },

  getAutofill: async function(req,res) {
    //TODO
    return res.ok();
  },

  getAutofillDocument: async function(req,res) {
    try {
      const db = sails.getDatastore("default").manager;
      const autofillId = req.param('autofillId');
      const autofill = await db.collection('autofill').findOne(
        { _id: new ObjectID(autofillId) },
        {
          value: 1,
          "trace.evidence": 1
        }
      );

      if (!autofill) {
        return res.badRequest('No autofill found.');
      }

      if (!autofill.trace.evidence) {
        return res.send({
          evidence: null,
          value: autofill.value
        });
      }

      const evidence = await db.collection('evidence').findOne(
        { _id: new ObjectID(autofill.trace.evidence._id) }
      );

      if (!evidence) {
        return res.badRequest('No evidence found.');
      }

      return res.send({
        evidence: evidence.data,
        value: autofill.value
      });
    } catch(e) {
      return res.badRequest(e);
    }

  }
}
