"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { toast } from "sonner";
import { Send, Mic, Phone, Video, Paperclip, MapPin } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  type: "text" | "voice" | "location" | "arrival_confirmation";
  timestamp: Date;
  orderId?: string;
  location?: { lat: number; lng: number };
}

interface DeliveryConversation {
  orderId: string;
  materialName: string;
  supplierName: string;
  siteName: string;
  status: string;
  lastMessage?: Message;
  unreadCount: number;
}

interface DeliveryChatProps {
  currentUser: {
    id: string;
    name: string;
    role: "works_manager" | "procurement_manager";
  };
}

export default function DeliveryChat({ currentUser }: DeliveryChatProps) {
  const [conversations, setConversations] = useState<DeliveryConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DeliveryConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mockConversations: DeliveryConversation[] = [
    {
      orderId: "ORD-123",
      materialName: "Ciment",
      supplierName: "Ciments Bizerte",
      siteName: "Chantier Tunis Centre",
      status: "in_transit",
      unreadCount: 2,
      lastMessage: {
        id: "1",
        senderId: "user-2",
        senderName: "Ahmed Ben Ali",
        senderRole: "works_manager",
        content: "Le truck est-il arrivé chez le fournisseur?",
        type: "text",
        timestamp: new Date(Date.now() - 300000),
        orderId: "ORD-123",
      },
    },
    {
      orderId: "ORD-456",
      materialName: "Fer à béton",
      supplierName: "Sider Goulette",
      siteName: "Chantier Sfax",
      status: "in_transit",
      unreadCount: 0,
    },
    {
      orderId: "ORD-789",
      materialName: "Briques",
      supplierName: "Briques Sfax",
      siteName: "Chantier Sahel",
      status: "pending",
      unreadCount: 1,
    },
  ];

  const mockMessages: Message[] = [
    {
      id: "1",
      senderId: "user-2",
      senderName: "Ahmed Ben Ali",
      senderRole: "works_manager",
      content: "Bonjour, pouvez-vous me confirmer que le truck est parti du fournisseur?",
      type: "text",
      timestamp: new Date(Date.now() - 600000),
      orderId: "ORD-123",
    },
    {
      id: "2",
      senderId: "user-3",
      senderName: "Mohamed Chemiri",
      senderRole: "procurement_manager",
      content: "Oui, le truck a quitté le fournisseur il y a 30 minutes. Il devrait arriver dans 45 minutes.",
      type: "text",
      timestamp: new Date(Date.now() - 540000),
      orderId: "ORD-123",
    },
    {
      id: "3",
      senderId: "user-2",
      senderName: "Ahmed Ben Ali",
      senderRole: "works_manager",
      content: "Merci! Quand il arrivera au fournisseur pour charger, pouvez-vous me notifier?",
      type: "text",
      timestamp: new Date(Date.now() - 480000),
      orderId: "ORD-123",
    },
    {
      id: "4",
      senderId: "user-3",
      senderName: "Mohamed Chemiri",
      senderRole: "procurement_manager",
      content: "Bien sûr! Je vous enverrai une confirmation avec la localisation.",
      type: "text",
      timestamp: new Date(Date.now() - 420000),
      orderId: "ORD-123",
    },
    {
      id: "5",
      senderId: "user-2",
      senderName: "Ahmed Ben Ali",
      senderRole: "works_manager",
      content: "Le truck est-il arrivé chez le fournisseur?",
      type: "text",
      timestamp: new Date(Date.now() - 300000),
      orderId: "ORD-123",
    },
  ];

  useEffect(() => {
    setConversations(mockConversations);
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      setMessages(mockMessages.filter((m) => m.orderId === selectedConversation.orderId));
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.role === "works_manager" ? "Works Manager" : "Procurement Manager",
      senderRole: currentUser.role,
      content: newMessage,
      type: "text",
      timestamp: new Date(),
      orderId: selectedConversation.orderId,
    };

    setMessages([...messages, message]);
    setNewMessage("");
    toast.success("Message envoyé!");
  };

  const handleSendLocation = () => {
    if (!selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.role === "works_manager" ? "Works Manager" : "Procurement Manager",
      senderRole: currentUser.role,
      content: "📍 Position actuelle du truck",
      type: "location",
      timestamp: new Date(),
      orderId: selectedConversation.orderId,
      location: { lat: 36.8200, lng: 10.2000 },
    };

    setMessages([...messages, message]);
    toast.success("Localisation partagée!");
  };

  const handleArrivalConfirmation = () => {
    if (!selectedConversation) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.role === "works_manager" ? "Works Manager" : "Procurement Manager",
      senderRole: currentUser.role,
      content: "✅ Confirme: Le truck est arrivé au fournisseur et a commencé le chargement.",
      type: "arrival_confirmation",
      timestamp: new Date(),
      orderId: selectedConversation.orderId,
    };

    setMessages([...messages, message]);
    toast.success("Confirmation d'arrivée envoyée!");
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      const message: Message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.role === "works_manager" ? "Works Manager" : "Procurement Manager",
        senderRole: currentUser.role,
        content: "🎤 Message vocal",
        type: "voice",
        timestamp: new Date(),
        orderId: selectedConversation?.orderId,
      };
      setMessages([...messages, message]);
      toast.success("Message vocal envoyé!");
    } else {
      setIsRecording(true);
      toast.info("Enregistrement... Cliquez pour arrêter");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case "in_transit":
        return <Badge className="bg-blue-500">En cours</Badge>;
      case "delivered":
        return <Badge className="bg-green-500">Livré</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Conversations</CardTitle>
          <p className="text-sm text-gray-500">Livraisons en cours</p>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-2">
          {conversations.map((conv) => (
            <div
              key={conv.orderId}
              onClick={() => setSelectedConversation(conv)}
              className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                selectedConversation?.orderId === conv.orderId
                  ? "bg-blue-50 border-blue-300 border"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm">{conv.materialName}</span>
                {getStatusBadge(conv.status)}
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>🏭 {conv.supplierName}</div>
                <div>🏗️ {conv.siteName}</div>
              </div>
              {conv.unreadCount > 0 && (
                <div className="mt-2">
                  <Badge variant="destructive" className="text-xs">
                    {conv.unreadCount} nouveau(x) message(s)
                  </Badge>
                </div>
              )}
              {conv.lastMessage && (
                <div className="mt-2 text-xs text-gray-500 truncate">
                  {conv.lastMessage.senderName}: {conv.lastMessage.content}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    {selectedConversation.materialName}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    📦 {selectedConversation.supplierName} → 🏗️ {selectedConversation.siteName}
                  </p>
                </div>
                {getStatusBadge(selectedConversation.status)}
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUser.id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.senderId === currentUser.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="text-xs mb-1 opacity-75">
                      {msg.senderName} • {formatTime(msg.timestamp)}
                    </div>
                    <div className="text-sm">
                      {msg.type === "location" && <MapPin className="inline mr-1 h-4 w-4" />}
                      {msg.type === "arrival_confirmation" && "✅ "}
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendLocation}
                  title="Envoyer localisation"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleRecording}
                  className={isRecording ? "bg-red-100 text-red-600" : ""}
                  title="Message vocal"
                >
                  <Mic className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" title="Pièce jointe">
                  <Paperclip className="h-4 w-4" />
                </Button>
                {currentUser.role === "procurement_manager" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-100 text-green-700 hover:bg-green-200"
                    onClick={handleArrivalConfirmation}
                    title="Confirmer arrivée"
                  >
                    ✅ Arrivé
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Tapez votre message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Sélectionnez une conversation pour commencer
          </div>
        )}
      </Card>
    </div>
  );
}