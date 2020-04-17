const rp = require("request-promise");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const base64url = require("base64-url");

module.exports = {
  friendlyName: 'Get FHIR Access Token',
  description: 'Get FHIR Access Token using cleint credentials grant type.',
  inputs: {},

  fn: async function(inputs, exits) {
    try {
      const claims = {
        iss: process.env.FHIR_CLIENT_ID || sails.config.fhir.client_id,
        sub: process.env.FHIR_CLIENT_ID || sails.config.fhir.client_id,
        aud: process.env.FHIR_TOKEN_URL || sails.config.fhir.token_url,
        exp: Date.now()/1000 + 300, // 5 min
        jti: crypto.randomBytes(32).toString("hex")
      };

      const jwtSigned = jwt.sign(
        claims,
        base64url.decode(process.env.FHIR_PRIVATE_KEY || sails.config.fhir.private_key),
        {
          algorithm: 'RS256',
          header: {
            kid: process.env.FHIR_KID || sails.config.fhir.kid
          }
        }
      );

      const options = {
        method: 'POST',
        uri: process.env.FHIR_TOKEN_URL || sails.config.fhir.token_url,
        json: true,
        form: {
          scope: "system/*.*",
          grant_type: "client_credentials",
          client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
          client_assertion: jwtSigned
        }
      };

      const { access_token } = await rp(options);
      return exits.success(access_token);
    } catch(e) {
      return exits.error(e);
    }
  }
}
