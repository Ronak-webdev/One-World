"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Mic, 
  MicOff, 
  X, 
  RotateCcw,
  Paperclip
} from "lucide-react";
import { marked } from "marked";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";
import type { ToolDefinition } from "@/lib/api";

interface Message {
  role: "user" | "ai";
  content: string;
  image?: string;
}

interface OllamaModel {
  name: string;
}

export function LabChatWorkspace({ toolkit, tool }: { toolkit: string; tool: ToolDefinition }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${newHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  useEffect(() => {
    const ensureEngine = async () => {
      try {
        await fetch(`${API_BASE_URL}/api/lab/ollama/ensure`);
        setTimeout(fetchModels, 1500);
      } catch (err) {
        console.error("Engine activation failed:", err);
      }
    };
    ensureEngine();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/lab/ollama/models`);
      if (res.ok) {
        const data = await res.json();
        setModels(data.models || []);
        if (data.models?.length > 0 && !selectedModel) {
          setSelectedModel(data.models[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to fetch Ollama models:", err);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        setInput((prev) => prev ? prev + " " + transcript : transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (overrideInput?: string) => {
    const text = overrideInput || input;
    if ((!text.trim() && !selectedImage) || isProcessing) return;

    const userMsg: Message = { 
      role: "user", 
      content: text.trim(), 
      image: selectedImage || undefined 
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSelectedImage(null);
    setIsProcessing(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const ollamaMessages = messages.concat(userMsg).map(m => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
        ...(m.image ? { images: [m.image.split(",")[1]] } : {})
      }));

      const res = await fetch(`${API_BASE_URL}/api/lab/ollama/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: ollamaMessages,
          stream: false,
          options: { temperature: 0.7 }
        })
      });

      if (!res.ok) throw new Error("Failed to get response");

      const data = await res.json();
      const aiResponse = data.message?.content || data.response || "Sorry, I couldn't generate a response.";
      setMessages((prev) => [...prev, { role: "ai", content: aiResponse }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { 
        role: "ai", 
        content: "❌ Error: Could not connect to Ollama. Make sure Ollama is running locally." 
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

  useEffect(() => {
    marked.setOptions({ breaks: true, gfm: true });
  }, []);

  return (
    <>
      <style>{`
        .chat-scroll-area::-webkit-scrollbar { display: none; }
        .chat-scroll-area { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* 
        KEY FIX: 
        - position: relative + inset-0 = fills parent completely regardless of parent's height setup
        - display flex + flex-direction column = children stack vertically
        - overflow hidden = clips content  
      */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "white",
        }}
      >
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-[radial-gradient(ellipse_at_center,#f3e6f4_0%,transparent_70%)] opacity-60" />
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} 
          />
        </div>

        {/* 
          SCROLL CONTAINER — THE REAL FIX:
          - flex: 1 = takes all remaining vertical space
          - minHeight: 0 = CRITICAL! overrides flex default min-height:auto so it CAN shrink
          - overflowY: auto = enables scroll when content overflows
        */}
        <div
          className="chat-scroll-area"
          style={{
            flex: 1,
            minHeight: 0,          // ← this is the magic line
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ width: "100%", maxWidth: "740px", padding: "32px 16px" }}>
            <AnimatePresence mode="wait">
              {messages.length === 0 ? (
                <motion.div 
                  key="hero"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <h1 className="mt-6 font-serif text-[clamp(28px,5vw,44px)] font-normal leading-tight text-[#1e1c2b]">
                    Your personal <span className="italic text-[#5b2e6b]">AI</span> companion.
                  </h1>
                  <p className="mt-3 max-w-[380px] text-sm leading-relaxed text-[#747185]">
                    Ask anything.
                  </p>
                  <div className="mt-10 flex flex-wrap justify-center gap-2.5">
                    {[
                      { label: "⚛️ Quantum physics", text: "Explain quantum physics in simple terms" },
                      { label: "🐍 Python script", text: "Write a Python script for data analysis" },
                      { label: "⚡ React performance", text: "How do I optimize React performance?" },
                      { label: "🚀 Sci-fi story", text: "Tell me a creative sci-fi story" },
                      { label: "🎨 CSS Debug", text: "Help me debug this CSS layout issue" },
                      { label: "🛡️ Local LLMs", text: "What are the benefits of running local LLMs?" }
                    ].map((chip, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSend(chip.text)}
                        className="flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-[13px] text-[#423d51] shadow-sm backdrop-blur transition-all hover:scale-105 hover:border-[#b082c9] hover:bg-white hover:text-[#2d1a3d]"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div className={cn(
                        "max-w-[85%] bubble px-5 py-3.5 text-[15.2px] leading-relaxed shadow-sm",
                        msg.role === "user" 
                          ? "rounded-3xl rounded-br-md bg-[#5b2e6b] text-white" 
                          : "rounded-3xl rounded-bl-md border border-[#e8e0eb] bg-white text-[#1e1c2b]"
                      )}>
                        {msg.image && (
                          <img 
                            src={msg.image} 
                            alt="Attached" 
                            className="mb-3 max-w-[260px] rounded-2xl shadow-sm border border-black/5"
                          />
                        )}
                        <div 
                          className="prose prose-sm max-w-none prose-headings:font-semibold prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-pre:bg-gray-900 prose-pre:text-gray-100"
                          dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
                        />
                      </div>
                    </motion.div>
                  ))}

                  {isProcessing && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex items-center gap-1.5 rounded-3xl rounded-bl-md border border-[#e8e0eb] bg-white px-5 py-4 shadow-sm">
                        <div className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ scale: [0.65, 1.1, 0.65], opacity: [0.4, 1, 0.4] }}
                              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 }}
                              className="h-1.5 w-1.5 rounded-full bg-[#b082c9]"
                            />
                          ))}
                        </div>
                        <span className="ml-1 text-[11px] font-black uppercase tracking-widest text-[#7b4a91]/60">Thinking...</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </AnimatePresence>
            {/* Scroll anchor */}
            <div ref={scrollRef} style={{ height: "16px", width: "100%" }} />
          </div>
        </div>

        {/* Input Area — flex-shrink: 0 so it never compresses */}
        <div
          style={{ flexShrink: 0, position: "relative", zIndex: 50 }}
          className="w-full flex justify-center"
        >
          <div className="w-full max-w-[740px] px-4 pb-6 pt-3">
            <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 pt-3 shadow-xl backdrop-blur-2xl focus-within:border-[#7b4a91] focus-within:shadow-2xl transition-all">
              
              <AnimatePresence>
                {selectedImage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative mb-3 inline-block"
                  >
                    <img 
                      src={selectedImage} 
                      alt="Preview" 
                      className="h-20 w-20 object-cover rounded-2xl border-2 border-[#b082c9] shadow" 
                    />
                    <button 
                      onClick={removeImage}
                      className="absolute -top-1.5 -right-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <textarea 
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message your AI..."
                className="w-full resize-none bg-transparent text-[15.5px] leading-relaxed text-[#1e1c2b] outline-none placeholder:text-[#9a8fa8] max-h-[160px] min-h-[28px] no-scrollbar pr-2"
                rows={1}
              />

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFile}
                    accept="image/*"
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#747185] hover:bg-[#f3e6f4] hover:text-[#5b2e6b] transition-all"
                    title="Attach image"
                  >
                    <Paperclip size={19} />
                  </button>

                  <select 
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="appearance-none rounded-full border border-[#e0d4e8] bg-white py-1.5 pl-4 pr-8 text-xs font-medium text-[#3f2a4f] shadow-sm focus:outline-none hover:border-[#b082c9] transition-colors cursor-pointer"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%235b2e6b' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    {models.length > 0 ? (
                      models.map((m) => (
                        <option key={m.name} value={m.name}>{m.name}</option>
                      ))
                    ) : (
                      <option value="">No models found</option>
                    )}
                  </select>

                  <button 
                    onClick={() => setMessages([])}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#747185] hover:bg-red-50 hover:text-red-500 transition-all"
                    title="Clear chat"
                  >
                    <RotateCcw size={17} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleVoice}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                      isListening 
                        ? "bg-red-100 text-red-500 animate-pulse" 
                        : "text-[#747185] hover:bg-[#f3e6f4] hover:text-[#5b2e6b]"
                    )}
                    title="Voice input"
                  >
                    {isListening ? <MicOff size={19} /> : <Mic size={19} />}
                  </button>

                  <button 
                    onClick={() => handleSend()}
                    disabled={isProcessing || (!input.trim() && !selectedImage)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2d1a3d] text-white shadow-md hover:bg-[#5b2e6b] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={17} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}