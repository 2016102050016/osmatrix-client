var Controller = (function (w) {
    'use strict';
    
    var $ = w.jQuery,
        ui = w.Ui,
        perma = w.Permalink,
        geolocator = w.Geolocator,
        geocoder = w.Geocoder,
        osmatrix = w.OSMatrix,
        url = w.document.URL,
        map;
    
    /* *********************************************************************
	 * GEOLOCATION
	 * *********************************************************************/
    
    /**
	 * [handleGeolocateSuccess description]
	 * @param  {[type]} position [description]
	 * @return {[type]}          [description]
	 */
	function handleGeolocateSuccess(position) {
		map.moveTo([position.coords.latitude, position.coords.longitude]);
		ui.stopGeolocation();
	}

	/**
	 * [handleGeolocateError description]
	 * @param  {[type]} error [description]
	 * @return {[type]}       [description]
	 */
	function handleGeolocateError(error) {
		switch (error.code) {
        case error.UNKNOWN_ERROR:
            ui.stopGeolocation('The location acquisition process failed');
            break;
        case error.PERMISSION_DENIED:
            ui.deactivateGeolocation();
            break;
        case error.POSITION_UNAVAILABLE:
            ui.stopGeolocation('The position of the device could not be determined. One or more of the location providers used in the location acquisition process reported an internal error that caused the process to fail entirely.');
            break;
        case error.TIMEOUT:
            ui.stopGeolocation('The location acquisition timed out');
            break;
        }
	}
    
    /**
	 * [handleGeolocateNoSupport description]
	 */
	function handleGeolocateNoSupport() {
		ui.deactivateGeolocation('Geolocation API is not supported by your browser.');
	}
    
    /* *********************************************************************
	 * GEOCODER
	 * *********************************************************************/
    
    function handleGeolocationRequest() {
        geolocator.locate(handleGeolocateSuccess, handleGeolocateError, handleGeolocateNoSupport);
    }
    
    function handleGeocodeRequest(address) {
        geocoder.find(address, handleGeocodeResults);
    }
    
    function handleGeocodeLink(link) {
        var permaLinkState = perma.parse(link);
        map.moveTo([permaLinkState.lat, permaLinkState.lng]);
    }
    
    function handleGeocodeResults(results) {
        ui.updateGeocodeResultList(url, results);
	}
    
    /* *********************************************************************
	 * MAP
	 * *********************************************************************/
    
    function handleLayerUpdate(layerInfo) {
        osmatrix.getLegend(layerInfo.mode, layerInfo.layer, handleLegend);
        map.updateMatrixLayer(layerInfo, osmatrix.getLayerUrl(layerInfo.mode, layerInfo.layer, layerInfo.times));
    }
    
    function handleMapLoadStart() {
		ui.setLayerLoadingState(true);
	}

	function handleMapLoadEnd() {
        ui.setLayerLoadingState(false);
	}

	function handleMapChanged(mapState) {
		perma.update(mapState.mode, mapState.layer, mapState.times, mapState.zoom, mapState.lon, mapState.lat);
	}
    
    function handleUserMapClick(latlng) {
        var layer = perma.parse(url).layer;
        osmatrix.getFeatureInfoFromPoint(layer, latlng, handleFeatureInfoResult);
    }
    
    /* *********************************************************************
	 * OSMATRIX CONTROLLER
	 * *********************************************************************/
    
    function handleMatrixCapabilities(capabilities) {
        ui.initializeLayerSwitcher(capabilities);
        initializeTheMap();
    }
    
    function handleLegend(results) {
        ui.updateLegend(results);
    }
    
    function initializeTheMatrix() {
        osmatrix.getCapabilities(handleMatrixCapabilities);
    }
    
	/**
	 * [setInitialMapLocation description]
	 */
	function initializeTheMap() {
		var permaLink = perma.parse(url);
		if (permaLink) {map.moveTo([permaLink.lat, permaLink.lng], permaLink.zoom); }
            else {handleGeolocationRequest(); }
        
        ui.setLayerSwitcherToMode(permaLink);
    }
    
    function handleFeatureInfoResult(result) {
        map.updateFeatureInfoLayer(result);
    }
    
    
    /**
	 * [initialize description]
	 */
	function initialize() {
		map = new Map('map');

		map.register('layer:loadStart', handleMapLoadStart);
		map.register('layer:loadEnd', handleMapLoadEnd);
		map.register('map:changed', handleMapChanged);
        map.register('user:click', handleUserMapClick);
        
        ui.register('ui:geolocationRequest', handleGeolocationRequest);
        ui.register('ui:geocodeRequest', handleGeocodeRequest);
        ui.register('ui:geocodeLinkClick', handleGeocodeLink);
        ui.register('ui:layerUpdate', handleLayerUpdate);
        
		initializeTheMatrix();
	}
    

	function Controller() {}
	Controller.prototype.initialize = initialize;
	return new Controller();
}(window));

window.onload = Controller.initialize;