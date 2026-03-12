/**
 * Lista optimizada de países y sus códigos ISO.
 * name: Nombre en inglés (usado para la API de geografía).
 * esName: Nombre en español (usado para la interfaz de usuario).
 */

export const COUNTRIES = [
  { name: 'Mexico', esName: 'México', code: 'MX' },
  { name: 'Spain', esName: 'España', code: 'ES' },
  { name: 'United States', esName: 'Estados Unidos', code: 'US' },
  { name: 'Argentina', esName: 'Argentina', code: 'AR' },
  { name: 'Colombia', esName: 'Colombia', code: 'CO' },
  { name: 'Chile', esName: 'Chile', code: 'CL' },
  { name: 'Peru', esName: 'Perú', code: 'PE' },
  { name: 'Brazil', esName: 'Brasil', code: 'BR' },
  { name: 'Canada', esName: 'Canadá', code: 'CA' },
  { name: 'France', esName: 'Francia', code: 'FR' },
  { name: 'Germany', esName: 'Alemania', code: 'DE' },
  { name: 'Italy', esName: 'Italia', code: 'IT' },
  { name: 'United Kingdom', esName: 'Reino Unido', code: 'GB' },
  { name: 'Japan', esName: 'Japón', code: 'JP' },
  { name: 'China', esName: 'China', code: 'CN' },
  { name: 'Australia', esName: 'Australia', code: 'AU' },
  { name: 'India', esName: 'India', code: 'IN' },
  { name: 'Portugal', esName: 'Portugal', code: 'PT' },
  { name: 'Netherlands', esName: 'Países Bajos', code: 'NL' },
  { name: 'Switzerland', esName: 'Suiza', code: 'CH' }
].sort((a, b) => a.esName.localeCompare(b.esName));

export const GLOBAL_CITIES = [
  'Mexico City', 'New York', 'Tokyo', 'London', 'Paris', 
  'Dubai', 'Sydney', 'Moscow', 'Rio de Janeiro', 'Cairo',
  'Beijing', 'Mumbai', 'Berlin', 'Madrid', 'Toronto'
];
