import { useState } from 'react';
import { Search, Loader2, Thermometer, Wind, Droplets } from 'lucide-react';
import ModuleTemplate from '../../components/ModuleTemplate';
import { fetchAndStoreWeather } from '../../lib/weatherApi';
import { supabase } from '../../lib/supabase';

export default function ForecastModule() {
    const [city, setCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [weather, setWeather] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState('');

    const MODULE_OWNER = 'ModuleForecast';

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!city.trim()) return;

        setLoading(true);
        setError('');

        try {
            const data = await fetchAndStoreWeather(city, MODULE_OWNER);
            setWeather(data);
            loadHistoryFromSupabase(data.name);
        } catch (err) {
            setError('Error al obtener el clima. Por favor, revisa el nombre de la ciudad.');
            setWeather(null);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const loadHistoryFromSupabase = async (cityName) => {
        // ESTA CONSULTA APROVECHA EL GIN INDEX: filter en content->name de forma eficiente en BD
        const { data, error } = await supabase
            .from('weather_history')
            .select('created_at, content')
            .eq('module_owner', MODULE_OWNER)
            .eq('content->name', cityName)
            .order('created_at', { ascending: false })
            .limit(5); // Traemos los últimos 5 registros históricos para esa ciudad

        if (data) setHistory(data);
        if (error) console.error("Error al cargar historial:", error);
    };

    return (
        <ModuleTemplate title="Módulo Forecast" moduleColor="bg-blue-500/20">
            <div className="max-w-4xl mx-auto grid md:grid-cols-12 gap-8">

                {/* Panel Principal */}
                <div className="md:col-span-7 space-y-6">
                    <form onSubmit={handleSearch} className="relative">
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="Ej. Mérida, Campeche, Escárcega..."
                            className="w-full bg-black/20 border border-white/20 rounded-2xl py-4 pl-6 pr-16 text-white placeholder-premium-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium backdrop-blur-md shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white rounded-xl transition-colors shadow-lg disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </form>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-center">
                            {error}
                        </div>
                    )}

                    {weather && (
                        <div className="glass-card bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border-blue-400/30 overflow-hidden relative">
                            {/* Animated big icon placeholder */}
                            <div className="absolute -right-10 -bottom-10 opacity-10 blur-[2px]">
                                <Thermometer className="w-64 h-64" />
                            </div>

                            <div className="relative z-10 flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-4xl font-bold">{weather.name}</h2>
                                    <p className="text-premium-300 capitalize text-lg flex items-center gap-2 mt-1">
                                        {weather.weather[0].description}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-6xl font-light tracking-tighter shadow-sm">{Math.round(weather.main.temp)}°</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-8 relative z-10">
                                <div className="bg-black/20 rounded-xl p-4 text-center border border-white/5">
                                    <Thermometer className="w-6 h-6 mx-auto mb-2 text-blue-300" />
                                    <p className="text-sm text-premium-300 mb-1">Sensación</p>
                                    <p className="font-semibold text-lg">{Math.round(weather.main.feels_like)}°</p>
                                </div>
                                <div className="bg-black/20 rounded-xl p-4 text-center border border-white/5">
                                    <Droplets className="w-6 h-6 mx-auto mb-2 text-cyan-300" />
                                    <p className="text-sm text-premium-300 mb-1">Humedad</p>
                                    <p className="font-semibold text-lg">{weather.main.humidity}%</p>
                                </div>
                                <div className="bg-black/20 rounded-xl p-4 text-center border border-white/5">
                                    <Wind className="w-6 h-6 mx-auto mb-2 text-teal-300" />
                                    <p className="text-sm text-premium-300 mb-1">Viento</p>
                                    <p className="font-semibold text-lg">{weather.wind.speed} m/s</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Panel Historial */}
                <div className="md:col-span-5">
                    <div className="glass-card h-full flex flex-col border-white/10">
                        <h3 className="text-xl font-semibold mb-6 flex items-center justify-between">
                            Historial GIN Filtered
                            <span className="text-xs font-normal text-premium-300 bg-premium-800/50 px-3 py-1 rounded-full">content-&gt;name</span>
                        </h3>

                        {history.length > 0 ? (
                            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {history.map((record, idx) => {
                                    const content = record.content;
                                    const dateObj = new Date(record.created_at);
                                    return (
                                        <div key={idx} className="bg-white/5 hover:bg-white/10 transition-colors p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-blue-200">{content.name}</p>
                                                <p className="text-xs text-premium-400 mt-1">
                                                    {dateObj.toLocaleDateString()} • {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                <span className="text-xl font-medium">{Math.round(content.main.temp)}°</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-center p-6 text-premium-400 border border-dashed border-white/10 rounded-xl">
                                {!weather ? "Busca una ciudad para ver el historial." : "No hay más registros."}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </ModuleTemplate>
    );
}
