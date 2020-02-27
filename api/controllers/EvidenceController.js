const wait = ms => new Promise((r, j)=>setTimeout(r, ms))

module.exports = {

  create: async function(req,res) {
    try {
      const body = {
        ...req.body,
        ...req.params
      };
      const evidence = await sails.helpers.createEvidence(body);
      return res.send(evidence);
    } catch(err) {
      return res.badRequest(err);
    }
  }
}
