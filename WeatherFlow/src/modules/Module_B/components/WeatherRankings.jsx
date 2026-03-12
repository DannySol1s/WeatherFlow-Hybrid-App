import { useState, useEffect, useCallback } from 'react';
import { Thermometer, Wind, Droplets, Cloud, ChevronUp, ChevronDown, Loader2, Globe, MapPin, Search } from 'lucide-react';
import { GLOBAL_CITIES } from '../utils/countryData';
import CountrySearch from './CountrySearch';

const API_KEY = '9881114244119304be93da42d1185931';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_API_URL = 'https://countriesnow.space/api/v0.1/countries/cities';

export default function WeatherRankings() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [category, setCategory] = useState('temp'); // temp, wind, humidity, sky
  const [subCategory, setSubCategory] = useState('high'); // high, low
  const [mode, setMode] = useState('global'); // global, country
  const [selectedCountry, setSelectedCountry] = useState(null);

  const fetchAllWeatherData = useCallback(async (citiesToFetch) => {
    if (!citiesToFetch || citiesToFetch.length === 0) {
      setWeatherData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Limitamos a un máximo de 10 ciudades para optimizar peticiones y velocidad
      const limitedCities = citiesToFetch.slice(0, 10);
      
      const promises = limitedCities.map(city => 
        fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`)
          .then(res => res.json())
      );
      const results = await Promise.all(promises);
      // Solo nos quedamos con respuestas exitosas (cod 200)
      setWeatherData(results.filter(data => data.cod === 200));
    } catch (error) {
      console.error("Error fetching ranking data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCitiesByCountry = async (countryName) => {
    setGeoLoading(true);
    try {
      // CountriesNow requiere el nombre del país en inglés (que ya tenemos en countryData.js)
      const response = await fetch(GEO_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName })
      });
      const result = await response.json();
      
      if (!result.error && result.data) {
        // Devolvemos la lista de ciudades. La API suele devolverlas por orden de importancia/alfabético.
        return result.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching country cities:", error);
      return [];
    } finally {
      setGeoLoading(false);
    }
  };

  // Efecto que reacciona al cambio de modo o país seleccionado
  useEffect(() => {
    const loadData = async () => {
      if (mode === 'global') {
        fetchAllWeatherData(GLOBAL_CITIES);
      } else if (mode === 'country' && selectedCountry) {
        const countryCities = await fetchCitiesByCountry(selectedCountry.name);
        fetchAllWeatherData(countryCities);
      } else {
        setWeatherData([]);
        setLoading(false);
      }
    };

    loadData();
  }, [mode, selectedCountry, fetchAllWeatherData]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  const getRankedData = () => {
    let sorted = [...weatherData];

    switch (category) {
      case 'temp':
        sorted.sort((a, b) => subCategory === 'high' ? b.main.temp - a.main.temp : a.main.temp - b.main.temp);
        break;
      case 'wind':
        sorted.sort((a, b) => subCategory === 'high' ? b.wind.speed - a.wind.speed : a.wind.speed - b.wind.speed);
        break;
      case 'humidity':
        sorted.sort((a, b) => subCategory === 'high' ? b.main.humidity - a.main.humidity : a.main.humidity - b.main.humidity);
        break;
      case 'sky':
        sorted.sort((a, b) => subCategory === 'high' ? b.clouds.all - a.clouds.all : a.clouds.all - b.clouds.all);
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
    if (category === 'temp') return `${Math.round(cityData.main.temp)}°C`;
    if (category === 'wind') return `${cityData.wind.speed} m/s`;
    if (category === 'humidity') return `${cityData.main.humidity}%`;
    if (category === 'sky') return `${cityData.clouds.all}% nubes`;
    return '';
  };

  return (
    <div className="glass-card border-purple-500/20 bg-black/40 p-0 overflow-hidden mb-8 shadow-2xl transition-all duration-500">
      {/* Selector de Modalidad (Toggle) */}
      <div className="px-6 pt-6 flex justify-center">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 w-full max-w-xs shadow-inner">
          <button 
            onClick={() => setMode('global')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all text-sm font-bold ${mode === 'global' ? 'bg-purple-500/20 text-white border border-purple-500/20 shadow-lg' : 'text-premium-400 hover:text-white'}`}
          >
            <Globe className="w-4 h-4" /> Global
          </button>
          <button 
            onClick={() => setMode('country')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl transition-all text-sm font-bold ${mode === 'country' ? 'bg-purple-500/20 text-white border border-purple-500/20 shadow-lg' : 'text-premium-400 hover:text-white'}`}
          >
            <MapPin className="w-4 h-4" /> Por País
          </button>
        </div>
      </div>

      {/* Buscador de País (Solo si mode === 'country') */}
      {mode === 'country' && (
        <div className="px-6 pt-6 flex justify-center animate-in fade-in slide-in-from-top-4 duration-300">
          <CountrySearch onSelectCountry={handleCountrySelect} />
        </div>
      )}

      {/* Header con Filtros de Categoría */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-transparent mt-2">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-premium-300 bg-clip-text text-transparent">
              Top 5 {mode === 'global' ? 'Mundial' : selectedCountry ? `en ${selectedCountry.name}` : ''}
            </h3>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
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
      <div className="p-6 h-[450px]">
        {(loading || geoLoading) ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            <p className="text-premium-400 text-sm animate-pulse text-center space-y-2">
              <span>{geoLoading ? `Consultando ciudades en ${selectedCountry?.name}...` : 'Analizando datos meteorológicos...'}</span>
              {!geoLoading && loading && mode === 'country' && <span className="block text-[10px] opacity-60 italic">Esto puede tardar unos segundos</span>}
            </p>
          </div>
        ) : mode === 'country' && !selectedCountry ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-purple-500/10 rounded-full">
              <Search className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-premium-300 font-medium">Busca un país para descubrir sus extremos climáticos.</p>
          </div>
        ) : weatherData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-premium-400 space-y-2">
            <Search className="w-12 h-12 opacity-10" />
            <p className="text-sm">No pudimos obtener datos para este país.</p>
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
                key={city.id} 
                className="group relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${index === 0 ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : index === 1 ? 'bg-gray-400/20 text-gray-300' : 'bg-white/10 text-premium-400'}`}>
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-white group-hover:translate-x-1 transition-transform">{city.name}</h4>
                    <p className="text-xs text-premium-400 uppercase tracking-tighter">{city.sys.country} · {city.weather[0].description}</p>
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
    </div>
  );
}
