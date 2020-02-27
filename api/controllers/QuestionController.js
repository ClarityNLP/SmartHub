const wait = ms => new Promise((r, j)=>setTimeout(r, ms))

module.exports = {

  autofill: async function(req,res) {
    try {
      const body = {
        ...req.body,
        ...req.params
      };
      const value = await sails.helpers.autofill(body);
      return res.send(value);
    } catch(err) {
      return res.badRequest(err);
    }
  }
}
