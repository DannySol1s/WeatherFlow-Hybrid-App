# 🤖 Guía de Prompts: Arquitectura SkyWatch / WeatherLink Duo

Este documento contiene una colección de **prompts (instrucciones para IA)** altamente efectivos y estructurados que puedes utilizar para replicar, expandir o crear nuevos proyectos con una arquitectura similar a la de **SkyWatch**.

Estos prompts están diseñados para darle a la IA un contexto claro, requisitos técnicos estrictos y un enfoque en el rendimiento y diseño.

---

## 1. 🗄️ Base de Datos en Supabase (JSONB + GIN Index)

*Usa este prompt cuando necesites diseñar una tabla que almacene respuestas complejas de APIs externas (como el clima) de forma eficiente y que permita búsquedas ultra rápidas.*

> **Prompt:**
> *"Necesito diseñar el esquema de una base de datos en Supabase (PostgreSQL) para almacenar respuestas completas de una API externa (por ejemplo, el clima actual y pronósticos). 
> 
> Requisitos:
> 1. Crea una tabla principal llamada `api_logs`.
> 2. En lugar de crear 50 columnas para cada dato, usa una sola columna de tipo `JSONB` llamada `content` para guardar toda la respuesta de la API.
> 3. Implementa un **Índice GIN (Generalized Inverted Index)** sobre la columna `content` para que las consultas y filtrados (por ejemplo, buscar por nombre de ciudad dentro del JSON) sean extremadamente rápidos.
> 4. Habilita 'Realtime' en esta tabla para poder escuchar los cambios desde mi frontend en React.
> 
> Entrégame el código SQL completo para ejecutarlo en el SQL Editor de Supabase."*

---

## 2. 🧩 Creación de una Arquitectura Frontend Modular

*Usa este prompt para evitar el "código espagueti" y mantener tu frontend limpio, separando las funcionalidades en cápsulas o módulos independientes.*

> **Prompt:**
> *"Voy a crear una aplicación en React + Vite. Requiero que me ayudes a estructurar una arquitectura estrictamente **Modular**.
> 
> Reglas:
> 1. Crea una carpeta `src/modules/`. Cada funcionalidad principal (Ej. 'ConsultarClima', 'Estadisticas') debe vivir en su propia subcarpeta aquí.
> 2. Cada módulo debe ser predecible y exportar un componente principal por defecto (Ej. `index.jsx`).
> 3. Crea un componente `ModuleTemplate.jsx` que sirva como envoltura visual (wrapper). Este template debe recibir un `title`, un `icon` y `children` para asegurar que todos los módulos tengan el mismo diseño visual de tarjeta (Card).
> 4. Los módulos no deben depender directamente unos de otros, solo deben consumir estado global o props.
> 
> Dame la estructura de carpetas exacta y el código para `ModuleTemplate.jsx` y un ejemplo de un módulo consumiéndolo."*

---

## 3. 🧠 Generación de Reportes con Inteligencia Artificial "Local"

*Usa este prompt cuando quieras que la aplicación tome datos puros (JSON) y los convierta en texto narrativo y humano, sin depender de llamadas HTTP a APIs de pago (como OpenAI).*

> **Prompt:**
> *"Tengo un objeto JSON con datos del clima (temperatura máxima, mínima, humedad, velocidad del viento y si lloverá en los próximos días).
> 
> Necesito que programes una función en JavaScript/TypeScript puro llamada `generateAIWeatherReport(weatherData)`.
> Esta función debe actuar como un 'meteorólogo de IA local'. Debe usar condicionales avanzados para analizar los datos y devolver un **párrafo unificado, fluido y en lenguaje natural (Español)** resumiendo el clima.
> 
> Ejemplos de comportamiento:
> - Si la temperatura actual es 35°C y la humedad es 80%, debe decir algo como: 'El clima se percibe extremadamente bochornoso debido a la alta humedad...'
> - Si hay lluvia pronosticada y viento fuerte, debe advertir: 'Se esperan precipitaciones intensas acompañadas de ráfagas de viento, se recomienda precaución...'
> 
> La salida debe ser siempre un texto amigable y profesional. No uses APIs externas, toda la lógica debe ser local."*

---

## 4. 🎨 Sistema de Diseño Glassmorphism Premium

*Usa este prompt para lograr interfaces modernas, translúcidas y estéticamente atractivas que destaquen sobre diseños convencionales.*

> **Prompt:**
> *"Estoy construyendo una aplicación web en React con **Tailwind CSS**. Requiero implementar un sistema de diseño basado 100% en **Glassmorphism** (Efecto cristal).
> 
> Requisitos de UI:
> 1. El fondo principal de la App debe ser un gradiente moderno y dinámico (ej. tonos azules oceánicos o morados oscuros).
> 2. Dame las clases exactas de Tailwind para crear una 'Glass Card' reutilizable. Dicha tarjeta debe tener:
>    - Fondo blanco o negro semitransparente (ej. `bg-white/10`).
>    - Filtro de desenfoque de fondo alto (`backdrop-blur-md` o `lg`).
>    - Un borde muy sutil y claro para simular el reflejo del cristal (`border border-white/20`).
>    - Sombras suaves (`shadow-xl` o `shadow-lg`).
> 3. El texto debe ser altamente legible, usando preferentemente combinaciones de blanco y componentes que brillen o resalten levemente al pasar el mouse (`hover`)."*

---

## 5. 📱 Empaquetado a APK Nativo con Capacitor

*Usa este prompt para convertir tu proyecto web React/Vite existente en una aplicación instalable de Android (.APK) sin reescribir código.*

> **Prompt:**
> *"Tengo un proyecto web funcional construido con **React y Vite** que ya es totalmente responsive. Quiero compilarlo como una aplicación nativa de Android (.APK) utilizando **Capacitor**.
> 
> Dame los pasos exactos y comandos de terminal para:
> 1. Instalar Capacitor Core y CLI en mi proyecto.
> 2. Inicializar Capacitor e integrarlo con la carpeta `dist/` que genera Vite al hacer el 'build'.
> 3. Agregar la plataforma Android (`@capacitor/android`).
> 4. Sincronizar mis archivos web con el proyecto nativo de Android.
> 5. Indicarme qué comando usar para abrir el proyecto en Android Studio y así poder generar el APK firmado.
> 
> Explícalo paso a paso."*

---
*Este documento fue generado para documentar el conocimiento adquirido durante el desarrollo del proyecto y servir como herramienta de aceleración para desarrollos futuros.*

*-Ángel Daniel Solís Pérez|ISC 2026*
