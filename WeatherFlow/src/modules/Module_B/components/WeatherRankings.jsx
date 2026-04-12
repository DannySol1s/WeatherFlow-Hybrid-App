import { useState, useEffect, useCallback, useMemo } from 'react';
import { Thermometer, Wind, Droplets, Cloud, ChevronUp, ChevronDown, Loader2, Globe, MapPin, Search, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CountrySearch from './CountrySearch';
import { WORLD_CAPITALS } from '../utils/worldCapitals';
import { fetchNearby, fetchBulkWeather } from '../../../lib/weatherApi';

// Arreglo temporal de iconos por defecto de Leaflet para React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icono personalizado para el usuario (Neón Púrpura)
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/2.0.0/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Utilidad matemática: Fórmula del semiverseno (Haversine) para calcular distancias en metros
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; 
};

// Componente utilitario para auto-ajustar la vista del mapa
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

const GEO_API_URL = 'https://countriesnow.space/api/v0.1/countries/states';

export default function WeatherRankings() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [category, setCategory] = useState('temp'); // temp, wind, humidity, sky
  const [subCategory, setSubCategory] = useState('high'); // high, low
  const [mode, setMode] = useState('global'); // global, country, local
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [myLocation, setMyLocation] = useState(null); // Almacena coordenandas del usuario

  // Extrae y calcula el radio dinámico para el mapa (Distancia máxima)
  const maxSearchRadius = useMemo(() => {
    if (mode !== 'local' || !myLocation || weatherData.length === 0) return 0;
    
    let maxDist = 0;
    weatherData.forEach(city => {
      if (city.lat && city.lon) {
        const dist = calculateDistance(myLocation.lat, myLocation.lon, city.lat, city.lon);
        if (dist > maxDist) maxDist = dist;
      }
    });
    
    // Le agregamos un pequeño margen del 10% para que el círculo no abrace exactamente el límite
    return maxDist * 1.10; 
  }, [weatherData, mode, myLocation]);

  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización.");
      return;
    }

    setMode('local');
    setIsLocating(true);
    setLoading(true);
    setWeatherData([]);
    setSelectedCountry(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setMyLocation({ lat: latitude, lon: longitude });

          // Pide hasta 15 localidades cercanas via Edge Function (sin exponer API key)
          const data = await fetchNearby(latitude, longitude, 15);

          if (data.cod === "200" && data.list) {
            const mappedData = data.list.map((city, index) => ({
              id: city.id || Math.random(),
              name: city.name,
              country: city.sys?.country || '',
              temp: city.main?.temp || 0,
              windSpeed: city.wind?.speed || 0,
              humidity: city.main?.humidity || 0,
              clouds: city.clouds?.all || 0,
              description: city.weather?.[0]?.description || '',
              lat: city.coord?.lat,
              lon: city.coord?.lon,
              originalIndex: index
            }));

            // Filtramos duplicados por nombre si existieran
            const uniqueData = Array.from(new Map(mappedData.map(item => [item.name, item])).values());
            setWeatherData(uniqueData);
          } else {
            setWeatherData([]);
          }
        } catch (error) {
          console.error("Error obteniendo ubicación local:", error);
        } finally {
          setIsLocating(false);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error de geolocalización:", error);
        alert("No pudimos acceder a tu ubicación. Verifica los permisos de tu navegador o dispositivo.");
        setIsLocating(false);
        setLoading(false);
      }
    );
  };

  const fetchAllWeatherData = useCallback(async (citiesToFetch) => {
    if (!citiesToFetch || citiesToFetch.length === 0) {
      setWeatherData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let allProcessedData = [];
    const CHUNK_SIZE = 20; // Enviamos lotes de 20 a la Edge Function
    try {
      for (let i = 0; i < citiesToFetch.length; i += CHUNK_SIZE) {
        const chunk = citiesToFetch.slice(i, i + CHUNK_SIZE);

        setLoadingProgress({
          current: Math.min(i + CHUNK_SIZE, citiesToFetch.length),
          total: citiesToFetch.length
        });

        // Una sola llamada a la Edge Function por lote (API key segura en el servidor)
        const results = await fetchBulkWeather(chunk);

        // Transformación y filtrado inmediato
        const chunkProcessed = (results || [])
          .filter(data => data && data.cod === 200)
          .map(city => ({
            id: city.id || Math.random(),
            name: city.name || city._queryCity,
            displayCountry: city._displayCountry,
            country: city.sys?.country || '',
            temp: city.main?.temp || 0,
            windSpeed: city.wind?.speed || 0,
            humidity: city.main?.humidity || 0,
            clouds: city.clouds?.all || 0,
            description: city.weather?.[0]?.description || ''
          }));

        allProcessedData = [...allProcessedData, ...chunkProcessed];
      }

      setWeatherData(allProcessedData);
    } catch (error) {
      console.error("Error fetching massive ranking data:", error);
    } finally {
      setLoading(false);
      setLoadingProgress({ current: 0, total: 0 });
    }
  }, []);

  const fetchStatesByCountry = async (countryName) => {
    setGeoLoading(true);
    try {
      const response = await fetch(GEO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName })
      });
      const result = await response.json();
      
      if (!result.error && result.data && result.data.states) {
        // Extraemos solo los nombres de los estados
        return result.data.states.map(state => state.name);
      }
      return [];
    } catch (error) {
      console.error("Error fetching country states:", error);
      return [];
    } finally {
      setGeoLoading(false);
    }
  };

  // Efecto que reacciona al cambio de modo o país seleccionado
  useEffect(() => {
    const loadData = async () => {
      if (mode === 'global') {
        fetchAllWeatherData(WORLD_CAPITALS);
      } else if (mode === 'country' && selectedCountry) {
        const countryStates = await fetchStatesByCountry(selectedCountry.name);
        fetchAllWeatherData(countryStates);
      } else if (mode !== 'local') {
        setWeatherData([]);
        setLoading(false);
      }
    };

    // Evitamos pisar el flujo de geolocalización
    if (mode !== 'local') {
      loadData();
    }
  }, [mode, selectedCountry, fetchAllWeatherData]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  const getRankedData = () => {
    let sorted = [...weatherData];

    switch (category) {
      case 'temp':
        sorted.sort((a, b) => subCategory === 'high' ? b.temp - a.temp : a.temp - b.temp);
        break;
      case 'wind':
        sorted.sort((a, b) => subCategory === 'high' ? b.windSpeed - a.windSpeed : a.windSpeed - b.windSpeed);
        break;
      case 'humidity':
        sorted.sort((a, b) => subCategory === 'high' ? b.humidity - a.humidity : a.humidity - b.humidity);
        break;
      case 'sky':
        sorted.sort((a, b) => subCategory === 'high' ? b.clouds - a.clouds : a.clouds - b.clouds);
        break;
      default:
        break;
    }

    return sorted.slice(0, 5);
  };

  const categories = [
    { id: 'temp', label: 'Temperatura', icon: Thermometer, color: 'text-orange-400' },
    { id: 'wind', label: 'Viento', icon: Wind, color: 'text-blue-400' },
    { id: 'humidity', label: 'Humedad', icon: Droplets, color: 'text-cyan-400' },
    { id: 'sky', label: 'Cielo', icon: Cloud, color: 'text-gray-400' },
  ];

  const getSubLabel = () => {
    if (category === 'temp') return subCategory === 'high' ? 'Más calientes' : 'Más frías';
    if (category === 'wind') return subCategory === 'high' ? 'Más viento' : 'Calma';
    if (category === 'humidity') return subCategory === 'high' ? 'Más húmedas' : 'Más secas';
    if (category === 'sky') return subCategory === 'high' ? 'Nublado' : 'Despejado';
    return '';
  };

  const getValueDisplay = (cityData) => {
    if (category === 'temp') return `${Math.round(cityData.temp)}°C`;
    if (category === 'wind') return `${cityData.windSpeed} m/s`;
    if (category === 'humidity') return `${cityData.humidity}%`;
    if (category === 'sky') return `${cityData.clouds}% nubes`;
    return '';
  };

  return (
    <div className="glass-card border-white/20 bg-black/40 backdrop-blur-md p-0 overflow-hidden mb-8 shadow-2xl transition-all duration-500">
      {/* Selector de Modalidad (Toggle) */}
      <div className="px-6 pt-6 flex justify-center items-center gap-3">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full max-w-xs shadow-inner">
          <button 
            onClick={() => setMode('global')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all text-sm font-bold ${mode === 'global' ? 'bg-purple-500/20 text-white border border-purple-500/20 shadow-lg' : 'text-premium-400 hover:text-white'}`}
          >
            <Globe className="w-4 h-4" /> Global
          </button>
          <button 
            onClick={() => {
              setMode('country');
              if (!selectedCountry) setWeatherData([]); // Limpia datos locales
              setMyLocation(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all text-sm font-bold ${mode === 'country' ? 'bg-purple-500/20 text-white border border-purple-500/20 shadow-lg' : 'text-premium-400 hover:text-white'}`}
          >
            <MapPin className="w-4 h-4" /> Por País
          </button>
        </div>

        {/* Botón de Geolocalización (Solo visible si no es Global) */}
        {mode !== 'global' && (
          <button
            onClick={handleLocationSearch}
            disabled={isLocating}
            className={`p-2.5 rounded-full border transition-all duration-300 shadow-lg flex items-center justify-center animate-in zoom-in duration-300 ${mode === 'local' || isLocating ? 'bg-purple-500/30 border-purple-500/50 text-white' : 'bg-white/5 border-white/10 text-premium-400 hover:text-white hover:bg-white/10 hover:border-white/20'}`}
            title="Buscar en mi zona cercana"
          >
            {isLocating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Buscador de País (Solo si mode === 'country') */}
      {mode === 'country' && (
        <div className="px-4 sm:px-6 pt-6 flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
          <CountrySearch onSelectCountry={handleCountrySelect} />
        </div>
      )}

      {/* Header con Filtros de Categoría */}
      <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-transparent mt-2">
        <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full xl:w-auto justify-center xl:justify-start">
            <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-premium-300 bg-clip-text text-transparent text-center xl:text-left">
              Top 5 {mode === 'global' ? 'Mundial' : mode === 'local' ? 'en Tu Zona Cercana' : selectedCountry ? `en ${selectedCountry.esName}` : ''}
            </h3>
          </div>
          
          <div className="flex flex-wrap justify-center bg-white/5 p-1 rounded-xl border border-white/10 w-full xl:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${category === cat.id ? 'bg-purple-500/20 text-white border border-purple-500/30' : 'text-premium-400 hover:text-white'}`}
              >
                <cat.icon className={`w-4 h-4 ${category === cat.id ? cat.color : ''}`} />
                <span className="text-xs font-medium hidden sm:block">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center md:justify-start gap-4 mt-6">
          <button
            onClick={() => setSubCategory('high')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${subCategory === 'high' ? 'bg-premium-100 text-black border-premium-100 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-premium-300 border-white/10 hover:border-white/20'}`}
          >
            <ChevronUp className="w-4 h-4" />
            {category === 'temp' ? 'Caliente' : category === 'wind' ? 'Fuerte' : category === 'humidity' ? 'Húmedo' : 'Nublado'}
          </button>
          <button
            onClick={() => setSubCategory('low')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-wider ${subCategory === 'low' ? 'bg-premium-100 text-black border-premium-100 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-premium-300 border-white/10 hover:border-white/20'}`}
          >
            <ChevronDown className="w-4 h-4" />
            {category === 'temp' ? 'Frío' : category === 'wind' ? 'Calma' : category === 'humidity' ? 'Seco' : 'Despejado'}
          </button>
        </div>
      </div>

      {/* Lista del Ranking */}
      <div className="p-6 h-auto min-h-[400px] pb-10">
        {(loading || geoLoading) ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            <div className="text-premium-400 text-sm text-center space-y-2">
              <span className="block animate-pulse">
                {geoLoading 
                  ? `Consultando base de datos geoespacial para ${selectedCountry?.esName}...` 
                  : isLocating
                  ? 'Obteniendo coordenadas GPS y escaneando municipios cercanos...'
                  : 'Procesando set de datos climáticos masivos...'}
              </span>
              {!geoLoading && !isLocating && loading && loadingProgress.total > 0 && (
                <span className="block text-xs font-bold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20 inline-block mt-2 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                  Analizando {loadingProgress.current} de {loadingProgress.total} locaciones
                </span>
              )}
              {!geoLoading && !isLocating && loading && (mode === 'country' || mode === 'local') && <span className="block text-[10px] opacity-60 italic mt-1">Optimizando respuesta en el cliente para evitar latencia</span>}
            </div>
          </div>
        ) : mode === 'country' && !selectedCountry ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-purple-500/10 rounded-full">
              <Search className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-premium-300 font-medium">Busca un país para descubrir sus extremos regionales.</p>
          </div>
        ) : weatherData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-premium-400 space-y-2">
            <Search className="w-12 h-12 opacity-10" />
            <p className="text-sm">No pudimos obtener datos para este país o zona.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-2 px-2">
              <span className="text-xs font-bold text-premium-500 uppercase tracking-widest">
                Ranking: {getSubLabel()}
              </span>
              <span className="text-xs text-premium-500 italic">Vía OpenWeather</span>
            </div>
            
            {getRankedData().map((city, index) => (
              <div 
                key={`${city.id}-${index}`} 
                className="group relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${index === 0 ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : index === 1 ? 'bg-gray-400/20 text-gray-300' : 'bg-white/10 text-premium-400'}`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white group-hover:translate-x-1 transition-transform">
                      {mode === 'global' && city.displayCountry ? city.displayCountry.toUpperCase() : city.name}
                    </h4>
                    <p className="text-xs text-premium-400 uppercase tracking-tighter">
                      {mode === 'global' && city.displayCountry ? `${city.name} · ${city.description}` : `${city.country} ${city.country ? '·' : ''} ${city.description}`}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-black tracking-tight ${category === 'temp' && subCategory === 'high' ? 'text-orange-400' : category === 'temp' && subCategory === 'low' ? 'text-blue-400' : 'text-premium-100'}`}>
                    {getValueDisplay(city)}
                  </div>
                  <div className="text-[10px] text-premium-500 uppercase font-bold">Valor</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Visor de Mapa Regional (Solo visible en mode === 'local' y con datos trazados) */}
      {mode === 'local' && myLocation && !loading && weatherData.length > 0 && (
        <div className="p-6 border-t border-white/10 bg-black/40 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-400" />
              Impacto Regional del Escáner API
            </h3>
            <span className="text-xs text-premium-400 italic">Radio detectado: {(maxSearchRadius / 1000).toFixed(1)} km</span>
          </div>
          
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(168,85,247,0.15)] relative h-[400px] bg-gray-900 z-0">
            <MapContainer 
              center={[myLocation.lat, myLocation.lon]} 
              zoom={10} 
              style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
              zoomControl={false}
            >
              <ChangeMapView center={[myLocation.lat, myLocation.lon]} zoom={10} />
              
              {/* TileLayer estilo oscuro elegante (CartoDB Dark Matter) */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
              />

              {/* Círculo expansivo de radio dinámico según la localidad más lejana reportada por OWM */}
              <Circle 
                center={[myLocation.lat, myLocation.lon]} 
                radius={maxSearchRadius} 
                pathOptions={{ 
                  color: '#a855f7', 
                  fillColor: '#8b5cf6', 
                  fillOpacity: 0.1,
                  dashArray: '10, 10',
                  weight: 2
                }}
              />

              {/* Pin de Ubicación Exacta del Usuario */}
              <Marker position={[myLocation.lat, myLocation.lon]} icon={userIcon} zIndexOffset={1000}>
                <Popup className="glass-popup custom-leaflet-popup">
                  <div className="font-bold text-sm text-purple-600">Tú estás aquí</div>
                  <div className="text-xs text-gray-500">Punto Cero GPS (MY_LOCATION)</div>
                </Popup>
              </Marker>

              {/* Mapeo de Locales Detectados por el Radar (Los Originales) */}
              {weatherData.map((loc) => {
                // Buscamos si esta localidad quedó en el Top 5 después del sorteo actúal
                const currentTop5 = getRankedData();
                const rankPos = currentTop5.findIndex(top => top.id === loc.id);
                const isInTop5 = rankPos !== -1;

                if (!loc.lat || !loc.lon) return null;

                return (
                  <Marker key={`map-${loc.id}`} position={[loc.lat, loc.lon]} opacity={isInTop5 ? 1 : 0.6}>
                    <Popup className="glass-popup">
                      <div className="font-bold text-sm bg-gradient-to-r from-purple-800 to-black bg-clip-text text-transparent">
                        {loc.name}
                      </div>
                      <div className="flex justify-between items-center text-xs mt-1 border-t border-gray-100 pt-1">
                        <span className="text-gray-600 font-medium">Temperatura:</span>
                        <span className="font-bold">{Math.round(loc.temp)}°C</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-0.5">
                        <span className="text-gray-600 font-medium">Condición:</span>
                        <span className="capitalize">{loc.description}</span>
                      </div>
                      
                      {isInTop5 && (
                        <div className="mt-2 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 text-[10px] font-black uppercase text-center py-1 rounded-md border border-purple-200">
                          #{rankPos + 1} en Ranking Actual
                        </div>
                      )}
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
