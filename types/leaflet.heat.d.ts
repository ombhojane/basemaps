import 'leaflet';

declare module 'leaflet' {
  export type HeatLatLngTuple = [number, number, number];

  export interface HeatMapOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: { [key: number]: string };
  }

  export interface HeatLayer extends Layer {
    setOptions(options: HeatMapOptions): this;
    addLatLng(latlng: LatLng | HeatLatLngTuple): this;
    setLatLngs(latlngs: Array<LatLng | HeatLatLngTuple>): this;
    redraw(): this;
  }

  export function heatLayer(
    latlngs: Array<LatLng | HeatLatLngTuple>,
    options?: HeatMapOptions
  ): HeatLayer;
}
