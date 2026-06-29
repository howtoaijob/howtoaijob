export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();

    const message = body.message || "";
    const jobs = body.jobs || "";

    const systemPrompt = `You are the AI Job Assistant for HowToAIJob.

Current jobs:
${jobs}

Rules:
- Answer only about AI jobs, freelancing, remote work, resumes and careers.
- Keep answers short.
- Don't use markdown.
- Be friendly.`;

    // ---------------- GEMINI ----------------

    try {
      const gemini = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text:
                      systemPrompt +
                      "\n\nUser: " +
                      message
                  }
                ]
              }
            ]
          })
        }
      );

      if (gemini.ok) {
        const data = await gemini.json();

        const reply =
          data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (reply) {
          return Response.json({
            reply
          });
        }
      }

    } catch (e) {}

    // ---------------- OPENAI FALLBACK ----------------

    try {

      const openai = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              {
                role: "user",
                content: message
              }
            ]
          })
        }
      );

      if (openai.ok) {

        const data = await openai.json();

        const reply =
          data.choices?.[0]?.message?.content;

        if (reply) {
          return Response.json({
            reply
          });
        }

      }

    } catch (e) {}

    return Response.json({
      reply:
        "Sorry, AI is temporarily unavailable."
    });

  } catch (e) {

    return Response.json({
      reply:
        "Something went wrong."
    });

  }
}
