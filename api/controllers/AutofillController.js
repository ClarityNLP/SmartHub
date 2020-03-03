const wait = ms => new Promise((r, j)=>setTimeout(r, ms))

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
  }
}
