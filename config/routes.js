/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  /***************************************************************************
  *                                                                          *
  * Make the view located at `views/homepage.ejs` your home page.            *
  *                                                                          *
  * (Alternatively, remove this and add an `index.html` file in your         *
  * `assets` directory)                                                      *
  *                                                                          *
  ***************************************************************************/

  'post /activities/:activityId/questions/:questionSlug/autofill': 'QuestionController.autofill',

  'post /forms': 'FormController.create',
  'get /forms': 'FormController.all',

  'post /activities/:activityId/evidences/:evidenceSlug': 'EvidenceController.create',

  // 'get /subjects/:subjectId/forms/:formSlug': 'ActivityController.findOrCreate',
  'post /activities': 'ActivityController.create',
  'get /activities/:activityId': 'ActivityController.findById',
  'get /activities': 'ActivityController.all',
  'put /activities/reset': 'ActivityController.reset',
  'put /activities/:activityId/values': 'ActivityController.updateValues',
  'put /activities/:activityId/groups': 'ActivityController.updateGroupLoadingStates',

  'post /jobs': 'JobController.create',
  'get /jobs': 'JobController.all',
  'get /jobs/:jobId': 'JobController.findById', //top-level job metadata

  'post /schemas/v2/validate': 'FormController.validate',

  'get /web-socket': 'JobController.testWebSocket'

  // 'get /jobs/:jobId/activities' //populate activites in the job (show statuses as well)


  /***************************************************************************
  *                                                                          *
  * More custom routes here...                                               *
  * (See https://sailsjs.com/config/routes for examples.)                    *
  *                                                                          *
  * If a request to a URL doesn't match any of the routes in this file, it   *
  * is matched against "shadow routes" (e.g. blueprint routes).  If it does  *
  * not match any of those, it is matched against static assets.             *
  *                                                                          *
  ***************************************************************************/


};
