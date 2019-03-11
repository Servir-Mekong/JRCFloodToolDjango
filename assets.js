'use strict';

module.exports = {
    client: {
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