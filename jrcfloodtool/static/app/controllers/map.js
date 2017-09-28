(function () {

	'use strict';
	
	angular.module('baseApp')
	.controller('mapCtrl', function ($scope, $timeout, MapService) {

		// Sidebar Menu controller
		$scope.toggleButtonClass = 'toggle-sidebar-button is-closed';
		$scope.sidebarClass = 'display-none';
		$scope.mapClass = 'col-md-12 map';
		
		$scope.openSidebar = function () {
			
			if ($scope.toggleButtonClass === 'toggle-sidebar-button is-closed') {
				$scope.mapClass = 'col-md-9 map';
				$scope.sidebarClass = 'col-md-3 sidebar';
				$scope.toggleButtonClass = 'toggle-sidebar-button is-open';
				//$scope.broadcastTimeSlider();
			} else {
				$scope.mapClass = 'col-md-12 map';
				$scope.sidebarClass = 'display-none';
				$scope.toggleButtonClass = 'toggle-sidebar-button is-closed';
			}
			
		};

		// Date Range Slider
		$scope.broadcastTimeSlider = function () {
			$timeout(function () {
				$scope.$broadcast('rzSliderForceRender');
			});
		};

		/*$scope.startYear = 2000;
		$scope.endYear = 2012;
		$scope.startMonth = 1;
		$scope.endMonth = 10;
		$scope.dateSlider = {
				startHandle: $scope.startYear,
				endHandle: $scope.endYear,
				options: {
					floor: 1984,
					ceil: (new Date()).getFullYear() - 1,
					step: 1
				}
		};*/
		
		// Earth Engine
		// Global Variables
		var EE_URL = 'https://earthengine.googleapis.com',
			DEFAULT_ZOOM = 6,
			MAX_ZOOM = 25,
			DEFAULT_CENTER = { lng: 102.93, lat: 16.4 },
			MAP_TYPE = 'satellite',
			AREA_LIMIT = 20000,
			// Map options
			mapOptions = {
				center: DEFAULT_CENTER,
				zoom: DEFAULT_ZOOM,
				maxZoom: MAX_ZOOM,
				streetViewControl: false,
				mapTypeId: MAP_TYPE,
				mapTypeControlOptions: {
					style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
		            position: google.maps.ControlPosition.TOP_CENTER
		        },
			},
			// Map variable
			map = new google.maps.Map(document.getElementById('map'), mapOptions);

		$scope.showLegend = false;
		$scope.showAlert = false;

		/**
		* Starts the Google Earth Engine application. The main entry point.
		*/
		$scope.initMap = function (startDate, endDate, init) {
			if (typeof(init)==='undefined') init = false;
			$scope.showLoader = true;
			MapService.getEEMapTokenID(startDate, endDate, $scope.shape)
		    .then(function (data) {
				$scope.showAlert();
		    	loadMap(data.eeMapId, data.eeMapToken);
		    	if (init) {
					$('.custom-alert').removeClass('alert-success');
					$('.custom-alert').removeClass('alert-danger');
					$('.custom-alert').addClass('alert-info');
					$scope.alertContent = "The map view shows the data from 2000 January to 2012 December. You can change the map view with the ☰  provided in the left side!";	
		    	}
		    	$scope.showLegend = true;
		    }, function (error) {
		        console.log(error);
		    });
		};

		/** Updates the image based on the current control panel config. */
		var loadMap = function (mapId, mapToken) {
			var eeMapOptions = {
				getTileUrl: function (tile, zoom) {
					var url = EE_URL + '/map/';
						url += [mapId, zoom, tile.x, tile.y].join('/');
						url += '?token=' + mapToken;
						return url;
					},
				tileSize: new google.maps.Size(256, 256),
				name: 'FloodViewer',
				opacity: 1.0,
				mapTypeId: MAP_TYPE
			};
			var mapType = new google.maps.ImageMapType(eeMapOptions);
			map.overlayMapTypes.push(mapType);
		};

		// Custom Control Google Maps API
		$scope.overlays = [];
		$scope.shape = {};
		var drawingManager = new google.maps.drawing.DrawingManager();

		var getDrawingManagerOptions = function (type) {
		    var typeOptions;

			if (type === 'rectangle') {
				typeOptions = 'rectangleOptions';
			} else if (type === 'circle') {
				typeOptions = 'circleOptions';
			} else if (type === 'polygon') {
				typeOptions = 'polygonOptions';
			}

		    var drawingManagerOptions = {
		    		'drawingControl': false
		    };
		    drawingManagerOptions['drawingMode'] = type;
		    drawingManagerOptions[typeOptions] = {
	    		'strokeColor': '#6c6c6c',
				'strokeWeight': 3.5,
				'fillColor': 'yellow',
				'fillOpacity': 0.6
		    };
			
			return drawingManagerOptions;
				
		};

		var getRectangleArray = function (bounds) {
			var start = bounds.getNorthEast();
			var end = bounds.getSouthWest();
			return [start.lng().toFixed(2), start.lat().toFixed(2), end.lng().toFixed(2), end.lat().toFixed(2)]
		};

		var getPolygonArray = function (pathArray) {
			var geom = [];
			for (var i = 0; i < pathArray.length; i++) {
				var coordinatePair = [pathArray[i].lng().toFixed(2), pathArray[i].lat().toFixed(2)];
				geom.push(coordinatePair);
			}
			return geom;
		};

		// Overlay Listener
		google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
			// Clear Layer First
			$scope.clearOverlays();
			var overlay = event.overlay;
			$scope.overlays.push(overlay);
			$scope.shape = {};

			var drawingType = event.type;
			$scope.shape['type'] = drawingType;
			if (drawingType === 'rectangle') {
				$scope.shape['geom'] = getRectangleArray(overlay.getBounds());
			} else if (drawingType === 'circle') {
				$scope.shape['center'] = [overlay.getCenter().lng().toFixed(2), overlay.getCenter().lat().toFixed(2)];
				$scope.shape['radius'] = overlay.getRadius().toFixed(2); // unit: meter
			} else if (drawingType === 'polygon') {
				$scope.shape['geom'] = getPolygonArray(overlay.getPath().getArray());
			}
		});

		$scope.clearOverlays = function () {
			while ($scope.overlays[0]) {
				$scope.overlays.pop().setMap(null);
			}
		};

		$scope.drawRectangle = function () {

			drawingManager.setOptions(getDrawingManagerOptions('rectangle'));
			// Loading the drawing Tool in the Map.
			drawingManager.setMap(map);
			
		};

		$scope.drawCircle = function () {

			drawingManager.setOptions(getDrawingManagerOptions('circle'));
			// Loading the drawing Tool in the Map.
			drawingManager.setMap(map);
			
		};

		$scope.drawPolygon = function () {

			drawingManager.setOptions(getDrawingManagerOptions('polygon'));
			// Loading the drawing Tool in the Map.
			drawingManager.setMap(map);
			
		};

		$scope.stopDrawing = function () {

			drawingManager.setDrawingMode(null);
			
		};

		// Map Downloader
		$('.js-tooltip').tooltip();
		$scope.alertContent = '';
		
		$scope.closeAlert = function () {
			$('.custom-alert').addClass('display-none');
		};

		$scope.showAlert = function () {
			$('.custom-alert').removeClass('display-none');
		};

		$scope.copyToClipBoard = function () {
			// Function taken from https://codepen.io/nathanlong/pen/ZpAmjv?editors=0010
			var btnCopy = $('.btn-copy');
			var copyTest = document.queryCommandSupported('copy');
			var elOriginalText = btnCopy.attr('data-original-title');

			if (copyTest === true) {
				var copyTextArea = document.createElement('textarea');
				copyTextArea.value = $scope.downloadURL;
				document.body.appendChild(copyTextArea);
				copyTextArea.select();
		    try {
		    	var successful = document.execCommand('copy');
		    	var msg = successful ? 'Copied!' : 'Whoops, not copied!';
		    	btnCopy.attr('data-original-title', msg).tooltip('show');
		    } catch (err) {
		    	console.log('Oops, unable to copy');
		    }
		    document.body.removeChild(copyTextArea);
		    btnCopy.attr('data-original-title', elOriginalText);
		  } else {
		    // Fallback if browser doesn't support .execCommand('copy')
		    window.prompt("Copy to clipboard: Ctrl+C or Command+C, Enter", text);
		  }
		};

		var datepickerYearOptions = {
			format:'yyyy',
			autoclose: true,
			startDate: new Date('1984'),
			endDate: new Date('2015'),
			clearBtn: true,
			startView: 'years',
			minViewMode: 'years',
			container: '.datepicker-year-class'
		};
		
		var datepickerMonthOptions = {
			format:'MM',
			autoclose: true,
			clearBtn: true,
			startView: 'months',
			minViewMode: 'months',
			maxViewMode: 'months',
			container: '.datepicker-month-class'
		};

		$scope.showDangerAlert = function () {
			$('.custom-alert').removeClass('alert-info');
			$('.custom-alert').removeClass('alert-success');
			$('.custom-alert').addClass('alert-danger');
		};

		$scope.showSuccessAlert = function () {
			$('.custom-alert').removeClass('alert-info');
			$('.custom-alert').removeClass('alert-danger');
			$('.custom-alert').addClass('alert-success');
		};

		$scope.showInfoAlert = function () {
			$('.custom-alert').removeClass('alert-success');
			$('.custom-alert').removeClass('alert-danger');
			$('.custom-alert').addClass('alert-info');
		};

		$('#datepicker-year-start').datepicker(datepickerYearOptions);
		$('#datepicker-year-start').datepicker('update', new Date(2000));
		$('#datepicker-year-end').datepicker(datepickerYearOptions);
		$('.input-daterange input').each(function() {
		    $(this).datepicker('clearDates');
		});

		$('#datepicker-month-start').datepicker(datepickerMonthOptions);
		$('#datepicker-month-end').datepicker(datepickerMonthOptions);
		$('.input-monthrange input').each(function() {
		    $(this).datepicker('clearDates');
		});

		$scope.getMonthInNumber = function (month) {
			var monthObject = {
				January: '01',
				February: '02',
				March: '03',
				April: '04',
				May: '05',
				June: '06',
				July: '07',
				August: '08',
				September: '09',
				October: '10',
				November: '11',
				December: '12'
			};
			return monthObject[month];
		}

		$scope.checkBeforeDownload = function (checkAreaLimit) {

			if (!$scope.overlays[0]) {
				$scope.showDangerAlert();
				$scope.alertContent = 'Please draw a polygon to begin downloading!';
				$scope.showAlert();
				return false;
			}
			
			if (typeof(checkAreaLimit)==='undefined') checkAreaLimit = false;

			if (checkAreaLimit) {
				var drawnPolygonArea = google.maps.geometry.spherical.computeArea($scope.overlays[0].getPath()) / 1e6;

				if (drawnPolygonArea > AREA_LIMIT) {
					$scope.showDangerAlert();
					$scope.alertContent = 'The drawn polygon is larger than ' + AREA_LIMIT + ' km2. This exceeds the current limitations for downloading data. Please draw a smaller polygon!';
					$scope.showAlert();
					return false;
				}	
			}
			
			var startYear = $('#datepicker-year-start').val();
			var endYear = $('#datepicker-year-end').val();
			var startMonth,
				endMonth,
				message = '';
			// ToDo: Compare Date
			if (!startYear && !endYear) {
				$scope.showDangerAlert();
				$scope.alertContent = 'Select the start and end date in order to download the map!';
				$scope.showAlert();
				return false;
			} else {
				startMonth = $('#datepicker-month-start').val();
				endMonth = $('#datepicker-month-end').val();
				if (!startMonth && !endMonth) {
					message = 'No start and end month provided. Using January as start month and December as end month!';
					startMonth = $scope.getMonthInNumber('January');
					endMonth = $scope.getMonthInNumber('December');
				} else if (startMonth && !endMonth) {
					message = 'No end month provided. Using December as end month!';
					startMonth = $scope.getMonthInNumber(startMonth);
					endMonth = $scope.getMonthInNumber('December');
				} else if (!startMonth && endMonth) {
					message = 'No start month provided. Using January as start month!';
					startMonth = $scope.getMonthInNumber('January');
					endMonth = $scope.getMonthInNumber(endMonth);
				} else {
					startMonth = $scope.getMonthInNumber(startMonth);
					endMonth = $scope.getMonthInNumber(endMonth);
				}

			}

			return {
				startYear: startYear,
				endYear: endYear,
				startMonth: startMonth,
				endMonth: endMonth,
				message: message
			};
			
		};

		$scope.downloadURL = '';
		$scope.downloadUrl = false;
		$scope.gDriveFileName = false;
		$scope.showDownloadUrl = function () {
			$scope.downloadUrl = true;
		};
		$scope.hideDownloadUrl = function () {
			$scope.downloadUrl = false;
		};
		$scope.showGDriveFileName = function () {
			$scope.gDriveFileName = true;
		};
		$scope.hideGDriveFileName = function () {
			$scope.gDriveFileName = false;
		};

		$scope.updateMap = function () {
			var dateObject = $scope.checkBeforeDownload();
			// Clear before adding
			map.overlayMapTypes.clear();
			$scope.clearOverlays();
			var startDate = dateObject['startYear'] + '-' + dateObject['startMonth'];
			var endDate = dateObject['endYear'] + '-' + dateObject['endMonth'];
			$scope.initMap(startDate, endDate);
			$scope.showSuccessAlert();
			$scope.alertContent = dateObject['message'] + ' The map view is updated!';
		};

		$scope.downloadMap = function () {

			var dateObject = $scope.checkBeforeDownload(true);
			// @ToDo: Do proper check
			if (dateObject) {
				$scope.showInfoAlert();
				$scope.alertContent = dateObject['message'] + ' Please wait while I prepare the download link for you!';
				$scope.showAlert();
				MapService.downloadMap(dateObject['startYear'] + '-'+ dateObject['startMonth'], dateObject['endYear'] + '-' + dateObject['endMonth'], $scope.shape)
			    .then(function (data) {
					$scope.showSuccessAlert();
					$scope.alertContent = 'Your Download Link is ready. Enjoy!';
			    	$scope.downloadURL = data.downloadUrl;
			    	$scope.showDownloadUrl();
			    }, function (error) {
			    	$scope.showDangerAlert();
			    	$scope.alertContent = error + ' This is likely error in our end. As a workaround, please try to clear cookie, then hard refresh and load again. If the problem exists, please contact us!';
			        console.log(error);
			    });		
			}
		};

		$scope.saveToDrive = function () {
			var dateObject = $scope.checkBeforeDownload();
			// Check if filename is provided, if not use the default one
			// @ToDo: Sanitize input and do proper check of dateobject
			var fileName = $('#gdrive-file-name').val() || '';
			if (dateObject) {
				$scope.showInfoAlert();
				$scope.alertContent = dateObject['message'] + ' Please wait while I prepare the download link for you. This might take a while!';
				$scope.showAlert();
				MapService.saveToDrive(dateObject['startYear'] + '-' + dateObject['startMonth'], dateObject['endYear'] + '-' +dateObject['endMonth'], $scope.shape, fileName)
			    .then(function (data) {
			    	if (data.error) {
				    	$scope.showDangerAlert();
				    	$scope.alertContent = data.error + ' This is likely error in our end. As a workaround, please try to clear cookie, then hard refresh and load again. If the problem exists, please contact us!';
				        console.log(error);
			    	} else {
						$scope.showSuccessAlert();
						$scope.alertContent = 'Your Download Link is ready. Enjoy!';
						$scope.showAlert();
				    	$scope.downloadURL = data.driveLink;
				    	$scope.showDownloadUrl();
				    	$scope.hideGDriveFileName();
			    	}
			    }, function (error) {
			    	$scope.showDangerAlert();
			    	$scope.alertContent = error + ' This is likely error in our end. As a workaround, please try to clear cookie, then hard refresh and load again. If the problem exists, please contact us!' ;
			        console.log(error);
			    });		
			}
		};
	
	});
})();