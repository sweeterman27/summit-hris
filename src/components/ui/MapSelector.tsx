'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';

interface MapSelectorProps {
  lat: number;
  lng: number;
  radius: number;
  onChange: (lat: number, lng: number) => void;
  onRadiusChange?: (radius: number) => void;
  readOnly?: boolean;
  isAdmin?: boolean;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function MapSelector({ lat, lng, radius, onChange, onRadiusChange, readOnly, isAdmin }: MapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [circle, setCircle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [searching, setSearching] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!apiKey) {
      setLoading(false);
      return;
    }

    if (!window.google) {
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.addEventListener('load', initMap);
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current) return;

      const position = { lat: lat || 14.5995, lng: lng || 120.9842 };
      
      const newMap = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 15,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
          },
        ],
        disableDefaultUI: true,
        zoomControl: true,
      });

      const newMarker = new window.google.maps.Marker({
        position,
        map: newMap,
        draggable: !readOnly,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 5,
          fillColor: "#d4af37",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
        },
      });

      const newCircle = new window.google.maps.Circle({
        map: newMap,
        radius: radius || 100,
        fillColor: "#d4af37",
        fillOpacity: 0.1,
        strokeColor: "#d4af37",
        strokeOpacity: 0.5,
        strokeWeight: 1,
        center: position,
      });

      newMarker.addListener('dragend', () => {
        const pos = newMarker.getPosition();
        const newLat = pos.lat();
        const newLng = pos.lng();
        newCircle.setCenter({ lat: newLat, lng: newLng });
        onChange(newLat, newLng);
      });

      if (!readOnly) {
        newMap.addListener('click', (e: any) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          newMarker.setPosition({ lat: newLat, lng: newLng });
          newCircle.setCenter({ lat: newLat, lng: newLng });
          onChange(newLat, newLng);
        });
      }

      setMap(newMap);
      setMarker(newMarker);
      setCircle(newCircle);
      setLoading(false);
    }
  }, [apiKey]);

  // Update circle when radius changes
  useEffect(() => {
    if (circle) {
      circle.setRadius(Number(radius));
    }
  }, [radius, circle]);

  const handleGeocode = async () => {
    if (!address || !window.google) return;
    setSearching(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results: any, status: any) => {
      setSearching(false);
      if (status === 'OK' && results[0]) {
        const pos = results[0].geometry.location;
        map.setCenter(pos);
        marker.setPosition(pos);
        circle.setCenter(pos);
        onChange(pos.lat(), pos.lng());
      }
    });
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setSearching(true);
      navigator.geolocation.getCurrentPosition((position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        map.setCenter(pos);
        marker.setPosition(pos);
        circle.setCenter(pos);
        onChange(pos.lat(), pos.lng());
        setSearching(false);
      });
    }
  };

  if (!apiKey) {
    return (
      <div className="w-full h-64 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="text-brand-gold/40 mb-4" size={32} />
        <p className="text-xs font-black uppercase tracking-widest text-white/40">Maps Protocol Offline</p>
        <p className="text-[10px] text-white/20 mt-2">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing from environment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              placeholder="Search home address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGeocode()}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white outline-none focus:border-brand-gold/50"
            />
          </div>
          <button 
            type="button"
            onClick={handleGeocode}
            className="px-4 bg-brand-gold text-brand-obsidian rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-colors"
          >
            {searching ? <Loader2 className="animate-spin" size={16} /> : 'Search'}
          </button>
          <button 
            type="button"
            onClick={handleLocateMe}
            className="p-3 bg-white/5 border border-white/10 text-brand-gold rounded-xl hover:bg-white/10 transition-colors"
            title="Locate Me"
          >
            <Navigation size={18} />
          </button>
        </div>
      )}

      <div className="relative h-64 w-full rounded-3xl border border-white/10 overflow-hidden bg-brand-obsidian">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-obsidian/50 z-10 backdrop-blur-sm">
             <Loader2 className="animate-spin text-brand-gold" size={32} />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
        
        {isAdmin && onRadiusChange && (
          <div className="absolute bottom-4 left-4 right-4 bg-brand-obsidian/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold shrink-0">Radius: {radius}m</span>
            <input 
              type="range"
              min="50"
              max="1000"
              step="50"
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="flex-1 accent-brand-gold h-1"
            />
          </div>
        )}
      </div>

      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/20 px-2">
        <span>Lat: {lat?.toFixed(6) || 'N/A'}</span>
        <span>Lng: {lng?.toFixed(6) || 'N/A'}</span>
        {!readOnly && <span>Click map or drag marker to set home</span>}
      </div>
    </div>
  );
}

function AlertCircle({ size, className }: { size: number, className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
