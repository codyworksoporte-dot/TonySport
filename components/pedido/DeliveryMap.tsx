'use client';
import {useEffect, useRef, useState} from 'react';
import type {Map as LeafletMap} from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function DeliveryMap({latitude, longitude, onChange}: {latitude?: number | null; longitude?: number | null; onChange: (lat: number, lng: number) => void}) {
  const container = useRef<HTMLDivElement>(null), map = useRef<LeafletMap | null>(null), change = useRef(onChange);
  const [failure, setFailure] = useState('');
  change.current = onChange;
  useEffect(() => {
    let disposed = false;
    import('leaflet').then(L => {
      if (disposed || !container.current) return;
      const initial: [number, number] = [latitude ?? 13.6929, longitude ?? -89.2182];
      const instance = L.map(container.current, {zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false, scrollWheelZoom: false}).setView(initial, 13);
      map.current = instance;
      const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(instance);
      tile.on('tileerror', () => setFailure('No pudimos cargar el mapa. Puedes escribir la dirección y las coordenadas.'));
      const marker = L.circleMarker(initial, {radius: 10, color: '#133925', fillColor: '#bded64', fillOpacity: 1}).addTo(instance);
      instance.on('click', event => {marker.setLatLng(event.latlng); change.current(event.latlng.lat, event.latlng.lng);});
      instance.on('tony-location', () => {const current = container.current?.dataset; if (current?.lat && current?.lng) {const point: [number, number] = [Number(current.lat), Number(current.lng)]; marker.setLatLng(point); instance.setView(point, 15);}});
    }).catch(() => setFailure('No pudimos abrir el mapa. Completa la dirección para continuar.'));
    return () => {disposed = true; map.current?.remove(); map.current = null;};
    // The map mounts once; subsequent coordinate changes use its public event API.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {map.current?.fire('tony-location');}, [latitude, longitude]);
  return <div className="pedido-map-wrap"><div className="pedido-map" ref={container} data-lat={latitude} data-lng={longitude} aria-label="Mapa de entrega. Selecciona la ubicación con un toque; también puedes escribir las coordenadas debajo."/>{failure && <p role="status">{failure}</p>}<p>Toca tu ubicación en el mapa. Para usar teclado, escribe las coordenadas debajo.</p></div>;
}
