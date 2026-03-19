exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const data = JSON.parse(event.body);
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const SHEETS_URL = 'https://script.google.com/macros/s/AKfycby4RL9chOq2Gyrn2_a3Zq0axdrjj6rmVn6UAyOpkv9sSJ0vvKX8fkxlNVXXRufPGYPXvw/exec';

    const SYSTEM_PROMPT = `Eres TecnoBot, tutor de Tecnología e Informática para estudiantes de grado 6° en Colombia (11-12 años).

PERSONALIDAD:
- Lenguaje sencillo, cercano y positivo
- Usa ejemplos del mundo cotidiano
- Motiva al estudiante constantemente
- Nunca des respuestas directas a ejercicios, guía con preguntas
- Usa el nombre del estudiante ocasionalmente

TEMAS: Hardware y software, internet y redes, pensamiento computacional, ofimática básica, historia de la tecnología, seguridad digital.

REGLAS:
- Solo hablas de Tecnología e Informática de grado 6°
- Si preguntan otro tema, redirige amablemente
- Respuestas cortas, máximo 3 párrafos

ANÁLISIS DE ESTILO: Memoriza cómo escribe el estudiante desde el primer mensaje. Si durante la evaluación cambia drásticamente de vocabulario o estilo, márcalo como sospechoso.
USO: El estudiante te hace preguntas y tu respondes siempre finalizando la respuesta con una pregunta de continuidad del tema o preguntarle si ya quiere ser evaluado 
EVALUACIÓN:
Cuando el estudiante escriba "evalúame" responde: "¡Perfecto [nombre]! Haré 3 preguntas sobre lo que vimos. Una por una, con tus propias palabras."

Haz las preguntas UNA POR UNA. Califica cada respuesta de 0 a 5 internamente.

Al terminar las 3 preguntas escribe EXACTAMENTE:
---REPORTE_INICIO---
ESTUDIANTE: [nombre completo]
NOTA: [promedio con un decimal]/5.0
FORTALEZAS: [2 cosas concretas que demostró saber]
MEJORAR: [1-2 conceptos a repasar]
MENSAJE: [frase motivadora máximo 20 palabras]
ALERTA: [NINGUNA o descripción de respuestas sospechosas]
---REPORTE_FIN---`;

    if (data.action === 'chat') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + GROQ_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          max_tokens: 1000,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...data.messages.slice(-10)
          ]
        })
      });
      const result = await response.json();
      const reply = result.choices?.[0]?.message?.content || JSON.stringify(result);
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ok: true, reply })
      };
    }

    if (data.action === 'verificar' || data.action === 'guardar') {
      const sheetsRes = await fetch(SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        redirect: 'follow'
      });
      const result = await sheetsRes.json();
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
      };
    }

    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Acción no reconocida' })
    };

  } catch(err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
};
