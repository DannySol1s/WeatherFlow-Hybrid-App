import { supabase } from './supabase';

/**
 * Llama a la Edge Function 'fetch-weather' en lugar de interactuar directamente
 * con OpenWeather y con la Base de datos sin seguridad.
 * 
 * @param {Object} payload Los datos a enviar a la Edge Function
 * @returns {Promise<Object>} Datos del clima (JSON puro de la API)
 */
const invokeFetchWeather = async (payload) => {
    try {
        const { data, error } = await supabase.functions.invoke('fetch-weather', {
            body: payload,
        });

        if (error) {
            console.error("Error desde Edge Function:", error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error("Error invocando Fetch Weather:", error);
        throw error;
    }
};

export const fetchAndStoreWeather = async (city, moduleOwner) => {
    return await invokeFetchWeather({
        action: 'current_city',
        city,
        moduleOwner
    });
};

export const fetchWeatherByCoords = async (lat, lon, moduleOwner) => {
    return await invokeFetchWeather({
        action: 'current_coords',
        lat,
        lon,
        moduleOwner
    });
};

export const fetch5DayForecast = async (query, isCoords = false) => {
    return await invokeFetchWeather({
        action: 'forecast',
        query,
        isCoords
    });
};
