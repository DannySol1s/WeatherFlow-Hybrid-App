import React, { useState, useMemo } from 'react';
import { Search, Loader2, Thermometer, Wind, Droplets, Gauge, MapPin, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import ModuleTemplate from '../../components/ModuleTemplate';
import { fetchAndStoreWeather, fetchWeatherByCoords } from '../../lib/weatherApi';
import { supabase } from '../../lib/supabase';

const GLOBAL_CITIES = ['Tokio', 'Nueva York', 'Londres', 'París', 'Madrid'];

export default function ForecastModule() {
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [weather, setWeather] = useState(null);
    const [globalHistory, setGlobalHistory] = useState([]);
    const [cityHistory, setCityHistory] = useState([]);
    const [error, setError] = useState('');
    const [unit, setUnit] = useState('C');

    const MODULE_OWNER = 'ModuleForecast';

    // Cargar historial global al iniciar el componente
    React.useEffect(() => {
        loadGlobalHistoryFromSupabase();
    }, []);

    const handleSearch = async (e, searchCity = city) => {
        if (e) e.preventDefault();
        if (!searchCity.trim()) return;

        setLoading(true);
        setError('');
        
        if (searchCity !== city) setCity(searchCity);

        try {
            const data = await fetchAndStoreWeather(searchCity, MODULE_OWNER);
            setWeather(data);
            loadCityHistoryFromSupabase(data.name);
            loadGlobalHistoryFromSupabase();
        } catch (err) {
            setError('Error al obtener el clima. Por favor, revisa el nombre de la ciudad.');
            setWeather(null);
            setCityHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const loadGlobalHistoryFromSupabase = async () => {
        const { data, error } = await supabase
            .from('weather_history')
            .select('created_at, content')
            .eq('module_owner', MODULE_OWNER)
            .order('created_at', { ascending: false })
            .limit(15);

        if (data) {
            // Filtrar para mostrar solo la búsqueda más reciente por ciudad
            const unique = [];
            const filtered = data.filter(record => {
                if (!unique.includes(record.content.name)) {
                    unique.push(record.content.name);
                    return true;
                }
                return false;
            });
            setGlobalHistory(filtered.slice(0, 6)); // Mostrar maximo 6
        }
        if (error) console.error("Error al cargar historial global:", error);
    };

    const loadCityHistoryFromSupabase = async (cityName) => {
        const { data, error } = await supabase
            .from('weather_history')
            .select('created_at, content')
            .eq('module_owner', MODULE_OWNER)
            .eq('content->>name', cityName)
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) setCityHistory(data);
        if (error) console.error("Error al cargar historial por ciudad:", error);
    };

    const handleGeoLocation = () => {
        if (navigator.geolocation) {
            setLoading(true);
            setError('');
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const data = await fetchWeatherByCoords(latitude, longitude, MODULE_OWNER);
                        setWeather(data);
                        setCity(data.name);
                        loadCityHistoryFromSupabase(data.name);
                        loadGlobalHistoryFromSupabase();
                    } catch (err) {
                        setError('Error al obtener el clima por ubicación.');
                    } finally {
                        setLoading(false);
                    }
                },
                (err) => {
                    setLoading(false);
                    setError('Permiso de geolocalización denegado o error al procesar ubicación.');
                }
            );
        } else {
            setError('Tu navegador no soporta geolocalización.');
        }
    };

    const displayTemp = (tempC) => {
        if (unit === 'F') return Math.round((tempC * 9/5) + 32);
        return Math.round(tempC);
    };

    const getComfortIndex = (tempC, humidity) => {
        if (tempC >= 30 && humidity >= 60) return { label: "Sofocante", color: "text-red-400 border-red-400/30 bg-red-400/10" };
        if (tempC >= 30 && humidity < 60) return { label: "Calor Seco", color: "text-orange-400 border-orange-400/30 bg-orange-400/10" };
        if (tempC < 15) return { label: "Frío", color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10" };
        if (tempC >= 15 && tempC <= 28 && humidity >= 30 && humidity <= 60) return { label: "Agradable", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" };
        return { label: "Moderado", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" };
    };

    const toggleUnit = () => {
        setUnit(prev => prev === 'C' ? 'F' : 'C');
    };

    // Calculate dynamic background based on current weather temperature
    const dynamicModuleColor = useMemo(() => {
        if (!weather) return "bg-blue-500/20";
        const temp = weather.main.temp;
        if (temp < 15) return "bg-cyan-500/20"; // Cold
        if (temp > 28) return "bg-orange-500/20"; // Hot
        return "bg-emerald-500/20"; // Moderate
    }, [weather]);

    // Prepare chart data chronologically (oldest first)
    const chartData = useMemo(() => {
        if (!cityHistory.length) return [];
        return [...cityHistory].reverse().map(record => {
            const dateObj = new Date(record.created_at);
            return {
                time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                temp: displayTemp(record.content.main.temp)
            };
        });
    }, [cityHistory, unit]);

    // Skeleton Loader Component
    const SkeletonLoader = () => (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-6 w-full"
        >
            <div className="glass-card h-64 border-white/10 animate-pulse bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                <div className="p-8 h-full flex flex-col justify-between relative z-10">
                    <div className="space-y-4">
                        <div className="h-10 w-1/3 bg-white/10 rounded-lg"></div>
                        <div className="h-6 w-1/4 bg-white/10 rounded-lg"></div>
                    </div>
                    <div className="self-end h-20 w-24 bg-white/10 rounded-lg"></div>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="glass-card h-32 border-white/10 animate-pulse bg-white/5" />
                ))}
            </div>
        </motion.div>
    );

    return (
        <ModuleTemplate title="Módulo Forecast" moduleColor={dynamicModuleColor}>
            <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8">
                
                {/* Panel Principal */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Global Cities Quick Select */}
                    <div className="flex flex-wrap gap-2 items-center mb-2 z-20 relative">
                        <Globe className="w-4 h-4 text-premium-300 mr-2" />
                        <span className="text-sm font-medium text-premium-300 mr-2">Top Globales:</span>
                        {GLOBAL_CITIES.map(gCity => (
                            <button
                                key={gCity}
                                onClick={() => handleSearch(null, gCity)}
                                disabled={loading}
                                className="px-3 py-1 text-xs font-semibold rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors backdrop-blur-sm text-premium-200"
                            >
                                {gCity}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 relative z-20">
                        <form onSubmit={(e) => handleSearch(e)} className="relative flex-1">
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="Ej. Mérida, Campeche, Escárcega..."
                                className="w-full bg-black/20 border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-white placeholder-premium-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            </button>
                        </form>
                        <button
                            type="button"
                            onClick={handleGeoLocation}
                            disabled={loading}
                            title="Usar mi ubicación actual"
                            className="aspect-square w-[58px] flex items-center justify-center bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-2xl border border-emerald-400/30 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 backdrop-blur-xl"
                        >
                            <MapPin className="w-6 h-6" />
                        </button>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/20 border border-red-500/50 text-red-100 p-4 rounded-xl text-center backdrop-blur-xl font-medium shadow-lg">
                            {error}
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <SkeletonLoader key="loader" />
                        ) : weather ? (
                            <motion.div 
                                key="content"
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Main Card with Dynamic Gradient */}
                                <div className={`glass-card bg-gradient-to-br ${
                                        weather.main.temp < 15 ? 'from-cyan-600/30 to-blue-900/40 border-cyan-400/30' :
                                        weather.main.temp > 28 ? 'from-orange-600/30 to-red-900/40 border-orange-400/30' :
                                        'from-emerald-600/30 to-teal-900/40 border-emerald-400/30'
                                    } overflow-hidden relative shadow-[0_15px_50px_rgba(0,0,0,0.5)] group`}
                                >
                                    <motion.div 
                                        animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                        className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none"
                                    >
                                        <Thermometer className="w-96 h-96" />
                                    </motion.div>
                                    
                                    <div className="absolute top-0 right-0 p-6 z-20">
                                        <button 
                                            onClick={toggleUnit}
                                            className="px-4 py-2 bg-black/20 hover:bg-black/40 border border-white/10 rounded-full text-sm font-semibold backdrop-blur-xl transition-all shadow-lg"
                                        >
                                            °{unit === 'C' ? 'F' : 'C'}
                                        </button>
                                    </div>

                                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end p-8 gap-6">
                                        <div>
                                            {/* Location Hierarchy */}
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <h2 className="text-5xl md:text-6xl font-black tracking-tighter drop-shadow-xl">{weather.name}</h2>
                                                {weather.sys?.country && (
                                                    <span className="text-sm font-bold bg-white/10 px-3 py-1.5 rounded-lg text-white border border-white/20 backdrop-blur-md shadow-inner self-center md:self-end mb-1 md:mb-2">
                                                        {weather.sys.country}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-premium-100 capitalize text-xl flex items-center gap-2 font-light tracking-wide mb-4">
                                                {weather.weather[0].description}
                                            </p>
                                            
                                            {/* Comfort Index Badge */}
                                            {(() => {
                                                const comfort = getComfortIndex(weather.main.temp, weather.main.humidity);
                                                return (
                                                    <div className={`mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg backdrop-blur-md border ${comfort.color}`}>
                                                        <span className="relative flex h-2.5 w-2.5">
                                                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current`}></span>
                                                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 bg-current`}></span>
                                                        </span>
                                                        {comfort.label}
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                        <div className="text-left md:text-right w-full md:w-auto mt-4 md:mt-0">
                                            <h3 className="text-8xl md:text-9xl font-black tracking-tighter drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                                                {displayTemp(weather.main.temp)}°<span className="text-4xl md:text-5xl text-white/40 ml-1">{unit}</span>
                                            </h3>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Grid - Premium Subtle Gradients */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-card bg-gradient-to-br from-white/5 to-transparent hover:from-white/10 transition-all p-5 flex flex-col items-center justify-center text-center border-white/5 shadow-lg relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-colors" />
                                        <Thermometer className="w-8 h-8 mb-3 text-blue-400 relative z-10" />
                                        <p className="text-sm text-premium-300 mb-1 relative z-10 font-medium">Sensación</p>
                                        <p className="font-bold text-2xl relative z-10 tracking-tight">{displayTemp(weather.main.feels_like)}°</p>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-card bg-gradient-to-br from-white/5 to-transparent hover:from-white/10 transition-all p-5 flex flex-col items-center justify-center text-center border-white/5 shadow-lg relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-colors" />
                                        <Droplets className="w-8 h-8 mb-3 text-cyan-400 relative z-10" />
                                        <p className="text-sm text-premium-300 mb-1 relative z-10 font-medium">Humedad</p>
                                        <p className="font-bold text-2xl relative z-10 tracking-tight">{weather.main.humidity}%</p>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-card bg-gradient-to-br from-white/5 to-transparent hover:from-white/10 transition-all p-5 flex flex-col items-center justify-center text-center border-white/5 shadow-lg relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/10 rounded-full blur-xl group-hover:bg-teal-500/20 transition-colors" />
                                        <Wind className="w-8 h-8 mb-3 text-teal-400 relative z-10" />
                                        <p className="text-sm text-premium-300 mb-1 relative z-10 font-medium">Viento</p>
                                        <p className="font-bold text-2xl relative z-10 tracking-tight">{weather.main.speed || weather.wind?.speed} m/s</p>
                                    </motion.div>
                                    <motion.div whileHover={{ y: -5, scale: 1.02 }} className="glass-card bg-gradient-to-br from-white/5 to-transparent hover:from-white/10 transition-all p-5 flex flex-col items-center justify-center text-center border-white/5 shadow-lg relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors" />
                                        <Gauge className="w-8 h-8 mb-3 text-indigo-400 relative z-10" />
                                        <p className="text-sm text-premium-300 mb-1 relative z-10 font-medium">Presión</p>
                                        <p className="font-bold text-2xl relative z-10 tracking-tight">{weather.main.pressure} hPa</p>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>

                {/* Panel Historial y Gráfica */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Recharts - Temperature Trend */}
                    {weather && chartData.length > 1 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card border-white/10 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] bg-gradient-to-b from-black/20 to-black/40"
                        >
                            <h3 className="text-sm font-bold text-premium-200 mb-4 uppercase tracking-wider flex items-center justify-between">
                                Tendencia (Últimos Registros)
                                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">GIN Index</span>
                            </h3>
                            <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={8} minTickGap={15} />
                                        <YAxis stroke="#64748b" fontSize={10} domain={['dataMin - 2', 'dataMax + 2']} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}
                                            formatter={(value) => [`${value}°${unit}`, 'Temp']}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="temp" 
                                            stroke="#60a5fa" 
                                            strokeWidth={3} 
                                            dot={{ r: 4, fill: '#1e293b', stroke: '#60a5fa', strokeWidth: 2 }}
                                            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff' }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* Historial Sidebar */}
                    <div className="glass-card flex-1 flex flex-col border-white/10 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] min-h-[400px]">
                        <h3 className="text-lg font-bold mb-4 flex items-center justify-between text-white">
                            Consultas Anteriores
                        </h3>

                        {loading && !globalHistory.length ? (
                            <div className="space-y-4 flex-1">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}
                            </div>
                        ) : globalHistory.length > 0 ? (
                            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence>
                                    {globalHistory.map((record, idx) => {
                                        const content = record.content;
                                        const dateObj = new Date(record.created_at);
                                        return (
                                            <motion.div 
                                                key={`${idx}-${record.created_at}`}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                onClick={() => handleSearch(null, content.name)}
                                                className="group bg-gradient-to-r from-white/5 to-transparent hover:from-white/10 transition-all p-4 rounded-xl border border-white/5 cursor-pointer flex items-center gap-4 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                            >
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center font-black text-white shadow-inner flex-shrink-0 group-hover:scale-110 group-hover:border-blue-400/50 transition-all duration-300">
                                                    {content.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-premium-100 truncate text-base">{content.name}</p>
                                                    <p className="text-[11px] font-medium text-premium-400 mt-0.5 truncate uppercase tracking-wider">
                                                        {dateObj.toLocaleDateString()} • {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xl font-black text-white">{displayTemp(content.main.temp)}°</span>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-premium-400 border border-dashed border-white/10 rounded-xl bg-black/20">
                                <Search className="w-10 h-10 mb-4 opacity-20" />
                                <p className="font-medium">{!weather ? "Busca tu primera ciudad" : "Sin historial previo"}</p>
                                <p className="text-xs opacity-60 mt-1">El historial aparecerá aquí</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </ModuleTemplate>
    );
}
