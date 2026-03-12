/**
 * Lista optimizada de países y sus códigos ISO.
 * Las ciudades ahora se obtienen dinámicamente vía API geográfica.
 */

export const COUNTRIES = [
  { name: 'Mexico', code: 'MX' },
  { name: 'Spain', code: 'ES' },
  { name: 'United States', code: 'US' },
  { name: 'Argentina', code: 'AR' },
  { name: 'Colombia', code: 'CO' },
  { name: 'Chile', code: 'CL' },
  { name: 'Peru', code: 'PE' },
  { name: 'Brazil', code: 'BR' },
  { name: 'Canada', code: 'CA' },
  { name: 'France', code: 'FR' },
  { name: 'Germany', code: 'DE' },
  { name: 'Italy', code: 'IT' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Japan', code: 'JP' },
  { name: 'China', code: 'CN' },
  { name: 'Australia', code: 'AU' },
  { name: 'India', code: 'IN' },
  { name: 'Portugal', code: 'PT' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'Switzerland', code: 'CH' }
].sort((a, b) => a.name.localeCompare(b.name));

export const GLOBAL_CITIES = [
  'Mexico City', 'New York', 'Tokyo', 'London', 'Paris', 
  'Dubai', 'Sydney', 'Moscow', 'Rio de Janeiro', 'Cairo',
  'Beijing', 'Mumbai', 'Berlin', 'Madrid', 'Toronto'
];
