(function () {
	
	'use strict';
	
	angular.module('baseApp')
	.service('MapService', function ($http, $q) {
		
		//var deferred = $q.defer();
		this.getEEMapTokenID = function (startYear, endYear, startMonth, endMonth, method, shape) {

			var config = {
				params: {
					startYear: startYear,
					endYear: endYear,
					startMonth: startMonth,
					endMonth: endMonth,
					action: 'get-map-id',
					method: method
				}
			};

			var shapeType = shape.type;
			if (shapeType === 'rectangle' || shapeType === 'polygon') {
				config.params.shape = shapeType;
				config.params.geom = shape.geom.toString();
			} else if (shapeType === 'circle') {
				config.params.shape = shapeType;
				config.params.radius = shape.radius;
				config.params.center = shape.center.toString();
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

		this.getFloodHazardId = function (startYear, endYear, startMonth, endMonth, method, shape) {
			
			var config = {
				params: {
					startYear: startYear,
					endYear: endYear,
					startMonth: startMonth,
					endMonth: endMonth,
					action: 'get-hazard-id',
					method: method
				}
			};

			var shapeType = shape.type;
			if (shapeType === 'rectangle' || shapeType === 'polygon') {
				config.params.shape = shapeType;
				config.params.geom = shape.geom.toString();
			} else if (shapeType === 'circle') {
				config.params.shape = shapeType;
				config.params.radius = shape.radius;
				config.params.center = shape.center.toString();
			}

			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		this.downloadMap = function (startYear, endYear, startMonth, endMonth, method, shape) {

			var config = {
				params: {
					startYear: startYear,
					endYear: endYear,
					startMonth: startMonth,
					endMonth: endMonth,
					action: 'download-url',
					method: method
				}
			};

			var shapeType = shape.type;
			if (shapeType === 'polygon') {
				config.params.shape = shapeType;
				config.params.geom = shape.geom.toString();
			}

			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		this.saveToDrive = function (startYear, endYear, startMonth, endMonth, method, shape, fileName) {
			var config = {
				params: {
					startYear: startYear,
					endYear: endYear,
					startMonth: startMonth,
					endMonth: endMonth,
					action: 'download-to-drive',
					file: fileName,
					method: method
				}
			};

			var shapeType = shape.type;
			if (shapeType === 'polygon') {
				config.params.shape = shapeType;
				config.params.geom = shape.geom.toString();
			}

			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		this.getTownShipId = function (shape) {
			
			var config = {
				params: {
					action: 'get-township-id'
				}
			};

			var shapeType = shape.type;
			if (shapeType === 'rectangle' || shapeType === 'polygon') {
				config.params.shape = shapeType;
				config.params.geom = shape.geom.toString();
			} else if (shapeType === 'circle') {
				config.params.shape = shapeType;
				config.params.radius = shape.radius;
				config.params.center = shape.center.toString();
			}

			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		this.getExposureData = function (shape) {
			
			var config = {
				params: {
					action: 'get-exposure-data'
				}
			};

			var shapeType = shape.type;
			if (shapeType === 'rectangle' || shapeType === 'polygon') {
				config.params.shape = shapeType;
				config.params.geom = shape.geom.toString();
			} else if (shapeType === 'circle') {
				config.params.shape = shapeType;
				config.params.radius = shape.radius;
				config.params.center = shape.center.toString();
			}

			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		this.getExposureDatum = function (lat, lng) {
			
			var config = {
				params: {
					action: 'get-exposure-datum',
					lat: lat,
					lng: lng
				}
			};

			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};


		this.getWorldPopId = function (shape) {

			var config = {
				params: {
					action: 'get-world-pop-id'
				}
			};

			var shapeType = shape.type;
			if (shapeType === 'rectangle' || shapeType === 'polygon') {
				config.params.shape = shapeType;
				config.params.geom = shape.geom.toString();
			} else if (shapeType === 'circle') {
				config.params.shape = shapeType;
				config.params.radius = shape.radius;
				config.params.center = shape.center.toString();
			}

			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;
		};

		this.getWorldPopNumber = function (shape) {
			var config = {
				params: {
					action: 'get-world-pop-number',
				}
			};

			var shapeType = shape.type;
			if (shapeType === 'rectangle' || shapeType === 'polygon') {
				config.params.shape = shapeType;
				config.params.geom = shape.geom.toString();
			} else if (shapeType === 'circle') {
				config.params.shape = shapeType;
				config.params.radius = shape.radius;
				config.params.center = shape.center.toString();
			}
			var promise = $http.get('/api/', config)
			.then(function (response) {
				return response.data;
			});
			return promise;

		};
		
	});
	
})();