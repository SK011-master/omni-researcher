import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, Download, CornerRightDown, Terminal } from "lucide-react";

interface MarkdownViewerProps {
  content: string;
  isStreaming: boolean;
  agentName: string;
}

export default function MarkdownViewer({ content, isStreaming, agentName }: MarkdownViewerProps) {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom while streaming
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [content, isStreaming]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Omni_Research_${agentName.toLowerCase().replace(/\s+/g, "_")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-900 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-900 bg-zinc-900/20">
        <div className="flex items-center space-x-2.5">
          <div className="flex space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-zinc-600 font-mono text-[11px]">—</span>
          <div className="flex items-center space-x-1.5 font-mono text-[11px] text-zinc-400">
            <Terminal className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-semibold">{agentName.toUpperCase()} // WORKSPACE</span>
          </div>
        </div>

        {content && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900/30 px-2.5 py-1.5 font-mono text-[10px] text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700 transition"
              title="Copy to Clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-900/30 px-2.5 py-1.5 font-mono text-[10px] text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700 transition"
              title="Download Markdown File"
            >
              <Download className="h-3 w-3" />
              <span>Export</span>
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent select-text"
      >
        {content ? (
          <div className="markdown-body prose prose-invert max-w-none text-zinc-300 font-sans text-sm leading-relaxed space-y-4">
            <ReactMarkdown
              components={{
                h1: ({ ...props }) => <h1 className="text-xl font-bold tracking-tight text-white mt-6 mb-2" {...props} />,
                h2: ({ ...props }) => <h2 className="text-lg font-bold tracking-tight text-zinc-100 mt-5 mb-2 border-b border-zinc-900 pb-1" {...props} />,
                h3: ({ ...props }) => <h3 className="text-base font-semibold tracking-tight text-zinc-200 mt-4 mb-1" {...props} />,
                p: ({ ...props }) => <p className="mb-4 leading-relaxed text-zinc-300" {...props} />,
                ul: ({ ...props }) => <ul className="list-disc list-inside space-y-1.5 mb-4 pl-4" {...props} />,
                ol: ({ ...props }) => <ol className="list-decimal list-inside space-y-1.5 mb-4 pl-4" {...props} />,
                li: ({ ...props }) => <li className="text-zinc-300" {...props} />,
                a: ({ ...props }) => <a className="text-blue-400 hover:underline" target="_blank" rel="noreferrer" {...props} />,
                blockquote: ({ ...props }) => (
                  <blockquote className="border-l-2 border-blue-500 bg-blue-500/5 px-4 py-2 my-4 rounded-r-lg text-zinc-400 italic font-mono text-xs" {...props} />
                ),
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline ? (
                    <div className="relative my-4 rounded-xl border border-zinc-900 bg-zinc-950 overflow-hidden font-mono text-xs">
                      {match && (
                        <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-900 bg-zinc-900/20 text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                          {match[1]}
                        </div>
                      )}
                      <pre className="p-4 overflow-x-auto text-zinc-300">
                        <code {...props}>{children}</code>
                      </pre>
                    </div>
                  ) : (
                    <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-200 font-mono text-xs border border-zinc-800" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>

            {/* Glowing typewriter cursor at end of streaming markdown */}
            {isStreaming && (
              <span className="inline-flex items-center ml-1">
                <span className="w-1.5 h-4 bg-blue-500 animate-[pulse_0.8s_infinite] shadow-[0_0_8px_#3b82f6]" />
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full items-center justify-center text-center py-20">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/30 mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
              <CornerRightDown className="h-6 w-6 text-zinc-500 animate-bounce" />
            </div>
            <p className="font-mono text-xs text-zinc-500 font-medium">WORKSPACE INACTIVE</p>
            <p className="text-xs text-zinc-600 mt-1 max-w-xs leading-relaxed">
              Submit a research query in the bottom command terminal to trigger agent execution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
