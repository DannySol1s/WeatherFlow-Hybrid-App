import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = [
  'http://localhost:5173',                              // Servidor de pruebas web
  'http://localhost',                                   // Servidor en algunos móviles
  'capacitor://localhost',                              // Servidor de Capacitor (Android/iOS)
  'https://weatherflow-hybrid-app.vercel.app',         // Producción en Vercel
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  // Si el origin es válido, lo permitimos. Si no, usamos el primero por defecto para que la petición sea rechazada por el navegador ajeno.
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

// Mapa en memoria para Rate Limiting (por IP)
// Nota: En arquitecturas Serverless/Edge reales, este mapa es destruido entre peticiones si la función se apaga.
// Sirve como mitigación solo contra ataques masivos que recaigan sobre el mismo micro-servidor.
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS = 30; // máximo de peticiones permitidas por ventana
const WINDOW_MS = 60 * 1000; // ventana de 1 minuto (60,000 milisegundos)

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Manejar el "Preflight" o verificación que hace el navegador antes de enviar los datos
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // --- RATE LIMITING ---
  // Obtenemos la IP real del usuario. Si Supabase no la provee, usamos 'global' por seguridad.
  const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'global';
  
  if (clientIp) {
    const now = Date.now();
    const limitRecord = rateLimitMap.get(clientIp);

    if (limitRecord) {
      if (now - limitRecord.timestamp < WINDOW_MS) {
        if (limitRecord.count >= MAX_REQUESTS) {
          console.warn(`[RATE LIMIT] IP bloqueada temporalmente: ${clientIp}`);
          return new Response(JSON.stringify({ error: "Demasiadas peticiones. Por favor, intenta de nuevo en un minuto." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429, // 429: Too Many Requests
          });
        }
        limitRecord.count++;
      } else {
        // El tiempo pasó, reiniciar la ventana
        rateLimitMap.set(clientIp, { count: 1, timestamp: now });
      }
    } else {
      rateLimitMap.set(clientIp, { count: 1, timestamp: now });
    }
  }
  // ---------------------

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openweatherApiKey = Deno.env.get('OPENWEATHER_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !openweatherApiKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    // action can be 'current_city', 'current_coords', 'forecast', 'find_nearby', 'bulk_weather'
    const { action, city, lat, lon, moduleOwner, query, isCoords, cnt, cities } = body;

    let apiUrl = '';
    const BASE_URL = 'https://api.openweathermap.org/data/2.5';

    // --- Acción especial: bulk_weather (para Módulo Stats - Rankings globales/por país) ---
    if (action === 'bulk_weather') {
      if (!Array.isArray(cities) || cities.length === 0) {
        throw new Error("bulk_weather requiere un array 'cities' no vacío");
      }
      const results = await Promise.all(
        cities.map(async (loc: string | { city: string; country: string }) => {
          const isObj = typeof loc === 'object';
          const queryCity = isObj ? loc.city : loc;
          const displayCountry = isObj ? (loc as { city: string; country: string }).country : null;
          try {
            const res = await fetch(
              `${BASE_URL}/weather?q=${queryCity}&appid=${openweatherApiKey}&units=metric&lang=es`
            );
            if (!res.ok) return null;
            const data = await res.json();
            return { ...data, _displayCountry: displayCountry, _queryCity: queryCity };
          } catch {
            return null;
          }
        })
      );
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // --- Acción especial: find_nearby (para Módulo Stats - modo Local) ---
    if (action === 'find_nearby') {
      const count = cnt ?? 15;
      const nearbyUrl = `${BASE_URL}/find?lat=${lat}&lon=${lon}&cnt=${count}&appid=${openweatherApiKey}&units=metric&lang=es`;
      const nearbyRes = await fetch(nearbyUrl);
      if (!nearbyRes.ok) throw new Error(`OpenWeatherError: ${nearbyRes.statusText}`);
      const nearbyData = await nearbyRes.json();
      return new Response(JSON.stringify(nearbyData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'current_city') {
      apiUrl = `${BASE_URL}/weather?q=${city}&appid=${openweatherApiKey}&units=metric&lang=es`;
    } else if (action === 'current_coords') {
      apiUrl = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${openweatherApiKey}&units=metric&lang=es`;
    } else if (action === 'forecast') {
      if (isCoords) {
        const [flat, flon] = query.split(',');
        apiUrl = `${BASE_URL}/forecast?lat=${flat}&lon=${flon}&appid=${openweatherApiKey}&units=metric&lang=es`;
      } else {
        apiUrl = `${BASE_URL}/forecast?q=${query}&appid=${openweatherApiKey}&units=metric&lang=es`;
      }
    } else {
      throw new Error("Invalid action provided");
    }

    // Call OpenWeather
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`OpenWeatherError: ${response.statusText}`);
    }
    const weatherData = await response.json();

    // Insert into Supabase if it's current weather
    if (action === 'current_city' || action === 'current_coords') {
      const { error } = await supabase
        .from('weather_history')
        .insert([
          {
            module_owner: moduleOwner,
            content: weatherData,
          }
        ]);

      if (error) {
        console.error("Supabase insert error:", error);
      }
    }

    return new Response(JSON.stringify(weatherData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
