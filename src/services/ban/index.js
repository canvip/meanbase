'use strict';

const service = require('feathers-mongoose');
const ban = require('./ban-model');
const hooks = require('./hooks');

module.exports = function() {
  const app = this;

  const options = {
    Model: ban,
    lean: true
  };

  // Initialize our service with any options it requires
  app.use('/bans', service(options));

  // Get our initialize service to that we can bind hooks
  const banService = app.service('/bans');

  // Set up our before hooks
  banService.before(hooks.before);

  // Set up our after hooks
  banService.after(hooks.after);
};
