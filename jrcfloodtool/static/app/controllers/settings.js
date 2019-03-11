(function () {

	'use strict';
	angular.module('baseApp')
	.controller('settingsCtrl', function ($scope, appSettings) {

		$scope.menus = appSettings.menus;
		$scope.applicationName = appSettings.applicationName;
		$scope.footerLinks = appSettings.footerLinks;
		$scope.partnersHeader = appSettings.partnersHeader;
		$scope.partnersFooter = appSettings.partnersFooter;

	});

})();
