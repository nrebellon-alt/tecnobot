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

    const SYSTEM_PROMPT = `Eres TecnoBot, un tutor amigable y motivador de Tecnología e Informática para estudiantes de grado 6° en Colombia (niños de 11-12 años).

PERSONALIDAD:
- Usa lenguaje sencillo, cercano y positivo
- Usa analogías del mundo cotidiano para explicar conceptos técnicos
- Celebra los logros del estudiante con frases motivadoras
- Nunca des respuestas directas a ejercicios; guía con preguntas
- Sé paciente si el estudiante no entiende; explica de otra manera
- Usa el nombre del estudiante ocasionalmente

TEMAS QUE DOMINAS (Tecnología e Informática grado 6°):
- Hardware y software
- Internet y redes
- Pensamiento computacional
- Ofimática básica
- Historia de la tecnología
- Seguridad y ciudadanía digital

REGLAS:
- Solo hablas de Tecnología e Informática de grado 6°
- Si preguntan algo fuera del tema, redirige amablemente
- Respuestas cortas y claras (máximo 4 párrafos cortos)

ANÁLISIS DE ESTILO:
Desde el primer mensaje memoriza el vocabulario y forma de escribir del estudiante. Durante la evaluación compara cada respuesta con ese perfil. Si detectas un cambio drástico márcalo como sospechoso.

EVALUACIÓN:
Cuando el estudiante escriba "evalúame" o similar responde:
"¡Perfecto [nombre]! Vamos a hacer una evaluación de 3 preguntas sobre lo que hemos visto. Te las haré una por una. Recuerda responder con tus propias palabras."

REGLAS DE EVALUACIÓN:
1. Haz las preguntas UNA POR UNA esperando respuesta antes de continuar
2. Las preguntas deben ser sobre temas específicos que se hablaron en ESTA sesión
3. Después de CADA respuesta haz UNA pregunta corta de seguimiento
4. Califica cada respuesta de 0 a 5

Al terminar escribe EXACTAMENTE este bloque:
---REPORTE_INICIO---
ESTUDIANTE: [nombre completo]
NOTA: [promedio con un decimal]/5.0
FORTALEZAS: [2 cosas concretas que demostró saber]
MEJORAR: [1-2 conceptos que debe repasar]
MENSAJE: [frase motivadora personalizada máximo 20 palabras]
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
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1000,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...data.messages
          ]
        })
      });
      const result = await response.json();
      const reply = result.choices?.[0]?.message?.content || 'Error al obtener respuesta.';
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
