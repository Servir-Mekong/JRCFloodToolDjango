(function () {
	'use strict';

	// Bootstrap the app once
	angular.element(document).ready(function () {
		console.log('Bootstraping the app');
		angular.bootstrap(document.body, ['baseApp']);
	});
	
	// All the dependencies come here
	angular.module('baseApp', ['rzModule'], function ($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	})
	.config(function ($httpProvider) {
		
	    $httpProvider.defaults.headers.common = {};
	    $httpProvider.defaults.headers.post = {};
	    $httpProvider.defaults.headers.put = {};
	    $httpProvider.defaults.headers.patch = {};
	    $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
		
	});
	
	//CMS.$(document).on('cms-ready', function () {
	//	$(body).css({'margin-top': '100px'});
	//});
})();