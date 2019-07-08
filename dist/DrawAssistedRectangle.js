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

var DrawAssistedRectangle = {

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

      var getpXY3 = this.calculatepXY3(state, e, false);

      if (getpXY3) {
        state.rectangle.updateCoordinate("0." + (state.currentVertexPosition + 1), getpXY3[0], getpXY3[1]);
      }
      this.updateUIClasses({
        mouse: "pointer"
      });
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

    if (state.currentVertexPosition === 2) {
      var getpXY3 = this.calculatepXY3(state, e, true);
      if (getpXY3) {
        state.rectangle.updateCoordinate("0." + (state.currentVertexPosition + 1), getpXY3[0], getpXY3[1]);
      }
    }
  },

  distance: function distance(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return Math.round(d * 1000);
  },

  isEqualDiagonal: function isEqualDiagonal(pXY0, pXY1, pXY2, pXY3) {

    var diagonalA = this.distance(pXY0[1], pXY0[0], pXY2[1], pXY2[0]).toFixed(2);
    var diagonalB = this.distance(pXY3[1], pXY3[0], pXY1[1], pXY1[0]).toFixed(2);

    return diagonalA === diagonalB ? true : false;
  },

  deegrees2meters: function deegrees2meters(px) {

    // return px;
    var x = px[0] * 20037508.34 / 180;
    var y = Math.log(Math.tan((90 + px[1]) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;
    return [x, y];
  },
  meters2degress: function meters2degress(px) {

    // return px;
    var lon = px[0] * 180 / 20037508.34;
    var lat = Math.atan(Math.exp(px[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
    return [lon, lat];
  },


  calculatepXY3: function calculatepXY3(state, e, tmp) {

    var pXY0 = state.rectangle.getCoordinate("0.0");
    var pXY0_3857 = this.deegrees2meters(pXY0);
    var pXY1 = state.rectangle.getCoordinate("0.1");
    var pXY1_3857 = this.deegrees2meters(pXY1);
    // var pXY2 = tmp ? [e.lngLat.lng, e.lngLat.lat] : state.rectangle.getCoordinate("0.2");

    var pXY2_3857 = this.deegrees2meters([e.lngLat.lng, e.lngLat.lat]);

    var mouse_3857 = this.deegrees2meters([e.lngLat.lng, e.lngLat.lat]);

    if (pXY0_3857[0] === pXY1_3857[0]) {

      // pXY2 = [e.lngLat.lng, pXY1[1]];

      pXY2_3857 = [mouse_3857[0], pXY1_3857[1]];
    } else if (pXY0_3857[1] === pXY1_3857[1]) {

      //pXY2 = [pXY1[0], e.lngLat.lat];

      pXY2_3857 = [pXY1_3857[0], mouse_3857[1]];
    } else {

      //var vector1 = (pXY1[1] - pXY0[1]) / (pXY1[0] - pXY0[0]);
      var vector1_3857 = (pXY1_3857[1] - pXY0_3857[1]) / (pXY1_3857[0] - pXY0_3857[0]);

      //var vector2 = -1.0 / vector1;

      var vector2_3857 = -1.0 / vector1_3857;

      //pXY2[1] = vector2 * (e.lngLat.lng - pXY1[0]) + pXY1[1];


      if (Math.abs(vector2_3857) < 1) {
        pXY2_3857[1] = vector2_3857 * (mouse_3857[0] - pXY1_3857[0]) + pXY1_3857[1];
      } else {
        pXY2_3857[0] = pXY1_3857[0] + (pXY2_3857[1] - pXY1_3857[1]) / vector2_3857;
        //vector2_3857 *         (mouse_3857[0] - pXY1_3857[0]) + pXY1_3857[1];
      }
    }

    //var vector = [pXY1[0] - pXY0[0], pXY1[1] - pXY0[1]];
    var vector_3857 = [pXY1_3857[0] - pXY0_3857[0], pXY1_3857[1] - pXY0_3857[1]];

    //var pXY3 = [pXY2[0] - vector[0], pXY2[1] - vector[1]];
    var pXY3_3857 = [pXY2_3857[0] - vector_3857[0], pXY2_3857[1] - vector_3857[1]];

    var pXY2G = this.meters2degress(pXY2_3857);
    var pXY3G = this.meters2degress(pXY3_3857);

    state.rectangle.updateCoordinate("0.2", pXY2G[0], pXY2G[1]);
    state.rectangle.updateCoordinate("0.3", pXY3G[0], pXY3G[1]);

    // state.rectangle.updateCoordinate("0.2", pXY2[0], pXY2[1]);
    // state.rectangle.updateCoordinate("0.3", pXY3[0], pXY3[1]);

    //return pXY3;
    return pXY3G;

    /*
    const xA = pXY1[0] - pXY0[0];
    const yA = pXY1[1] - pXY0[1];
      if (!this.isEqualDiagonal(pXY0, pXY1, pXY2, pXY3)) {
      pXY3 = [pXY2[0] - xA, pXY2[1] - yA];
          return !tmp ? pXY3 : null;
        } else {
        state.rectangle.updateCoordinate("0.2", pXY2[0], pXY2[1]);
      pXY3 = [pXY2[0] - xA, pXY2[1] - yA]
      state.rectangle.updateCoordinate("0.3", pXY3[0], pXY3[1]);
        return pXY3;
    }
    */
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

exports.default = DrawAssistedRectangle;