import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Minimize2, Maximize2, MessageCircle, ThumbsUp, ThumbsDown, Paperclip, Mic, MicOff, Volume2, Globe, User, Loader2, Upload, Image as ImageIcon, Trash2, History } from 'lucide-react';
import {
  sendChatbotMessage,
  processQuickCommand,
  getChatbotConversation,
  getSuggestedQuestions,
  submitChatbotFeedback,
  deleteChatbotConversation,
  ChatMessage,
  sendVoiceMessage,
  sendImageForAnalysis,
  ChatbotResponse,
} from '../action/chatbot.action';

interface ChatbotWidgetProps {
  className?: string;
}

const translations = {
  en: {
    title: 'SmartSite Assistant',
    placeholder: 'Type your message or ask a question...',
    send: 'Send',
    suggestedQuestions: 'Suggested Questions',
    quickReplies: 'Quick Replies',
    newConversation: 'New Conversation',
    deleteConversation: 'Delete conversation',
    confirmDelete: 'Are you sure you want to delete this conversation?',
    loading: 'Analyzing...',
    error: 'Something went wrong. Please try again.',
    feedbackThanks: 'Thank you for your feedback!',
    voiceRecording: 'Click to record',
    voiceRecordingStop: 'Click to stop',
    voiceProcessing: 'Processing voice...',
    uploadImage: 'Upload image',
    imageAnalyzing: 'Analyzing image...',
    imageReady: 'Image ready for analysis',
    language: 'Language',
  },
  fr: {
    title: 'Assistant SmartSite',
    placeholder: 'Tapez votre message ou posez une question...',
    send: 'Envoyer',
    suggestedQuestions: 'Questions suggérées',
    quickReplies: 'Réponses rapides',
    newConversation: 'Nouvelle conversation',
    deleteConversation: 'Supprimer la conversation',
    confirmDelete: 'Êtes-vous sûr de vouloir supprimer cette conversation?',
    loading: 'Analyse en cours...',
    error: 'Une erreur est survenue. Veuillez réessayer.',
    feedbackThanks: 'Merci pour votre retour!',
    voiceRecording: 'Cliquez pour enregistrer',
    voiceRecordingStop: 'Cliquez pour arrêter',
    voiceProcessing: 'Traitement de la voix...',
    uploadImage: 'Télécharger une image',
    imageAnalyzing: 'Analyse de l\'image...',
    imageReady: 'Image prête pour analyse',
    language: 'Langue',
  },
  ar: {
    title: 'مساعد SmartSite',
    placeholder: 'اكتب رسالتك أو اطرح سؤالا...',
    send: 'إرسال',
    suggestedQuestions: 'الأسئلة المقترحة',
    quickReplies: 'إجابات سريعة',
    newConversation: 'محادثة جديدة',
    deleteConversation: 'حذف المحادثة',
    confirmDelete: 'هل أنت متأكد من حذف هذه المحادثة؟',
    loading: 'جاري التحليل...',
    error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    feedbackThanks: 'شكرا لملاحظاتك!',
    voiceRecording: 'انقر للتسجيل',
    voiceRecordingStop: 'انقر للإيقاف',
    voiceProcessing: 'معالجة الصوت...',
    uploadImage: 'تحميل صورة',
    imageAnalyzing: 'تحليل الصورة...',
    imageReady: 'الصورة جاهزة للتحليل',
    language: 'اللغة',
  },
};

const defaultSuggestions = [
  { en: 'How to create a new construction site?', fr: 'Comment créer un nouveau chantier?', ar: 'كيفية إنشاء موقع بناء جديد؟' },
  { en: 'View site status', fr: 'Voir le statut du site', ar: 'عرض حالة الموقع' },
  { en: 'What are my deadlines?', fr: 'Quelles sont mes échéances ?', ar: 'ما هي مواعيد النهائي؟' },
  { en: 'Show team information', fr: 'Afficher les informations de l\'équipe', ar: 'عرض معلومات الفريق' },
  { en: 'Report an issue', fr: 'Signaler un problème', ar: 'الإبلاغ عن مشكلة' },
  { en: 'How to add a new worker?', fr: 'Comment ajouter un nouvel ouvrier?', ar: 'كيفية إضافة عامل جديد؟' },
  { en: 'Equipment management', fr: 'Gestion des équipements', ar: 'إدارة المعدات' },
  { en: 'Safety guidelines', fr: 'Consignes de sécurité', ar: 'إرشادات السلامة' },
];

const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [language, setLanguage] = useState<'en' | 'fr' | 'ar'>('en');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const transcribedTextRef = useRef('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];
  const isRTL = language === 'ar';

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadInitialSuggestions();
    }
  }, [isOpen, language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadInitialSuggestions = async () => {
    try {
      const result = await getSuggestedQuestions(language);
      if (result.success && result.data?.questions) {
        setSuggestions(result.data.questions);
      } else {
        setSuggestions(defaultSuggestions.map((s) => s[language]));
      }
    } catch (error) {
      setSuggestions(defaultSuggestions.map((s) => s[language]));
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Check if it's a quick command
      if (message.startsWith('/')) {
        const result = await processQuickCommand(message, language);
        handleResponse(result, true);
      } else {
        const result = await sendChatbotMessage(message, language, conversationId);
        handleResponse(result, false);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: t.error,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponse = (result: ChatbotResponse, isCommand: boolean) => {
    if (result.success && result.data) {
      if (!conversationId && result.data.conversationId) {
        setConversationId(result.data.conversationId);
      }

      if (result.data.responses && result.data.responses.length > 0) {
        // Combine all responses into a single message
        const combinedContent = result.data.responses.join('\n');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: combinedContent,
            timestamp: new Date(),
          },
        ]);
      }

      if (result.data.suggestions) {
        setSuggestions(result.data.suggestions);
      }

      if (result.data.quickReplies && !isCommand) {
        setQuickReplies(result.data.quickReplies);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.message || t.error,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
    setQuickReplies([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
    setSuggestions([]);
  };

  const handleFeedback = async (
    messageIndex: number,
    feedback: 'positive' | 'negative',
  ) => {
    const message = messages[messageIndex];
    if (!message || !conversationId) return;

    try {
      await submitChatbotFeedback(conversationId, messageIndex.toString(), feedback);
      setShowFeedback(null);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(undefined);
    setQuickReplies([]);
    setSelectedImage(null);
    setImagePreview(null);
    loadInitialSuggestions();
  };

  const toggleLanguage = () => {
    const languages: ('en' | 'fr' | 'ar')[] = ['en', 'fr', 'ar'];
    const currentIndex = languages.indexOf(language);
    setLanguage(languages[(currentIndex + 1) % languages.length]);
  };

  const getLanguageLabel = (lang: 'en' | 'fr' | 'ar') => {
    const labels = { en: 'EN', fr: 'FR', ar: 'عربي' };
    return labels[lang];
  };

  // Real-time speech recognition (voice to text)
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'ar' ? 'ar-SA' : language === 'fr' ? 'fr-FR' : 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscribedText('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        transcribedTextRef.current += finalTranscript + ' ';
        setTranscribedText(transcribedTextRef.current);
      } else {
        setTranscribedText(transcribedTextRef.current + interimTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        toast.error('Voice recognition error');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalText = transcribedTextRef.current.trim();
      if (finalText) {
        setInputValue((prev) => prev + finalText + ' ');
        // Clear the ref for next session
        transcribedTextRef.current = '';
      }
      setTranscribedText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      // Transfer the captured text to input
      const finalText = transcribedTextRef.current.trim();
      if (finalText) {
        setInputValue((prev) => prev + finalText + ' ');
      }
      transcribedTextRef.current = '';
      setTranscribedText('');
    }
  };

  // Voice recording functions (for sending voice to backend)
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessingVoice(true);
    }
  };

  const processVoiceMessage = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      const result = await sendVoiceMessage(audioBlob, language);
      handleResponse(result, false);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: t.error,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessingVoice(false);
      setIsLoading(false);
    }
  };

  // Image handling functions
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setIsAnalyzingImage(true);
    setIsLoading(true);

    try {
      // Add the image as a user message FIRST
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: `[Image: ${selectedImage.name}]`,
          timestamp: new Date(),
        },
      ]);
      
      // Then get the analysis response
      const result = await sendImageForAnalysis(selectedImage, language);
      handleResponse(result, false);
      
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: t.error,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAnalyzingImage(false);
      setIsLoading(false);
    }
  };

  const cancelImageUpload = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    
    if (window.confirm(t.confirmDelete)) {
      try {
        await deleteChatbotConversation(conversationId);
        handleNewConversation();
      } catch (error) {
        console.error('Delete conversation error:', error);
      }
    }
  };

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-blue-500/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/40"
          aria-label="Open chat"
        >
          {/* Animated halo */}
          <span className="pointer-events-none absolute inset-0 rounded-full bg-blue-500/30 blur-md opacity-70 motion-safe:animate-pulse" />
          {/* Online status dot */}
          <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
          {/* Icon */}
          <MessageCircle className="relative w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" />
        </button>

        {/* Tooltip */}
        <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 rounded-md bg-slate-900 text-white text-xs px-2 py-1 whitespace-nowrap opacity-0 translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0">
          SmartSite Assistant
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-[420px] h-[650px]'
      } ${isRTL ? 'left-6 right-auto' : ''} ${className}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{t.title}</h3>
            <p className="text-blue-100 text-xs">Online • {language.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={t.language}
          >
            <Globe className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-white" />
            ) : (
              <Minimize2 className="w-4 h-4 text-white" />
            )}
          </button>
          {conversationId ? (
            <button
              onClick={handleDeleteConversation}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={language === 'ar' ? 'حذف المحادثة' : language === 'fr' ? 'Supprimer la conversation' : 'Delete conversation'}
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          ) : (
            <button
              onClick={handleNewConversation}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title={language === 'ar' ? 'محادثة جديدة' : language === 'fr' ? 'Nouvelle conversation' : 'New conversation'}
            >
              <MessageCircle className="w-4 h-4 text-white" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-gray-700 font-semibold mb-2">{t.title}</h4>
                <p className="text-gray-500 text-sm mb-4">
                  {language === 'ar'
                    ? 'اسألني عن أي شيء متعلق بالمشروع - المهام، المواقع، الفرق، المعدات،安全问题، والمزيد'
                    : language === 'fr'
                    ? 'Posez-moi des questions sur le projet - tâches, sites, équipes, équipements, sécurité, et plus encore'
                    : 'Ask me anything about the project - tasks, sites, teams, equipment, safety, and more'}
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? (isRTL ? 'justify-start' : 'justify-end') : isRTL ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div
                    className={`flex items-center gap-2 mt-1 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleFeedback(index, 'positive')}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3 h-3 text-gray-400 hover:text-green-500" />
                        </button>
                        <button
                          onClick={() => handleFeedback(index, 'negative')}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(isLoading || isProcessingVoice || isAnalyzingImage) && (
              <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600">
                      {isProcessingVoice
                        ? t.voiceProcessing
                        : isAnalyzingImage
                        ? t.imageAnalyzing
                        : t.loading}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="px-4 py-2 bg-white border-t border-gray-100">
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Selected"
                  className="h-20 w-20 object-cover rounded-lg"
                />
                <button
                  onClick={cancelImageUpload}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={handleImageUpload}
                disabled={isAnalyzingImage}
                className="ml-2 px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                Analyze
              </button>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && messages.length === 0 && (
            <div className="px-4 py-2 bg-white border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2 font-medium">{t.suggestedQuestions}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors font-medium"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Replies */}
          {quickReplies.length > 0 && (
            <div className="px-4 py-2 bg-white border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2 font-medium">{t.quickReplies}</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs bg-green-50 text-green-600 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors font-medium"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-gray-100">
            {/* Live transcription display */}
            {isListening && (
              <div className="mb-2 px-3 py-2 bg-blue-50 rounded-lg flex items-center gap-2">
                <Mic className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-sm text-blue-600 flex-1">{transcribedText || 'Listening...'}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {/* Voice Input Button (real-time speech to text) */}
              <button
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                className={`p-2.5 rounded-xl transition-colors ${
                  isListening
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title={isListening ? 'Stop listening' : 'Click to speak'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Image Upload Button */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                title={t.uploadImage}
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* File Attachment (disabled) */}
              <button
                className="p-2.5 text-gray-300 rounded-xl cursor-not-allowed"
                title="Document upload coming soon"
                disabled
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Audio Response (disabled) */}
              <button
                className="p-2.5 text-gray-300 rounded-xl cursor-not-allowed"
                title="Audio responses coming soon"
                disabled
              >
                <Volume2 className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                  placeholder={t.placeholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
              </div>

              {/* Send Button */}
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatbotWidget;
