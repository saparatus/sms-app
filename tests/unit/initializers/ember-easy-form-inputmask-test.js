import Ember from 'ember';
import { initialize } from 'kingmesaj/initializers/ember-easy-form-inputmask';

var container, application;

module('EmberEasyFormInputmaskInitializer', {
  setup: function() {
    Ember.run(function() {
      container = new Ember.Container();
      application = Ember.Application.create();
      application.deferReadiness();
    });
  }
});

// Replace this with your real tests.
test('it works', function() {
  initialize(container, application);

  // you would normally confirm the results of the initializer here
  ok(true);
});

