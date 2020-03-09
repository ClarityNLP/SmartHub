module.exports.routes = {
  /* Autofill */
  'get /autofill/:autofillId': 'AutofillController.getAutofill',
  'get /autofills/:autofillId/evidence': 'AutofillController.getAutofillDocument',
  'post /activities/:activityId/questions/:questionSlug/autofill': 'AutofillController.doAutofill',

  /* Form */
  'post /forms': 'FormController.create',
  'get /forms': 'FormController.all',
  'put /forms/:formId': 'FormController.update',
  'post /schemas/v2/validate': 'FormController.validate',

  /* Evidence */
  'post /activities/:activityId/evidences/:evidenceSlug': 'EvidenceController.create',

  /* Activity */
  // 'get /subjects/:subjectId/forms/:formSlug': 'ActivityController.findOrCreate',
  'post /activities': 'ActivityController.create',
  'get /activities/:activityId': 'ActivityController.findById',
  'get /activities': 'ActivityController.all',
  'put /activities/reset': 'ActivityController.reset',
  'put /activities/:activityId/values': 'ActivityController.updateValues',
  'put /activities/:activityId/groups': 'ActivityController.updateGroupLoadingStates',

  /* Job */
  'post /jobs': 'JobController.create',
  'get /jobs': 'JobController.all',
  'get /jobs/:jobId': 'JobController.findById', //top-level job metadata

  'get /web-socket': 'JobController.testWebSocket'

  // 'get /jobs/:jobId/activities' //populate activites in the job (show statuses as well)
};
