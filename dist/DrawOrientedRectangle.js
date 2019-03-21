"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var doubleClickZoom = {
  enable: function enable(ctx) {
    setTimeout(function () {
      // First check we've got a map and some context.
      if (!ctx.map || !ctx.map.doubleClickZoom || !ctx._ctx || !ctx._ctx.store || !ctx._ctx.store.getInitialConfigValue) return;

      if (!ctx._ctx.store.getInitialConfigValue("doubleClickZoom")) return;
      ctx.map.doubleClickZoom.enable();
    }, 0);
  },
  disable: function disable(ctx) {
    setTimeout(function () {
      if (!ctx.map || !ctx.map.doubleClickZoom) return;

      ctx.map.doubleClickZoom.disable();
    }, 0);
  }
};

var DrawOrientedRectangle = {

  onSetup: function onSetup(opts) {
    var rectangle = this.newFeature({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [[]]
      }
    });
    this.addFeature(rectangle);

    this.clearSelectedFeatures();
    doubleClickZoom.disable(this);
    this.updateUIClasses({
      mouse: "add"
    });
    this.setActionableState({
      trash: true
    });
    return {
      rectangle: rectangle,
      currentVertexPosition: 0
    };
  },

  onTap: function onTap(state, e) {

    this.onClick(state, e);
  },

  onClick: function onClick(state, e) {

    if (state.currentVertexPosition === 2) {

      var getLastPoint = this.calculateFourthPoint(state, e);

      state.rectangle.updateCoordinate("0." + (state.currentVertexPosition + 1), getLastPoint[0], getLastPoint[1]);

      console.info(getLastPoint);

      this.updateUIClasses({
        mouse: "pointer"
      });
      state.endPoint = [e.lngLat.lng, e.lngLat.lat];
      return this.changeMode("simple_select", {
        featuresId: state.rectangle.id
      });
    } else {

      state.rectangle.updateCoordinate("0." + state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
      state.currentVertexPosition++;
      state.rectangle.updateCoordinate("0." + state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
    }
  },
  onMouseMove: function onMouseMove(state, e) {

    state.rectangle.updateCoordinate("0." + state.currentVertexPosition, e.lngLat.lng, e.lngLat.lat);
  },

  calculateFourthPoint: function calculateFourthPoint(state, e) {

    var zeroPoint = state.rectangle.getCoordinate("0.0");
    var firstPoint = state.rectangle.getCoordinate("0.1");
    var secodPoint = state.rectangle.getCoordinate("0.2");
    var vector = [firstPoint[0] - zeroPoint[0], firstPoint[1] - zeroPoint[1]];
    var fourtPoint = [secodPoint[0] - vector[0], secodPoint[1] - vector[1]];

    return fourtPoint;
  },

  onKeyUp: function onKeyUp(state, e) {
    if (e.keyCode === 27) return this.changeMode("simple_select");
  },
  onStop: function onStop(state) {
    doubleClickZoom.enable(this);
    this.updateUIClasses({
      mouse: "none"
    });
    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(state.rectangle.id) === undefined) return;

    //remove last added coordinate
    state.rectangle.removeCoordinate("0.4");
    if (state.rectangle.isValid()) {
      this.map.fire("draw.create", {
        features: [state.rectangle.toGeoJSON()]
      });
    } else {
      this.deleteFeature([state.rectangle.id], {
        silent: true
      });
      this.changeMode("simple_select", {}, {
        silent: true
      });
    }
  },
  toDisplayFeatures: function toDisplayFeatures(state, geojson, display) {
    var isActivePolygon = geojson.properties.id === state.rectangle.id;
    geojson.properties.active = isActivePolygon ? "true" : "false";
    if (!isActivePolygon) return display(geojson);

    var coordinateCount = geojson.geometry.coordinates[0].length;
    if (coordinateCount < 3) {
      return;
    }
    if (coordinateCount <= 4) {

      var lineCoordinates = [[geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]], [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]];

      display({
        type: "Feature",
        properties: geojson.properties,
        geometry: {
          coordinates: lineCoordinates,
          type: "LineString"
        }
      });
      if (coordinateCount === 3) {
        return;
      }
    }

    return display(geojson);
  },
  onTrash: function onTrash(state) {
    this.deleteFeature([state.rectangle.id], {
      silent: true
    });
    this.changeMode("simple_select");
  }
};

exports.default = DrawOrientedRectangle;