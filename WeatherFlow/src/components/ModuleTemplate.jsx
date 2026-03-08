import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ModuleTemplate({ title, children, moduleColor = 'bg-blue-500/10' }) {
    return (
        <div className="min-h-screen p-6 md:p-10 max-w-7xl mx-auto">
            <header className="flex items-center space-x-6 mb-8">
                <Link
                    to="/"
                    className="p-3 rounded-full glass-card hover:bg-white/10 transition-colors"
                    title="Regresar al Inicio"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-4xl font-bold tracking-tight drop-shadow-sm">{title}</h1>
            </header>

            <main className={`glass-panel border-t border-l border-white/20 rounded-3xl p-6 md:p-8 min-h-[70vh] shadow-2xl relative overflow-hidden`}>
                {/* Decorative background glow */}
                <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-[100px] opacity-20 ${moduleColor.replace('bg-', 'bg-').split('/')[0]}`} />

                <div className="relative z-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
