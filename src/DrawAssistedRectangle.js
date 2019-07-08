
const doubleClickZoom = {
  enable: ctx => {
    setTimeout(() => {
      // First check we've got a map and some context.
      if (
        !ctx.map ||
        !ctx.map.doubleClickZoom ||
        !ctx._ctx ||
        !ctx._ctx.store ||
        !ctx._ctx.store.getInitialConfigValue
      )
        return;

      if (!ctx._ctx.store.getInitialConfigValue("doubleClickZoom")) return;
      ctx.map.doubleClickZoom.enable();
    }, 0);
  },
  disable(ctx) {
    setTimeout(() => {
      if (!ctx.map || !ctx.map.doubleClickZoom) return;

      ctx.map.doubleClickZoom.disable();
    }, 0);
  }
};

const DrawAssistedRectangle = {

  onSetup: function (opts) {
    const rectangle = this.newFeature({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          []
        ]
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
      rectangle,
      currentVertexPosition: 0
    };
  },

  onTap: function (state, e) {

    this.onClick(state, e);
  },

  onClick: function (state, e) {

    if (state.currentVertexPosition === 2) {

      const getpXY3 = this.calculatepXY3(state, e, false);

      if (getpXY3) {
        state.rectangle.updateCoordinate(`0.${state.currentVertexPosition + 1}`, getpXY3[0], getpXY3[1]);
      }
      this.updateUIClasses({
        mouse: "pointer"
      });
      return this.changeMode("simple_select", {
        featuresId: state.rectangle.id
      });


    } else {

      state.rectangle.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);
      state.currentVertexPosition++;
      state.rectangle.updateCoordinate(`0.${state.currentVertexPosition}`, e.lngLat.lng, e.lngLat.lat);

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

  distance: function (lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return Math.round(d * 1000);

  },

  isEqualDiagonal: function (pXY0, pXY1, pXY2, pXY3) {

    const diagonalA = (this.distance(pXY0[1], pXY0[0], pXY2[1], pXY2[0])).toFixed(2);
    const diagonalB = (this.distance(pXY3[1], pXY3[0], pXY1[1], pXY1[0])).toFixed(2);

    return diagonalA === diagonalB ? true : false;


  },


  deegrees2meters(px) {

    //gist from https://gist.github.com/springmeyer/871897
    var x = px[0] * 20037508.34 / 180;
    var y = Math.log(Math.tan((90 + px[1]) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;
    return [x, y]

  },

  meters2degress(px) {
    //gist from https://gist.github.com/springmeyer/871897
    var lon = px[0] * 180 / 20037508.34;
    var lat = Math.atan(Math.exp(px[1] * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
    return [lon, lat]
  },

  calculatepXY3: function (state, e, tmp) {

    var pXY0 = state.rectangle.getCoordinate("0.0");
    var pXY0_3857 = this.deegrees2meters(pXY0);
    var pXY1 = state.rectangle.getCoordinate("0.1");
    var pXY1_3857 = this.deegrees2meters(pXY1);
    var pXY2_3857 = this.deegrees2meters([e.lngLat.lng, e.lngLat.lat]);
    var mouse_3857 = this.deegrees2meters([e.lngLat.lng, e.lngLat.lat]);

    if (pXY0_3857[0] === pXY1_3857[0]) {
      pXY2_3857 = [mouse_3857[0], pXY1_3857[1]];
    } else if (pXY0_3857[1] === pXY1_3857[1]) {
      pXY2_3857 = [pXY1_3857[0], mouse_3857[1]];

    } else {

      var vector1_3857 = (pXY1_3857[1] - pXY0_3857[1]) / (pXY1_3857[0] - pXY0_3857[0]);
      var vector2_3857 = -1.0 / vector1_3857;

      if (Math.abs(vector2_3857) < 1) {
        pXY2_3857[1] = vector2_3857 * (mouse_3857[0] - pXY1_3857[0]) + pXY1_3857[1];
      }
      else {
        pXY2_3857[0] = pXY1_3857[0] + (pXY2_3857[1] - pXY1_3857[1]) / vector2_3857;
      }


    }

    var vector_3857 = [pXY1_3857[0] - pXY0_3857[0], pXY1_3857[1] - pXY0_3857[1]];
    var pXY3_3857 = [pXY2_3857[0] - vector_3857[0], pXY2_3857[1] - vector_3857[1]];
    var pXY2G = this.meters2degress(pXY2_3857);
    var pXY3G = this.meters2degress(pXY3_3857);
    state.rectangle.updateCoordinate("0.2", pXY2G[0], pXY2G[1]);
    state.rectangle.updateCoordinate("0.3", pXY3G[0], pXY3G[1]);


    return pXY3G;



  },


  onKeyUp: function (state, e) {
    if (e.keyCode === 27) return this.changeMode("simple_select");
  },
  onStop: function (state) {
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
  toDisplayFeatures: function (state, geojson, display) {
    const isActivePolygon = geojson.properties.id === state.rectangle.id;
    geojson.properties.active = isActivePolygon ? "true" : "false";
    if (!isActivePolygon) return display(geojson);

    const coordinateCount = geojson.geometry.coordinates[0].length;
    if (coordinateCount < 3) {
      return;
    }
    if (coordinateCount <= 4) {

      const lineCoordinates = [
        [geojson.geometry.coordinates[0][0][0], geojson.geometry.coordinates[0][0][1]],
        [geojson.geometry.coordinates[0][1][0], geojson.geometry.coordinates[0][1][1]]
      ];

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
  onTrash: function (state) {
    this.deleteFeature([state.rectangle.id], {
      silent: true
    });
    this.changeMode("simple_select");
  }
};

export default DrawAssistedRectangle;