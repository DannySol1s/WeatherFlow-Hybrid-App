import { supabase } from './supabase';

const API_KEY = '9881114244119304be93da42d1185931';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Consulta el clima actual para una ciudad y guarda el resultado en Supabase
 * @param {string} city - Nombre de la ciudad
 * @param {string} moduleOwner - Identificador del módulo ('ModuleForecast' o 'ModuleStats')
 * @returns {Promise<Object>} Datos del clima (JSON puro de la API)
 */
export const fetchAndStoreWeather = async (city, moduleOwner) => {
    try {
        const response = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`);

        if (!response.ok) {
            throw new Error(`Error en la solicitud: ${response.statusText}`);
        }

        const weatherData = await response.json();

        // Almacenando en Supabase usando la columna JSONB 'content'
        const { error } = await supabase
            .from('weather_history')
            .insert([
                {
                    module_owner: moduleOwner,
                    content: weatherData
                }
            ]);

        if (error) {
            console.error("Error insertando en Supabase:", error);
        }

        return weatherData;
    } catch (error) {
        console.error("Error en WeatherAPI:", error);
        throw error;
    }
};
