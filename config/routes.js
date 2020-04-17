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
  'delete /forms/:formSlug/activities': 'FormController.deleteActivitiesByForm',
  'put /forms/:formSlug/activities/reset': 'FormController.resetActivitiesByForm',

  /* Evidence */
  'post /activities/:activityId/evidences/:evidenceSlug': 'EvidenceController.create',

  /* Activity */
  // 'get /subjects/:subjectId/forms/:formSlug': 'ActivityController.findOrCreate',
  'post /activities': 'ActivityController.create',
  'get /activities/:activityId': 'ActivityController.findById',
  'get /activities': 'ActivityController.all',
  'put /activities/reset': 'ActivityController.reset',
  'put /activities/:activityId/values': 'ActivityController.updateValues',
  'put /activities/:activityId/autofillIds': 'ActivityController.updateAutofillIds',
  'put /activities/:activityId/groups': 'ActivityController.updateGroupLoadingStates',

  /* Job */
  'post /jobs': 'JobController.create',
  'get /jobs': 'JobController.all',
  'get /jobs/:jobId': 'JobController.findById', //top-level job metadata
  'get /jobs/:jobId/export': 'JobController.export',
  'get /jobs/:jobId/export/:type': 'JobController.export',

  'get /web-socket': 'JobController.testWebSocket',

  /* Patient */
  'get /patients/:patientId/documents': 'PatientController.getDocuments',

  /* Document Transfer */
  'post /transfers': 'TransferController.new',

  /* Token */
  'get /tokens': 'TokenController.new',

};
