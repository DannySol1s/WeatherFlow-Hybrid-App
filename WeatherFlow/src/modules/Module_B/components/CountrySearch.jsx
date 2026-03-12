import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { COUNTRIES } from '../utils/countryData';

export default function CountrySearch({ onSelectCountry }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filtrar países según el input
  useEffect(() => {
    if (query.trim() === '') {
      setSuggestions([]);
      return;
    }
    
    // Filtramos sobre la lista de COUNTRIES (que ahora está en inglés)
    const filtered = COUNTRIES.filter(country => 
      country.name.toLowerCase().includes(query.toLowerCase()) ||
      country.code.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    setSuggestions(filtered);
  }, [query]);

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (country) => {
    setQuery(country.name);
    setSuggestions([]);
    setIsOpen(false);
    onSelectCountry(country);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-premium-400 group-focus-within:text-purple-400 transition-colors" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Busca un país (en inglés)..."
          className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-2xl pl-12 pr-12 py-3 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all backdrop-blur-md"
        />

        {query && (
          <button 
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-premium-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown de Sugerencias */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a222a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="py-2">
            {suggestions.map((country) => (
              <button
                key={country.code}
                onClick={() => handleSelect(country)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors group"
              >
                <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                  <MapPin className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-white font-medium">{country.name}</div>
                  <div className="text-[10px] text-premium-400 font-bold uppercase tracking-widest">{country.code}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay resultados */}
      {isOpen && query.length > 1 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a222a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center text-premium-400 text-sm animate-in fade-in duration-200">
          No se encontró el país solicitado.
        </div>
      )}
    </div>
  );
}
