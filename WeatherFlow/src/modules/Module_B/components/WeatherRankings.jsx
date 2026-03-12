import { useState, useEffect } from 'react';
import { Thermometer, Wind, Droplets, Cloud, ChevronUp, ChevronDown, Loader2, Globe } from 'lucide-react';

const API_KEY = '9881114244119304be93da42d1185931';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const CITIES = [
  'Mexico City', 'New York', 'Tokyo', 'London', 'Paris', 
  'Dubai', 'Sydney', 'Moscow', 'Rio de Janeiro', 'Cairo',
  'Beijing', 'Mumbai', 'Berlin', 'Madrid', 'Toronto'
];

export default function WeatherRankings() {
  const [weatherData, setWeatherData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('temp'); // temp, wind, humidity, sky
  const [subCategory, setSubCategory] = useState('high'); // high (hot/strong/humid), low (cold/calm/dry)

  useEffect(() => {
    fetchAllWeatherData();
  }, []);

  const fetchAllWeatherData = async () => {
    setLoading(true);
    try {
      const promises = CITIES.map(city => 
        fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`)
          .then(res => res.json())
      );
      const results = await Promise.all(promises);
      setWeatherData(results.filter(data => data.cod === 200));
    } catch (error) {
      console.error("Error fetching ranking data:", error);
    } finally {
      setLoading(false);
    }
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
        // Cloud coverage percentage
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
    <div className="glass-card border-purple-500/20 bg-black/40 p-0 overflow-hidden mb-8">
      {/* Header con Filtros */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-transparent">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Globe className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-white to-premium-300 bg-clip-text text-transparent">
              Rankings Climáticos Globales
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
      <div className="p-6">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            <p className="text-premium-400 text-sm animate-pulse">Consultando estaciones meteorológicas globales...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4 px-2">
              <span className="text-xs font-bold text-premium-500 uppercase tracking-widest">
                Top 5: {getSubLabel()}
              </span>
              <span className="text-xs text-premium-500 italic">Datos en tiempo real</span>
            </div>
            
            {getRankedData().map((city, index) => (
              <div 
                key={city.id} 
                className="group relative flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${index === 0 ? 'bg-amber-500/20 text-amber-500' : index === 1 ? 'bg-premium-200/20 text-premium-200' : 'bg-white/10 text-premium-400'}`}>
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
                  <div className="text-[10px] text-premium-500 uppercase font-bold">Valor Actual</div>
                </div>

                {/* Decoración hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
