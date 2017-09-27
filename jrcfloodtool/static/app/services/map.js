(function () {
	
	'use strict';
	
	angular.module('baseApp')
	.service('MapService', function ($http, $q) {
		
		//var deferred = $q.defer();
		this.getEEMapTokenID = function (startYear, endYear, shape) {

			var config = {
					params: {
						start: startYear,
						end: endYear,
						action: 'get-map-id'
					}
			}

			var shapeType = shape.type;
			if (shapeType === 'rectangle' || shapeType === 'polygon') {
				config.params['shape'] = shapeType;
				config.params['geom'] = shape.geom.toString();
			} else if (shapeType === 'circle') {
				config.params['shape'] = shapeType;
				config.params['radius'] = shape.radius;
				config.params['center'] = shape.center.toString();
			}

			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
			/* var request = $http.get();
			 * request.then(function (response) {
				deferred.resolve(response.data);
			}, function (error) {
				deferred.reject(error);
			});
			
			return deferred.promise;*/
		};

		this.downloadMap = function (startYear, endYear, shape) {

			var config = {
					params: {
						start: startYear,
						end: endYear,
						action: 'download-url'
					}
			}

			var shapeType = shape.type;
			if (shapeType === 'polygon') {
				config.params['shape'] = shapeType;
				config.params['geom'] = shape.geom.toString();
			}

			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		this.saveToDrive = function (startYear, endYear, shape, fileName) {
			var config = {
					params: {
						start: startYear,
						end: endYear,
						action: 'download-to-drive',
						file: fileName
					}
			}

			var shapeType = shape.type;
			if (shapeType === 'polygon') {
				config.params['shape'] = shapeType;
				config.params['geom'] = shape.geom.toString();
			}

			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};
		
	});
	
})();