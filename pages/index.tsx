'use client';

import { useState, useEffect, useRef, FormEvent } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export default function PersonalizedLearningAssistant() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [revisionPlan, setRevisionPlan] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        setInput(event.results[0][0].transcript);
      };
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input, subject })
      });

      const data = await res.json();
      if (res.ok) {
        let displayedText = "";
        for (let i = 0; i < data.answer.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 20));
          displayedText += data.answer[i];
          setResponse(displayedText);
        }
        setHistory(prev => [...prev, `Subject: ${subject}\nYou: ${input}\nAI: ${data.answer}`]);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput("");
    setResponse("");
    setError("");
  };

  const handleExport = () => {
    const blob = new Blob([history.join('\n\n')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'chat_history.txt';
    link.click();
  };

  const handleSpeechInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const generateRevisionPlan = async () => {
    if (history.length === 0) return;

    setLoading(true);
    setRevisionPlan("");

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `Create a concise revision plan from the following conversation:\n${history.join("\n\n")}`,
          subject
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setRevisionPlan(data.answer);
      } else {
        setError("Could not generate revision.");
      }
    } catch {
      setError("Failed to generate revision plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-600 to-purple-700 flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8 animate-fadeIn">
          <img src="OIP.jpg" alt="AI assistant icon" className="mx-auto mb-4 rounded-full border-4 border-white shadow-lg" />
          <h1 className="text-4xl font-bold text-white mb-2">Personalized Learning Assistant</h1>
          <p className="text-lg text-blue-100">Your AI companion for customized education</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/90 text-black backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-6">
          <select
            className="mb-4 p-2 rounded-xl border border-gray-300 w-full"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            <option value="">Select a Subject</option>
            <option value="Python">Python</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Java">Java</option>
            <option value="ReactJS">ReactJS</option>
            <option value="DBMS">DBMS</option>
          </select>

          <div className="relative mb-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-4 pr-20 text-lg text-gray-900 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What would you like to ask?"
              autoComplete="off"
            />
            <button type="button" onClick={handleClear} className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              🧹
            </button>
            <button type="button" onClick={handleSpeechInput} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
              🎤
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center">
            <span>{loading ? "Processing..." : "Ask Question"}</span>
            {loading && (
              <svg className="animate-spin h-5 w-5 ml-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
          </button>
        </form>

        {response && (
          <div className="bg-white/90 text-black backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-6 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Response</h2>
            <div className="text-gray-700 whitespace-pre-line">{response}</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 border-l-4 border-red-500 p-4 mb-6 animate-fadeIn">
            <p>{error}</p>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-white/80 text-black p-4 rounded-xl mb-4">
            <h3 className="font-semibold mb-2">Chat History</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-800 max-h-60 overflow-auto">
              {history.map((item, idx) => <li key={idx}>{item}</li>)}
            </ul>
            <button onClick={handleExport} className="mt-4 mr-4 text-sm text-blue-600 underline hover:text-blue-800">Export Chat</button>
            <button onClick={generateRevisionPlan} className="mt-4 text-sm text-green-700 underline hover:text-green-900">🧠 Generate Revision Plan</button>
          </div>
        )}

        {revisionPlan && (
          <div className="bg-green-50 text-green-800 border-l-4 border-green-500 p-4 mb-6 rounded-xl animate-fadeIn">
            <h3 className="font-semibold mb-2">Revision Plan</h3>
            <p className="whitespace-pre-line">{revisionPlan}</p>
          </div>
        )}
      </div>
    </div>
  );
}
