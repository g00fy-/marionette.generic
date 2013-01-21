/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    lint: {
      files: ['grunt.js', 'lib/**/*.js', 'test/**/*.js']
    },
    jasmine : {
      src : [
        'public/javascripts/jquery.js',
        'public/javascripts/json2.js',
        'public/javascripts/underscore.js',
        'public/javascripts/backbone.js',
        'public/javascripts/backbone.babysitter.js',
        'public/javascripts/backbone.augment.js',
        'public/javascripts/backbone.wreqr.js',
        'public/javascripts/backbone.marionette.js',
        'src/views.js'
      ],
      specs:[
        'spec/*.js'
      ]
    },
    'jasmine-server' :{

    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {}
    }
  });

  // Default task.
//  grunt.registerTask('default', 'lint qunit');
  grunt.loadNpmTasks('grunt-jasmine-runner');

};
