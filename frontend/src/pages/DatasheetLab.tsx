import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ExcelData {
  fileName: string;
  sheets: { [sheetName: string]: any[][] };
  headers: { [sheetName: string]: string[] };
  rawData: string;
}

const DatasheetLab: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  useEffect(() => {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey !== 'your_api_key_here') {
      setApiKey(envKey);
    } else {
      const savedKey = localStorage.getItem('gemini_api_key');
      if (savedKey) {
        setApiKey(savedKey);
      }
    }
  }, []);

  const parseExcelFile = async (file: File): Promise<ExcelData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });

          const sheets: { [sheetName: string]: any[][] } = {};
          const headers: { [sheetName: string]: string[] } = {};
          let rawDataParts: string[] = [];

          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            sheets[sheetName] = jsonData;

            if (jsonData.length > 0) {
              headers[sheetName] = jsonData[0].map((h: any) => String(h || ''));
            }

            const csvData = XLSX.utils.sheet_to_csv(worksheet);
            rawDataParts.push(`=== Sheet: ${sheetName} ===\n${csvData}`);
          });

          resolve({
            fileName: file.name,
            sheets,
            headers,
            rawData: rawDataParts.join('\n\n')
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    try {
      const data = await parseExcelFile(file);
      setExcelData(data);

      const sheetInfo = Object.entries(data.sheets).map(([name, rows]) =>
        `• ${name}: ${rows.length - 1} rows, ${data.headers[name]?.length || 0} columns`
      ).join('\n');

      const systemMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've loaded your Excel file **"${file.name}"**.\n\n**Sheets:**\n${sheetInfo}\n\nYou can now ask me any questions about your data. I'll remember our conversation context, so feel free to ask follow-up questions!\n\nExamples:\n• "What's the total revenue?"\n• "Show me the top 5 products by sales"\n• "What's the average price?"\n• "Which items have status 'Active'?"`,
        timestamp: new Date()
      };

      setMessages([systemMessage]);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      alert('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.');
    }
  };

  const queryWithGemini = async (userQuery: string): Promise<string> => {
    if (!apiKey) {
      return "Please set your Gemini API key first. Click the settings icon in the input area.";
    }

    if (!excelData) {
      return "No Excel file loaded. Please upload a file first.";
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const conversationHistory = messages.map(msg =>
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');

      const prompt = `You are an Excel data analyst assistant. You have access to the following Excel file data:

FILE NAME: ${excelData.fileName}

DATA:
${excelData.rawData}

CONVERSATION HISTORY:
${conversationHistory}

USER'S NEW QUESTION: ${userQuery}

INSTRUCTIONS:
1. Answer the user's question based ONLY on the data provided above.
2. If the data doesn't contain the information needed, say so clearly.
3. Provide specific numbers and values from the data when answering.
4. Consider the conversation history for context - the user may be asking follow-up questions.
5. Format your response clearly with markdown for better readability.
6. If doing calculations, show the work briefly.
7. Be concise but thorough.

Your response:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      console.error('Gemini API error:', error);
      if (error.message?.includes('API_KEY')) {
        return "Invalid API key. Please check your Gemini API key and try again.";
      }
      return `Error querying Gemini: ${error.message || 'Unknown error occurred'}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!apiKey && excelData) {
      setShowApiKeyInput(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await queryWithGemini(currentInput);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, an error occurred while processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-white">
      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Enter Gemini API Key</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your API key is stored locally and never sent to our servers.
              Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIza..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !excelData ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <h1 className="text-3xl font-semibold text-gray-900 mb-8">What can I help with?</h1>
            {!apiKey && (
              <button
                onClick={() => setShowApiKeyInput(true)}
                className="text-sm text-gray-500 hover:text-gray-700 mb-4"
              >
                Set Gemini API Key
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4">
            {messages.map((message) => (
              <div key={message.id} className={`mb-6 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`flex gap-4 max-w-full ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    message.role === 'user' ? 'bg-gray-900' : 'bg-white border border-gray-200'
                  }`}>
                    {message.role === 'user' ? (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className={`${message.role === 'user' ? 'bg-gray-100 rounded-3xl px-5 py-3' : ''}`}>
                    <p className="text-[15px] leading-relaxed text-gray-900 whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex gap-1 items-center pt-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          {excelData && (
            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {excelData.fileName}
              </span>
              <button
                onClick={() => {
                  setExcelData(null);
                  setMessages([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end bg-gray-100 rounded-3xl">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 text-gray-500 hover:text-gray-700 transition-colors"
                title="Upload Excel file"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Excel Assistant"
                rows={1}
                className="flex-1 bg-transparent border-0 resize-none focus:ring-0 focus:outline-none py-4 px-0 text-[15px] text-gray-900 placeholder-gray-500 max-h-[200px]"
              />

              <button
                type="button"
                onClick={() => setShowApiKeyInput(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {input.trim() ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="p-4 text-gray-900 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="p-4 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Voice input (not available)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          <p className="mt-3 text-xs text-center text-gray-400">
            {apiKey ? 'Powered by Gemini AI' : 'Set your Gemini API key to start'} • Excel Assistant can make mistakes
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
};

export default DatasheetLab;
