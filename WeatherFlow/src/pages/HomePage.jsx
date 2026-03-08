import { Link } from 'react-router-dom';
import { CloudRain, Map as MapIcon, ChevronRight } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen p-6 md:p-10 flex flex-col items-center justify-center max-w-5xl mx-auto relative">
            {/* Background decorations */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px] -z-10" />

            <div className="text-center mb-16 relative z-10">
                <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-lg">
                    Weather<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Flow</span>
                </h1>
                <p className="text-xl md:text-2xl text-premium-200 max-w-2xl mx-auto font-light leading-relaxed">
                    Arquitectura modular para analítica y pronóstico del clima.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
                {/* Módulo A Card */}
                <Link
                    to="/module-a"
                    className="glass-card glass-card-hover group relative overflow-hidden flex flex-col p-8 text-left border border-white/10 hover:border-blue-400/50"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-80" />
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-blue-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                            <CloudRain className="w-10 h-10 text-blue-400" />
                        </div>
                        <ChevronRight className="w-6 h-6 text-premium-400 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h2 className="text-3xl font-semibold mb-3">Módulo Forecast</h2>
                    <p className="text-premium-300 text-lg">Consulta el clima actual y registra datos. Espacio del Desarrollador 1.</p>
                </Link>

                {/* Módulo B Card */}
                <Link
                    to="/module-b"
                    className="glass-card glass-card-hover group relative overflow-hidden flex flex-col p-8 text-left border border-white/10 hover:border-purple-400/50"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-400 opacity-80" />
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-4 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                            <MapIcon className="w-10 h-10 text-purple-400" />
                        </div>
                        <ChevronRight className="w-6 h-6 text-premium-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <h2 className="text-3xl font-semibold mb-3">Módulo Stats</h2>
                    <p className="text-premium-300 text-lg">Visualiza historiales y analíticas del sistema. Espacio del Desarrollador 2.</p>
                </Link>
            </div>
        </div>
    );
}
