(function () {

	'use strict';

	angular.module('baseApp')
	.controller('mapCtrl' ,function ($scope, $timeout, MapService, appSettings, $tooltip, $modal, $alert, ngDialog,FileSaver, Blob, usSpinnerService) {


		// Settings
		$scope.timePeriodOptions = appSettings.timePeriodOptions;

		// Sidebar Menu controller
		/*$scope.toggleButtonClass = 'toggle-sidebar-button is-close';
		$scope.sidebarClass = 'display-none';
		$scope.mapClass = 'col-md-12 col-sm-12 col-lg-12';
		$scope.alertClass = 'custom-alert-full';
		$scope.toggleButtonClass = 'toggle-sidebar-button is-open';
		$scope.sidebarClass = 'col-sm-5 col-md-3 col-lg-3 sidebar';
		$scope.mapClass = 'col-md-12 col-sm-12 col-lg-9';
		$scope.alertClass = 'custom-alert';

		$scope.openSidebar = function () {

			if ($scope.toggleButtonClass === 'toggle-sidebar-button is-closed') {
				$scope.mapClass = 'col-sm-12 col-md-12 col-lg-12';
				$scope.sidebarClass = 'display-none';
				$scope.toggleButtonClass = 'toggle-sidebar-button is-open';
				$scope.alertClass = 'custom-alert';
			} else {
				$scope.mapClass = 'col-sm-7 col-md-9 col-lg-9';
				$scope.sidebarClass = 'col-sm-5 col-md-3 col-lg-3 sidebar';
				$scope.toggleButtonClass = 'toggle-sidebar-button is-closed';
				$scope.alertClass = 'custom-alert-full';
			}

		};*/

		// Earth Engine
		// Global Variables
		var EE_URL = 'https://earthengine.googleapis.com',
			DEFAULT_ZOOM = 6,
			MAX_ZOOM = 25,
			DEFAULT_CENTER = { lng: 96.19, lat: 20.87 },
			AREA_LIMIT = 20000,
			// Map options
			mapOptions = {
				center: DEFAULT_CENTER,
				zoom: DEFAULT_ZOOM,
				maxZoom: MAX_ZOOM,
				streetViewControl: false,
				zoomControl: true,
				zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
    		},
				mapTypeControlOptions: {
					style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
		            position: google.maps.ControlPosition.TOP_CENTER
		        },
			},
			// Map variable
			map = new google.maps.Map(document.getElementById('map'),mapOptions);

		$scope.showLegend = false;
		$scope.showAlert = false;
		$scope.timePeriodOption = null;
		$scope.showPolygonDrawing = false;
		$scope.checkPolygonDrawing = true;
		$scope.checkWorldPop = false;
		$scope.checkMapData = true;
		$scope.checkMapData_value = true;
		$scope.checkAggFH_value = true;

		//New added controls in View Data
		$scope.checkStateBoundary = false;
		$scope.checkTSBoundary = false;
		$scope.checkRdNet = false;
		$scope.checkShLoc = false;
		$scope.checkWhLoc = false;
		//$scope.checkActualFF = false;
		$scope.checkAggFH = true;

		//New added controls in analysis
		$scope.analysisStateBoundary = false;
		$scope.analysisTSBoundary = true;
		$scope.analysisRdNet = false;
		$scope.analysisShLoc = false;
		$scope.analysisWhLoc = false;
		$scope.analysisPop = false;
		$scope.analysisExposure = true;
		$scope.analysisRisk = false;

		//New added controls in Result
		$scope.resultDisplay = false;
		$scope.resultDownload = false;
		$scope.layerDownload = false;
		$scope.resultActualFF = false;
		$scope.resultAggFH = true;
		$scope.resultRisk = false;
		$scope.checkInfoBtn = false;

		// Custom Control Google Maps API
		$scope.overlays = {};
		$scope.shape = {};
		$scope.drawingArea = null;

		$scope.initialLoader = 0;
		$scope.slider = {
		    value: 100,
		    options: {
		      floor: 0,
		      ceil: 100,
		      step: 1,
		      minLimit: 0,
		      maxLimit: 100,
					onEnd: function() {
		                 $scope.clickMapData($scope.slider.value);
		            }
		    }
		};
		$scope.slider2 = {
			value: 100,
			options: {
				floor: 0,
				ceil: 100,
				step: 1,
				minLimit: 0,
				maxLimit: 100,
				onEnd: function() {
									 $scope.clickAffFH($scope.slider2.value);
							}
			}
		};
		$scope.slider3 = {
			value: 100,
			options: {
				floor: 0,
				ceil: 100,
				step: 1,
				minLimit: 0,
				maxLimit: 100,
				onEnd: function() {
									 $scope.PopOpacity($scope.slider3.value);
							}
			}
		};

		$('.js-tooltip').tooltip();

		/**
		 * Alert
		 */

		$scope.closeAlert = function () {
			$('.custom-alert').addClass('display-none');
			$scope.alertContent = '';
		};

		var showErrorAlert = function (alertContent) {
			$scope.alertContent = alertContent;
			$('.custom-alert').removeClass('display-none').removeClass('alert-info').removeClass('alert-success').addClass('alert-danger');
		};

		var showSuccessAlert = function (alertContent) {
			$scope.alertContent = alertContent;
			$('.custom-alert').removeClass('display-none').removeClass('alert-info').removeClass('alert-danger').addClass('alert-success');
		};

		var showInfoAlert = function (alertContent) {
			$scope.alertContent = alertContent;
			$('.custom-alert').removeClass('display-none').removeClass('alert-success').removeClass('alert-danger').addClass('alert-info');
		};

		// Map Functionality

		var clearLayers = function (name) {
			map.overlayMapTypes.forEach (function (layer, index) {
				if ((layer) && (layer.name === name)) {
					map.overlayMapTypes.removeAt(index);
				}
			});
		};

		/** Updates the image based on the current control panel config. */
		var loadMap = function (mapId, mapToken, type) {
			//map.overlayMapTypes.setAt( 0, null);

			var layers = { "township": "4", "flood-hazard": "0", "map":"2", "state": "3","warehouse": "5", "shelter": "6", "worldPop": "1" };
			if (typeof(type) === 'undefined') type = 'map';
			var eeMapOptions = {
				getTileUrl: function (tile, zoom) {
					var url = EE_URL + '/map/';
						url += [mapId, zoom, tile.x, tile.y].join('/');
						url += '?token=' + mapToken;
						return url;
					},
				tileSize: new google.maps.Size(256, 256),
				name: type,
				opacity: 1.0
			};
			var mapType = new google.maps.ImageMapType(eeMapOptions);
			//map.overlayMapTypes.push(null);
			// map.overlayMapTypes.push(mapType);
			//map.overlayMapTypes.setAt(layers[mapType.name],mapType);
			$scope.overlays[type] = mapType;
			for (var t in $scope.overlays) {
				console.log(t);
				map.overlayMapTypes.setAt(layers[t],$scope.overlays[t]);
			}
			//console.log(map.overlayMapTypes);
		};

		/**
		* Starts the Google Earth Engine application. The main entry point.
		*/
		$scope.initMap = function (startYear, endYear, startMonth, endMonth, method, init) {
			$scope.initialLoader = 0;

			if (typeof (init) === 'undefined') init = false;
			$scope.initializeHazardLayer(startYear, endYear, startMonth, endMonth, method, init);
			$scope.initializeFloodLayer(startYear, endYear, startMonth, endMonth, method, init);

		};

		$scope.initializeFloodLayer = function (startYear, endYear, startMonth, endMonth, method, init) {
			usSpinnerService.spin('spinner-1');
			showInfoAlert('Please wait a minute! we are processing your request.');
			if ($scope.checkMapData) {
				MapService.getEEMapTokenID(startYear, endYear, startMonth, endMonth, method, $scope.shape)
				.then(function (data) {
					loadMap(data.eeMapId, data.eeMapToken);
					map.overlayMapTypes.setAt( 0, null);
					//usSpinnerService.spin('spinner-1');
					if(	!$("#ActualFlood_check").is(':checked')){
						$("#ActualFlood_check").click();
					}
					if (init) {
						$timeout(function () {
							showInfoAlert('The map data shows the data from 1984 to 2015. You can change the map data with the ☰ provided in the left side!');
						}, 3500);
					} else {
						$timeout(function () {
							showSuccessAlert('The actual flood frequency map is updated!');
							//usSpinnerService.stop('spinner-1');
						}, 3500);
					}
					//$scope.showLegend = true;
					// $scope.initialLoader += 1;
					// stopLoader();
				}, function (error) {
					console.log(error);
					showErrorAlert(error.statusText);
				});
			}

		};

		$scope.initializeHazardLayer = function (startYear, endYear, startMonth, endMonth, method, init) {
			usSpinnerService.spin('spinner-1');
			showInfoAlert('Please wait a minute! we are processing your request.');
			if ($scope.checkAggFH) {
				MapService.getFloodHazardId(startYear, endYear, startMonth, endMonth, method, $scope.shape)
				.then(function (data) {
					console.log(data);
					loadMap(data.eeMapId, data.eeMapToken, 'flood-hazard');
					showSuccessAlert('The Hazard Level Layer is updated!');
					if(	!$("#AffFH_opacity_check").is(':checked')){
						$("#AffFH_opacity_check").click();
					}
					usSpinnerService.stop('spinner-1');
					// $scope.initialLoader += 1;
					// stopLoader();
				}, function (error) {
					showErrorAlert('Something went wrong! Please try again later!');
					console.log(error.statusText);
				});
			}
		};
		function stopLoader(){
			if($scope.initialLoader === 2)
			{
				usSpinnerService.stop('spinner-1');
			}
		}
		var execProcessTable = function() {
			$scope.results = null;
			showInfoAlert('Please wait a minute! we are processing your request.');
			MapService.getExposureData($scope.shape)
			.then(function (data) {
				$scope.results = JSON.parse(data);
				usSpinnerService.stop('spinner-2');
				console.log($scope.results);
				$scope.closeAlert();
				//$modal({title: "Information", content: "Township ID: 0014, \n Name: Five star", show: true});
				ngDialog.open({
											template: '<table id="exposure_tbl" class="table"><thead><tr><th>State/Region</th><th>District</th><th>Township Name</th><th ng-show="analysisWhLoc">No. of Warehouse</th><th >Hazard Level</th><th ng-show="analysisPop">No. of Pop</th><th ng-show="analysisShLoc">No. of Shelter</th></tr></thead><tbody><tr ng-repeat="result in results track by $index"><td>[[result.NAME_1_x]]</td><td>[[result.NAME_2_x]]</td><td>[[result.NAME_3_x]]</td><td ng-show="analysisWhLoc">[[result.no_warehou]]</td><td >[[result.hazard]]</td><td ng-show="analysisPop">[[result.Sum_Pop]]</td><td ng-show="analysisShLoc">[[result.No_shelter]]</td></tr></tbody></table>',
					className: 'ngdialog-theme-default',
					width: '60%',
					plain: true,
					scope:$scope
				});
			}, function (error) {
				//showErrorAlert('Something went wrong! Please try again later!');
				showErrorAlert('Something went wrong! Please try again later!');
				console.log(error);
		});
		};

		var execProcessDownload = function(startYear,endYear) {
			$scope.results = null;
			MapService.getExposureDownload($scope.shape)
			.then(function (data) {
				var blob = new Blob([data], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
				//var objectUrl = URL.createObjectURL(blob);
				//window.open(objectUrl);
				showSuccessAlert('Exposure data is downloaded in excel file format.');
				FileSaver.saveAs(blob, 'exposure_' +startYear+'-'+ endYear+ '.xlsx');
				usSpinnerService.stop('spinner-2');
			}, function (error) {
				showErrorAlert('Something went wrong! Please try again later!');
				console.log(error);
			});
		};


		$scope.clickMapData = function (opacity_value) {
		opacity_value = parseInt(opacity_value)/100;
		  if($scope.overlays.map)
			if ($scope.checkMapData_value) {
				$scope.overlays.map.setOpacity(opacity_value);
			} else {
				$scope.overlays.map.setOpacity(0);
			}
		};

		$scope.clickAffFH = function (opacity_value) {
		opacity_value = parseInt(opacity_value)/100;
		  if($scope.overlays['flood-hazard'])
			if ($scope.checkAggFH_value) {
				$scope.overlays['flood-hazard'].setOpacity(opacity_value);
			} else {
			    $scope.overlays['flood-hazard'].setOpacity(0);

			}
		};
		$scope.PopOpacity = function (opacity_value) {
		opacity_value = parseInt(opacity_value)/100;
		  if($scope.overlays.worldPop)
			if ($scope.checkAggFH_value) {
				$scope.overlays.worldPop.setOpacity(opacity_value);
			} else {
			    $scope.overlays.worldPop.setOpacity(0);
			}
		};

		$scope.updateMap = function () {
			$scope.closeAlert();
			usSpinnerService.spin('spinner-1');
      var dateObject;
			if ($scope.checkMapData) {
				dateObject = $scope.checkBeforeDownload(false, false);
				if (dateObject) {
					if (dateObject.message) {
						showInfoAlert(dateObject.message);
					}
					// Clear before adding
					clearLayers('map');
					$scope.initializeFloodLayer(dateObject.startYear, dateObject.endYear, dateObject.startMonth, dateObject.endMonth, $scope.timePeriodOption.value);
				}
			}

			if ($scope.checkAggFH) {
				dateObject = $scope.checkBeforeDownload(false, false);
				if (dateObject) {
					if (dateObject.message) {
						showInfoAlert(dateObject.message);
					}
					// Clear before adding
					clearLayers('flood-hazard');
					$scope.initializeHazardLayer(dateObject.startYear, dateObject.endYear, dateObject.startMonth, dateObject.endMonth, $scope.timePeriodOption.value);
				}
			}

			if ($scope.checkWorldPop) {
				clearLayers('worldPop');
				$scope.getWorldPopId();
			}
		};


		$scope.downloadMap = function (){
			var dateObject = $scope.checkBeforeDownload(true);
			// @ToDo: Do proper check
			if (dateObject) {
				showInfoAlert(dateObject.message + ' Please wait while I prepare the download link for you!');
				if($scope.checkMapData_value){
					MapService.downloadMap(dateObject.startYear, dateObject.endYear, dateObject.startMonth, dateObject.endMonth, $scope.timePeriodOption.value, $scope.shape,'download-url')
					.then(function (data) {
						console.log(data);
						showSuccessAlert('Your Download Link is ready. Enjoy!');
						$scope.downloadURL = data.downloadUrl;
						$scope.showDownloadUrl();
						openInNewTab(data.downloadUrl);
					}, function (error) {
						showErrorAlert(error.message);
						console.log(error);
					});
				}
				if($scope.checkAggFH_value){
					MapService.downloadMap(dateObject.startYear, dateObject.endYear, dateObject.startMonth, dateObject.endMonth, $scope.timePeriodOption.value, $scope.shape,'download-url-haz')
					.then(function (data) {
						console.log(data);
						showSuccessAlert('Your Download Link is ready. Enjoy!');
						$scope.downloadURL = data.downloadUrl;
						$scope.showDownloadUrl();
						openInNewTab(data.downloadUrl);
					}, function (error) {
						showErrorAlert(error.message);
						console.log(error);
					});
				}
				if($scope.resultDownload) {
						console.log('resultDownload ',$scope.resultDownload);
						execProcessDownload(dateObject.startYear, dateObject.endYear);
				}

			}
		};

		$scope.download = function () {
			$scope.downloadMap();

			// if($scope.resultDownload && !$scope.layerDownload) {
			// 	$scope.clickProcess();
			// }
			if(!$scope.checkMapData_value && !$scope.checkAggFH_value && !$scope.resultDownload) {
				showErrorAlert('Please select either Hazard or Exposure');
			}
		};

		$scope.analyzeProcess = function(){
			var dateObject = $scope.checkBeforeDownload(true);
			if (dateObject) {
				usSpinnerService.spin('spinner-2');
				$scope.updateMap();
				execProcessTable();
			}
		};


		$scope.selectAllLayers = function (){
			console.log($scope.layerDownload);

			$scope.checkMapData_value = $scope.layerDownload;
			$scope.clickMapData(100);
			$scope.checkAggFH_value = $scope.layerDownload;
			$scope.clickAffFH(100);
		};

		$scope.selectExposureLayers = function (){
			console.log($scope.resultDownload);
			$scope.resultDownload_data = $scope.resultDownload;
		};


		function openInNewTab(url) {
			var win = window.open(url, '_blank');
			win.focus();
		}

		// Map Layers

		$scope.clickPolygonDrawing = function () {
			if ($scope.checkPolygonDrawing) {
				$scope.checkPolygonDrawing = false;
				$scope.overlays.polygon.setMap(null);
			} else {
				$scope.checkPolygonDrawing = true;
				$scope.overlays.polygon.setMap(map);
			}
		};


		$scope.getTownShipId = function () {
			$scope.closeAlert();
			MapService.getTownShipId($scope.shape)
			.then(function (data) {
				console.log(data);
				loadMap(data.eeMapId, data.eeMapToken, 'township');
				showSuccessAlert('The Township Layer is updated!');
				usSpinnerService.stop('spinner-1');
			}, function (error) {
				showErrorAlert('Something went wrong! Please try again later!');
				console.log(error);
			});
		};

		$scope.clickTSBoundary = function () {
			if ($scope.checkTSBoundary) {
				$scope.checkTSBoundary = false;
				$scope.overlays.township.setOpacity(0);
			} else {
				$scope.checkTSBoundary = true;
				if ($scope.overlays.township) {
					$scope.overlays.township.setOpacity(1);
				} else {
				    usSpinnerService.spin('spinner-1');
					$scope.getTownShipId();
				}
			}
		};


      $scope.getShLocId = function () {
			$scope.closeAlert();
			MapService.getShLocId($scope.shape)
			.then(function (data) {
				console.log(data);
				//check
				loadMap(data.eeMapId, data.eeMapToken, 'shelter');
				showSuccessAlert('The Shelter Location Layer is updated!');
				usSpinnerService.stop('spinner-1');
			}, function (error) {
				showErrorAlert('Something went wrong! Please try again later!');
				console.log(error);
			});
		};

		$scope.clickShLoc = function () {
			if ($scope.checkShLoc) {
				$scope.checkShLoc = false;
				//check
				$scope.overlays.shelter.setOpacity(0);
			} else {
				$scope.checkShLoc = true;
				//check
				if ($scope.overlays.shelter) {
				    //check
					$scope.overlays.shelter.setOpacity(1);
				} else {
				    usSpinnerService.spin('spinner-1');
					$scope.getShLocId();
				}
			}
		};



		$scope.getStateRegionId = function () {
			$scope.closeAlert();
			MapService.getStateRegionId($scope.shape)
			.then(function (data) {
				console.log(data);
				loadMap(data.eeMapId, data.eeMapToken, 'state');
				usSpinnerService.stop('spinner-1');
				showSuccessAlert('The State Layer is updated!');
			}, function (error) {
				showErrorAlert('Something went wrong! Please try again later!');
				console.log(error);
			});
		};

		$scope.clickStateRegion = function () {
			if ($scope.checkStateBoundary) {
				$scope.checkStateBoundary = false;
				$scope.overlays.state.setOpacity(0);
			} else {
				$scope.checkStateBoundary = true;
				if ($scope.overlays.state) {
					$scope.overlays.state.setOpacity(1);
				} else {
				    usSpinnerService.spin('spinner-1');
					$scope.getStateRegionId();
				}
			}
		};

		$scope.getWhLocId = function () {
			$scope.closeAlert();
			MapService.getWhLocId($scope.shape)
			.then(function (data) {
				console.log(data);
				loadMap(data.eeMapId, data.eeMapToken, 'warehouse');
				usSpinnerService.stop('spinner-1');
				showSuccessAlert('The Warehouse Location Layer is updated!');
			}, function (error) {
				showErrorAlert('Something went wrong! Please try again later!');
				console.log(error);
			});
		};

		$scope.clickWhLoc = function () {
			if ($scope.checkWhLoc) {
				$scope.checkWhLoc = false;
				$scope.overlays.warehouse.setOpacity(0);
			} else {
				$scope.checkWhLoc = true;
				if ($scope.overlays.warehouse) {
					$scope.overlays.warehouse.setOpacity(1);
				} else {
				    usSpinnerService.spin('spinner-1');
					$scope.getWhLocId();
				}
			}
		};


		$scope.getWorldPopId = function () {
			$scope.closeAlert();
			MapService.getWorldPopId($scope.shape)
		    .then(function (data) {
				console.log(data);
				loadMap(data.eeMapId, data.eeMapToken, 'worldPop');
				usSpinnerService.stop('spinner-1');
		    	showSuccessAlert('The World Pop Layer is updated!');
		    }, function (error) {
		    	showErrorAlert('Something went wrong! Please try again later!');
		        console.log(error);
		    });
		};

		$scope.clickWorldPop = function () {
			if ($scope.checkWorldPop) {
				$scope.checkWorldPop = false;
				$scope.overlays.worldPop.setOpacity(0);
			} else {
				$scope.checkWorldPop = true;
				if ($scope.overlays.worldPop) {
					$scope.overlays.worldPop.setOpacity(1);
				} else {
					usSpinnerService.spin('spinner-1');
					$scope.getWorldPopId();
				}
			}
		};

		$scope.getWorlPopNumber = function () {
			var _object = $scope.checkBeforeDownload(false, true, false);
			if (_object) {
				MapService.getWorldPopNumber($scope.shape)
				.then(function (data) {
					console.log(data.populationNumber);
				});
			}
		};

		/**
		 * Drawing Tool Manager
		 **/

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
		    drawingManagerOptions.drawingMode = type;
		    drawingManagerOptions[typeOptions] = {
	    	'strokeColor': '#ff0000',
				'strokeWeight': 5,
				'fillColor': 'yellow',
				'fillOpacity': 0,
				'editable': true
		    };

			return drawingManagerOptions;

		};

		$scope.drawShape = function (type) {

			drawingManager.setOptions(getDrawingManagerOptions(type));
			// Loading the drawing Tool in the Map.
			drawingManager.setMap(map);

		};

		$scope.stopDrawing = function () {

			drawingManager.setDrawingMode(null);

		};

		$scope.clearDrawing = function () {
			if ($scope.overlays.polygon) {
				$scope.overlays.polygon.setMap(null);
				$scope.showPolygonDrawing = false;
			}
		};

		var getRectangleArray = function (bounds) {
			var start = bounds.getNorthEast();
			var end = bounds.getSouthWest();
			return [start.lng().toFixed(2), start.lat().toFixed(2), end.lng().toFixed(2), end.lat().toFixed(2)];
		};

		var getPolygonArray = function (pathArray) {
			var geom = [];
			for (var i = 0; i < pathArray.length; i++) {
				var coordinatePair = [pathArray[i].lng().toFixed(2), pathArray[i].lat().toFixed(2)];
				geom.push(coordinatePair);
			}
			return geom;
		};

		var computeRectangleArea = function (bounds) {

			if (!bounds) {
				return 0;
			}

			var sw = bounds.getSouthWest();
			var ne = bounds.getNorthEast();
			var southWest = new google.maps.LatLng(sw.lat(), sw.lng());
			var northEast = new google.maps.LatLng(ne.lat(), ne.lng());
			var southEast = new google.maps.LatLng(sw.lat(), ne.lng());
			var northWest = new google.maps.LatLng(ne.lat(), sw.lng());
			return google.maps.geometry.spherical.computeArea([northEast, northWest, southWest, southEast]) / 1e6;
		};

		$scope.showInfoBox = function() {
        $scope.checkInfoBtn = true;
		};

        // On click event
        google.maps.event.addListener(map, "click", function (e) {
            if ($scope.checkInfoBtn)
            {
            usSpinnerService.spin('spinner-1');
            $scope.checkInfoBtn = false;
			var latLng = e.latLng;
			var lat = e.latLng.lat();
			var lng = e.latLng.lng();
			$scope.ts = null;
			MapService.getExposureDatum(lat, lng)
			.then(function (data) {
				$scope.ts = data;
				usSpinnerService.stop('spinner-1');
				console.log($scope.ts);
			}, function (error) {
				showErrorAlert('Something went wrong! Please try again later!');
				console.log(error);
			});
			var content_info = '<p><b>Information</b></p>'+
			'<div><table class="table table-striped table-bordered">'+
			'<tr>'+
			'<td width="50%"> <b>State/Region:</b></td>'+
			'<td width="50%">[[ts.name]]</td>'+
			'</tr>'+
			'<tr>'+
			'<td width="50%"> <b>District:</b></td>'+
			'<td width="50%">[[ts.state]]</td>'+
			'</tr>'+
			'<tr>'+
			'<td width="50%"> <b>Township:</b></td>'+
			'<td width="50%">[[ts.district]]</td>'+
			'</tr>'+
			'<tr ng-show="analysisPop">'+
			'<td width="50%"><b> Pop affected:</b></td>'+
			'<td width="50%"><p> [[ts.pop]]</p></td>'+
			'</tr>'+
			'<tr>'+
			'<td width="50%"> <b> Hazard level:</b></td>'+
			'<td width="50%">[[ts.hazard]]</td>'+
			'</tr>'+
			'<tr ng-show="analysisWhLoc">'+
			'<td width="50%"><b> Warehouse:</b></td>'+
			'<td width="50%">[[ts.warehouse]]</td>'+
			'</tr>'+
			'<tr ng-show="analysisShLoc">'+
			'<td width="50%"><b>Shelters: </b></td>'+
			'<td width="50%">[[ts.shelter]]</td>'+
			'</tr>'+
			'</table>';
			ngDialog.open({
				template: content_info,
				className: 'ngdialog-theme-default',
				plain: true,
				scope:$scope
			});
			}
        });

		// Overlay Listener
		google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event) {
			// Clear Layer First
			$scope.clearDrawing();
			var overlay = event.overlay;
			$scope.overlays.polygon = overlay;
			$scope.showPolygonDrawing = true;
			$scope.$apply();
			$scope.shape = {};

			var drawingType = event.type;
			$scope.shape.type = drawingType;

			if (drawingType === 'rectangle') {
				$scope.shape.geom = getRectangleArray(overlay.getBounds());
				$scope.drawingArea = computeRectangleArea(overlay.getBounds());
				// Change Event
				google.maps.event.addListener(overlay, 'bounds_changed', function () {
					$scope.shape.geom = getRectangleArray(event.overlay.getBounds());
					$scope.drawingArea = computeRectangleArea(event.overlay.getBounds());
				});
			} else if (drawingType === 'circle') {
				$scope.shape.center = [overlay.getCenter().lng().toFixed(2), overlay.getCenter().lat().toFixed(2)];
				$scope.shape.radius = overlay.getRadius().toFixed(2); // unit: meter
				$scope.drawingArea = Math.PI * Math.pow(overlay.getRadius()/1000, 2);
				// Change event
				google.maps.event.addListener(overlay, 'radius_changed', function () {
					$scope.shape.radius = event.overlay.getRadius().toFixed(2);
					$scope.drawingArea = Math.PI * Math.pow(event.overlay.getRadius()/1000, 2);
				});
				google.maps.event.addListener(overlay, 'center_changed', function () {
					$scope.shape.center = [event.overlay.getCenter().lng().toFixed(2), event.overlay.getCenter().lat().toFixed(2)];
					$scope.drawingArea = Math.PI * Math.pow(event.overlay.getRadius()/1000, 2);
				});
			} else if (drawingType === 'polygon') {
				var path = overlay.getPath();
				$scope.shape.geom = getPolygonArray(path.getArray());
				$scope.drawingArea = google.maps.geometry.spherical.computeArea(path) / 1e6;
				// Change event
				google.maps.event.addListener(path, 'insert_at', function () {
					$scope.shape.geom = getPolygonArray(event.overlay.getPath().getArray());
					$scope.drawingArea = google.maps.geometry.spherical.computeArea(event.overlay.getPath()) / 1e6;
				});
				google.maps.event.addListener(path, 'remove_at', function () {
					$scope.shape.geom = getPolygonArray(event.overlay.getPath().getArray());
					$scope.drawingArea = google.maps.geometry.spherical.computeArea(event.overlay.getPath()) / 1e6;
				});
				google.maps.event.addListener(path, 'set_at', function () {
					$scope.shape.geom = getPolygonArray(event.overlay.getPath().getArray());
					$scope.drawingArea = google.maps.geometry.spherical.computeArea(event.overlay.getPath()) / 1e6;
				});

			}
			$scope.stopDrawing();
		});

		// Map Downloader
		$scope.alertContent = '';

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
		    	window.prompt("Copy to clipboard: Ctrl+C or Command+C");
		  	}
		};

		var datepickerYearOptions = {
			format: 'yyyy',
			autoclose: true,
			startDate: new Date('1984'),
			endDate: new Date('2015'),
			clearBtn: true,
			startView: 'years',
			minViewMode: 'years',
			container: '.datepicker-year-class'
		};

		var datepickerMonthOptions = {
			format: 'MM',
			autoclose: true,
			clearBtn: true,
			startView: 'months',
			minViewMode: 'months',
			maxViewMode: 'months',
			container: '.datepicker-month-class',
			templates: {
				leftArrow: ' ',
			    rightArrow: ' '
			}
		};

		$('#datepicker-year-start').datepicker(datepickerYearOptions);
		$('#datepicker-year-end').datepicker(datepickerYearOptions);
		$('.input-daterange input').each(function() {
		    $(this).datepicker('clearDates');
		});

		$('#datepicker-month-start').datepicker(datepickerMonthOptions);
		$('#datepicker-month-end').datepicker(datepickerMonthOptions);
		$('.input-monthrange input').each(function() {
		    $(this).datepicker('clearDates');
		});

		$('#datepicker-month-start').datepicker()
		.on('hide', function (e) {
			if (e.date && e.date.getMonth() < 2 && $('#datepicker-year-start').val() === '1984') {
				$('#datepicker-month-start').val('March');
			}
		});

		$('#datepicker-month-end').datepicker()
		.on('hide', function (e) {
			if (e.date && e.date.getMonth() > 9 && $('#datepicker-year-end').val() === '2015') {
				$('#datepicker-month-end').val('October');
			}
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
		};


		$scope.checkBeforeDownload = function (checkAreaLimit, needPolygon, needDate) {

			// if (typeof(needPolygon) === 'undefined') needPolygon = true;
			// if (needPolygon){
			// 	if (!$scope.overlays.polygon) {
			// 		showErrorAlert('Please draw a polygon first!');
			// 		return false;
			// 	}
			// }

			// if (typeof(checkAreaLimit) === 'undefined') checkAreaLimit = false;
			// if (checkAreaLimit) {
			// 	if ($scope.drawingArea > AREA_LIMIT) {
			// 		showErrorAlert('The drawn polygon is larger than ' + AREA_LIMIT + ' km2. This exceeds the current limitations for downloading data. Please draw a smaller polygon!');
			// 		return false;
			// 	}
			// }

			if (typeof(needDate) === 'undefined') needDate = true;
			if (needDate) {
				var startYear = $('#datepicker-year-start').val();
				var endYear = $('#datepicker-year-end').val();
				var startMonth,
					endMonth,
					message = '';

				if (!(startYear && endYear)) {
					showErrorAlert('Select the start and end date in order to analyze or download the map data!');
					return false;
				} else {
					if (Number(startYear) > Number(endYear)) {
						showErrorAlert('End year must be greater than start year!');
						return false;
					}
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

					if (Number(startYear) === Number(endYear) && Number(startMonth) >= Number(endMonth)) {
						showErrorAlert('End month must be greater than start month!');
						return false;
					}

					return {
						startYear: startYear,
						endYear: endYear,
						startMonth: startMonth,
						endMonth: endMonth,
						message: message
					};

				}
			}

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

		$scope.saveToDrive = function () {
            var dateObject = $scope.checkBeforeDownload(true);
			// Check if filename is provided, if not use the default one
			// @ToDo: Sanitize input and do proper check of dateobject
			var fileName = $('#gdrive-file-name').val() || '';
			if (dateObject) {
				showInfoAlert(dateObject.message + ' Please wait while I prepare the download link for you. This might take a while!');
				MapService.saveToDrive(dateObject.startYear, dateObject.endYear, dateObject.startMonth, dateObject.endMonth, $scope.timePeriodOption.value, $scope.shape, fileName)
			    .then(function (data) {
			    	if (data.error) {
				    	showErrorAlert(data.error + ' This is likely error in our end. As a workaround, please try to clear cookie, then hard refresh and load again. If the problem exists, please contact us!');
				        console.log(data.error);
			    	} else {
						showInfoAlert(data.info);
				    	//$scope.downloadURL = data.driveLink;
				    	//$scope.showDownloadUrl();
				    	$scope.hideGDriveFileName();
				    	$('#gdrive-file-name').val('');
			    	}
			    }, function (error) {
			    	showErrorAlert(error + ' This is likely error in our end. As a workaround, please try to clear cookie, then hard refresh and load again. If the problem exists, please contact us!');
			        console.log(error);
			    });
			}
		};

		$scope.showInfoTooltip = function($event, $index) {
			$tooltip(angular.element($event.target), {title: 'Information Icon: Click here then click on the map to see the individual information of the result'});
		};

		$scope.clickResultDownload = function(){
			console.log('result download');
		};



		// $scope.clickProcess = function(){
		// 	usSpinnerService.spin('spinner-2');
		// 	if($scope.resultDisplay){
		// 		console.log('ClickProcess resultDisplay true');
		// 		execProcessTable();
		// 	}
		// 	if($scope.resultDownload){
		// 		console.log('ClickProcess resultDownload true');
		// 		execProcessDownload();
		// 	}
		// };


	});

})();
