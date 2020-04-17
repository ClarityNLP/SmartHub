module.exports = {

  new: async function(req,res) {
    try {
      const token = await sails.helpers.getFhirAccessToken();
      return res.ok(token);
    } catch(e) {
      return res.badRequest(e);
    }
  }
}
