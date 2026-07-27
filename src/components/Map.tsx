import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "@tanstack/react-router";
import "leaflet/dist/leaflet.css";

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function Map({ userLoc, filtered }: { userLoc: any, filtered: any[] }) {
  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    });
  }, []);

  return (
    <MapContainer
      center={userLoc ? [userLoc.lat, userLoc.lng] : [20, 0]}
      zoom={userLoc ? 10 : 2}
      scrollWheelZoom={false}
      className="h-full w-full z-0"
    >
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLoc && <MapUpdater center={[userLoc.lat, userLoc.lng]} />}
      {filtered.map((s) => (
        s.latitude && s.longitude ? (
          <Marker key={s.id} position={[s.latitude, s.longitude]}>
            <Popup>
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.city}, {s.country}</div>
              <Link to="/studios/$id" params={{ id: s.id }} className="mt-2 block text-xs text-secondary hover:underline">
                View studio
              </Link>
            </Popup>
          </Marker>
        ) : null
      ))}
    </MapContainer>
  );
}
