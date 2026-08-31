import { useState, useEffect } from "react";
import { Key, ShieldCheck } from "lucide-react";

export default function ConfigModal({ onComplete }: { onComplete: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if credentials already exist
    const storedKey = localStorage.getItem("omni_gemini_key");
    let clientId = localStorage.getItem("omni_client_id");

    // Generate a permanent anonymous ID for this browser if it doesn't exist
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem("omni_client_id", clientId);
    }

    if (!storedKey) {
      setIsVisible(true);
    } else {
      onComplete();
    }
  }, [onComplete]);

  const handleSave = () => {
    if (apiKey.trim().length > 20) { // Basic validation
      localStorage.setItem("omni_gemini_key", apiKey.trim());
      setIsVisible(false);
      onComplete();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">System Authentication</h2>
            <p className="text-xs text-zinc-400">Provide your Google Gemini API Key</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/70 leading-relaxed">
            <ShieldCheck className="h-4 w-4 inline mr-1 text-amber-400 mb-0.5" />
            Your key is stored <strong>locally</strong> in your browser. It is never saved to our database and is only used to execute your personal research tasks.
          </div>
          
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 focus:border-blue-500 focus:outline-none"
          />
          
          <button
            onClick={handleSave}
            disabled={apiKey.length < 20}
            className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-500 disabled:opacity-50 transition"
          >
            Initialize Workspace
          </button>
        </div>
      </div>
    </div>
  );
}