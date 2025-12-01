import * as L from 'leaflet';

declare module 'leaflet' {
  /**
   * Heatmap data point: [latitude, longitude, intensity?]
   * If intensity is omitted, it defaults to 1.0
   */
  type HeatLatLngTuple = [number, number, number?];

  interface HeatLayerOptions {
    /**
     * Minimum opacity the heat will start at
     * @default 0.05
     */
    minOpacity?: number;

    /**
     * Zoom level where the points reach maximum intensity
     * @default 18
     */
    maxZoom?: number;

    /**
     * Maximum point intensity
     * @default 1.0
     */
    max?: number;

    /**
     * Radius of each "point" of the heatmap
     * @default 25
     */
    radius?: number;

    /**
     * Amount of blur
     * @default 15
     */
    blur?: number;

    /**
     * Color gradient config, e.g. {0.4: 'blue', 0.65: 'lime', 1: 'red'}
     */
    gradient?: { [key: number]: string };
  }

  interface HeatLayer extends L.Layer {
    /**
     * Sets new heatmap data and redraws it
     */
    setLatLngs(latlngs: HeatLatLngTuple[]): this;

    /**
     * Adds a new point to the heatmap and redraws it
     */
    addLatLng(latlng: HeatLatLngTuple): this;

    /**
     * Sets new heatmap options and redraws it
     */
    setOptions(options: HeatLayerOptions): this;

    /**
     * Redraws the heatmap
     */
    redraw(): this;
  }

  /**
   * Creates a heatmap layer given an array of points
   */
  function heatLayer(
    latlngs: HeatLatLngTuple[],
    options?: HeatLayerOptions
  ): HeatLayer;
}

// Also export as module
declare module 'leaflet.heat' {
  // This module augments L, no exports needed
}

