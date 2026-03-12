import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';

export default function CountrySearch({ onSelectCountry }) {
  const [query, setQuery] = useState('');
  const [allCountries, setAllCountries] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const dropdownRef = useRef(null);

  // Cargar todos los países del mundo al montar el componente
  useEffect(() => {
    const fetchAllCountries = async () => {
      setIsSyncing(true);
      try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/iso');
        const result = await response.json();
        
        if (!result.error) {
          // Usamos Intl.DisplayNames para obtener los nombres en español automáticamente
          const regionNames = new Intl.DisplayNames(['es'], { type: 'region' });
          
          const processedCountries = result.data.map(c => {
            let esName = c.name;
            try {
              // Intentamos obtener la traducción oficial por código ISO
              esName = regionNames.of(c.Iso2) || c.name;
            } catch (e) {
              // Fallback al nombre original si falla
            }
            return {
              name: c.name,    // Usado para la API interna (inglés)
              esName: esName,  // Usado para mostrar al usuario (español)
              code: c.Iso2
            };
          });

          setAllCountries(processedCountries);
        }
      } catch (error) {
        console.error("Error fetching global country list:", error);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchAllCountries();
  }, []);

  // Filtrar países según el input
  useEffect(() => {
    if (query.trim().length < 1 || allCountries.length === 0) {
      setSuggestions([]);
      return;
    }
    
    const filtered = allCountries.filter(country => 
      country.esName.toLowerCase().includes(query.toLowerCase()) ||
      country.name.toLowerCase().includes(query.toLowerCase()) ||
      country.code.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
    
    setSuggestions(filtered);
  }, [query, allCountries]);

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
    setQuery(country.esName);
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
          placeholder={isSyncing ? "Sincronizando países..." : "Busca cualquier país del mundo..."}
          className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-2xl pl-12 pr-12 py-3 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none transition-all backdrop-blur-md"
          disabled={isSyncing}
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
                  <div className="text-white font-medium">{country.esName}</div>
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
