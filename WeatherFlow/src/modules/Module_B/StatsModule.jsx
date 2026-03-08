import { useState, useEffect } from 'react';
import { BarChart3, Map, Activity, Globe, Loader2 } from 'lucide-react';
import ModuleTemplate from '../../components/ModuleTemplate';
import { supabase } from '../../lib/supabase';

export default function StatsModule() {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cargar estadísticas globales directamente desde Supabase
    useEffect(() => {
        fetchGlobalStats();
    }, []);

    const fetchGlobalStats = async () => {
        setLoading(true);
        // Recupera todos los eventos de todos los modulos para generar analitica
        const { data, error } = await supabase
            .from('weather_history')
            .select('module_owner, created_at, content')
            .order('created_at', { ascending: false })
            .limit(10);

        if (data) setStats(data);
        if (error) console.error("Error fetching stats:", error);
        setLoading(false);
    };

    return (
        <ModuleTemplate title="Módulo Stats" moduleColor="bg-purple-500/20">
            <div className="max-w-5xl mx-auto">

                {/* Superior: KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-card border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/5 hover:from-purple-500/20 transition-colors">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-purple-500/20 rounded-xl">
                                <Activity className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-premium-200">Total Consultas</h3>
                        </div>
                        <p className="text-4xl font-bold mt-4">{stats.length > 0 ? '10+' : '0'}</p>
                    </div>

                    <div className="glass-card border-pink-500/30 bg-gradient-to-br from-pink-500/10 to-rose-500/5 hover:from-pink-500/20 transition-colors">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-pink-500/20 rounded-xl">
                                <Globe className="w-6 h-6 text-pink-400" />
                            </div>
                            <h3 className="text-premium-200">Integración GIN</h3>
                        </div>
                        <p className="text-xl font-medium mt-4 text-premium-100 italic">Optimizando JSONB</p>
                    </div>

                    <div className="glass-card border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 hover:from-amber-500/20 transition-colors">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-amber-500/20 rounded-xl">
                                <BarChart3 className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="text-premium-200">Estado</h3>
                        </div>
                        <p className="text-2xl font-bold mt-4 flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                            Conectado
                        </p>
                    </div>
                </div>

                {/* Inferior: Historial Visual */}
                <div className="glass-card border-white/10 p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/10 bg-black/20 flex justify-between items-center">
                        <h3 className="text-xl font-semibold flex items-center gap-3">
                            <Map className="w-5 h-5 text-purple-400" />
                            Flujo de Datos Reciente
                        </h3>
                        <button onClick={fetchGlobalStats} className="text-sm text-premium-300 hover:text-white transition-colors">
                            Actualizar
                        </button>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                            </div>
                        ) : stats.length === 0 ? (
                            <div className="py-12 text-center text-premium-400 border border-dashed border-white/10 rounded-2xl">
                                No hay datos para analizar. Realiza búsquedas en el Módulo Forecast primero.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-premium-300 border-b border-white/10 text-sm">
                                            <th className="pb-4 font-medium pl-4">Módulo Origen</th>
                                            <th className="pb-4 font-medium">Ciudad Destino</th>
                                            <th className="pb-4 font-medium">Temperatura</th>
                                            <th className="pb-4 font-medium text-right pr-4">Fecha de Alta</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.map((row, i) => (
                                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4 pl-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${row.module_owner === 'ModuleForecast' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
                                                        {row.module_owner}
                                                    </span>
                                                </td>
                                                <td className="py-4 font-medium">{row.content?.name || 'N/A'}</td>
                                                <td className="py-4">
                                                    {row.content?.main?.temp ? `${Math.round(row.content.main.temp)}°C` : 'N/A'}
                                                </td>
                                                <td className="py-4 text-right pr-4 text-sm text-premium-400">
                                                    {new Date(row.created_at).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </ModuleTemplate>
    );
}
