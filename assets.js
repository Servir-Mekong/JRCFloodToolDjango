'use strict';

module.exports = {
	client: {
		lib: {
			css: [
				'jrcfloodtool/static/vendor/bootstrap/dist/css/bootstrap.min.cs',
				'jrcfloodtool/static/vendor/bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css',
				'jrcfloodtool/static/vendor/angularjs-slider/dist/rzslider.min.css',
				'jrcfloodtool/static/vendor/normalize-css/normalize.css',
				'jrcfloodtool/static/vendor/components-font-awesome/css/font-awesome.min.css'
			],
			js: [
				'jrcfloodtool/static/vendor/jquery/dist/jquery.min.js',
				'jrcfloodtool/static/vendor/bootstrap/dist/js/bootstrap.min.js',
				'jrcfloodtool/static/vendor/bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js',
				'jrcfloodtool/static/vendor/angular/angular.min.js',
				'jrcfloodtool/static/vendor/angularjs-slider/dist/rzslider.min.js'
			]
		},
		css: [
			'jrcfloodtool/static/css/*.css',
		],
		js: [
			'jrcfloodtool/static/app/*.js',
			'jrcfloodtool/static/app/**/*.js'
		],
		views: [
			'jrcfloodtool/templates/*.html',
			'jrcfloodtool/templates/**/*.html',
		],
		templates: ['static/templates.js']
	},
	server: {
		gulpConfig: ['gulpfile.js']
	}
};
