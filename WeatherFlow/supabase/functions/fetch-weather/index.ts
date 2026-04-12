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

    // action can be 'current_city', 'current_coords', 'forecast'
    const { action, city, lat, lon, moduleOwner, query, isCoords } = body;

    let apiUrl = '';
    const BASE_URL = 'https://api.openweathermap.org/data/2.5';

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
