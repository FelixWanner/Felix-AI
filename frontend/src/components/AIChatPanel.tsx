import { useState, useRef, useEffect, FormEvent } from 'react'
import { MessageCircle, Send, X, Loader2, Bot, User, FileText, Sparkles } from 'lucide-react'

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: Source[]
}

interface Source {
  title: string
  type?: string
  property?: string
  similarity?: string
}

interface AIChatPanelProps {
  className?: string
}

export default function AIChatPanel({ className = '' }: AIChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function generateId(): string {
    return Math.random().toString(36).substring(2, 15)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const query = input.trim()
    if (!query || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: query,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${N8N_WEBHOOK_URL}/rag-query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          chat_id: generateId()
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Parse the response
      let content = data.response || 'Keine Antwort erhalten.'
      let sources: Source[] = []

      // Try to extract sources from the response if they're formatted in the text
      // The RAG workflow formats sources in the response text
      if (content.includes('**Quellen**')) {
        const parts = content.split('**Quellen**')
        content = parts[0].trim()

        // Remove markdown formatting from content
        content = content
          .replace(':mag: **Dokumentensuche**\n\n', '')
          .replace('\n\n---\n:page_facing_up: ', '')
          .trim()
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: content,
        timestamp: new Date(),
        sources: sources
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)

      const errorMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut. Stelle sicher, dass n8n läuft und der RAG-Query Workflow aktiv ist.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 ${className}`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-medium">KI-Assistent</span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t-2xl">
            <div className="flex items-center gap-2 text-white">
              <Bot className="w-5 h-5" />
              <span className="font-semibold">Life OS Assistent</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mb-4">
                  <Bot className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Hallo! Wie kann ich helfen?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Ich kann deine Dokumente durchsuchen und Fragen beantworten.
                </p>
                <div className="space-y-2 w-full">
                  <button
                    onClick={() => setInput('Was steht in meinen Mietverträgen?')}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Was steht in meinen Mietverträgen?
                  </button>
                  <button
                    onClick={() => setInput('Zeige mir die wichtigsten Finanzdaten')}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Zeige mir die wichtigsten Finanzdaten
                  </button>
                  <button
                    onClick={() => setInput('Wann laufen Kredite aus?')}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Wann laufen Kredite aus?
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    )}

                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-1' : ''}`}>
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.sources.map((source, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                            >
                              <FileText className="w-3 h-3" />
                              <span>{source.title}</span>
                              {source.similarity && (
                                <span className="text-green-600 dark:text-green-400">
                                  ({source.similarity})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>

                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center order-2">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-gray-100 dark:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600 dark:text-purple-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Suche in Dokumenten...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-gray-200 dark:border-gray-700"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Stelle eine Frage..."
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center justify-center hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
