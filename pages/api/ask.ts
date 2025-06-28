import type { NextApiRequest, NextApiResponse } from "next";

// Main handler
const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, subject } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: `You are a highly knowledgeable and supportive AI tutor. Respond clearly, personally, and helpfully to student questions. Provide revision plans when asked.`
          },
          {
            role: "user",
            content: subject
              ? `Subject: ${subject}\n\n${question}`
              : question
          }
        ],
        temperature: 0.7
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok || !data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "Groq API Error", details: data });
    }

    const answer = data.choices[0].message.content || "No response generated.";
    return res.status(200).json({ answer });

  } catch (err) {
    console.error("Groq API call failed:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export default handler;
