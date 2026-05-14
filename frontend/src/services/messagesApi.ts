import { apiRequest } from "@/lib/api";

export type Conversation = {
  id: string;
  participants?: string[];
  participantsInfo?: Record<string, { name?: string; avatar?: string }>;
  lastMessage?: string;
  lastMessageAt?: unknown;
  lastSenderId?: string;
  createdAt?: unknown;
};

export function getConversations() {
  return apiRequest<{ conversations: Conversation[] }>("/messages/conversations").then((data) => data.conversations);
}

export function uploadAudio(file: File) {
  const formData = new FormData();
  formData.append("audio", file);
  return apiRequest<{ audioUrl: string }>("/messages/upload-audio", {
    method: "POST",
    body: formData,
  });
}

export function getOrCreateConversation(otherUserId: string) {
  return apiRequest<Conversation>("/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ otherUserId }),
  });
}

export function getConversationMeta(conversationId: string) {
  return apiRequest<Conversation>(`/messages/conversations/${conversationId}/meta`);
}

export function getIceBreakers(user1: any, user2: any) {
  return apiRequest<{ icebreakers: string[] }>("/ai/icebreakers", {
    method: "POST",
    body: JSON.stringify({ user1, user2 }),
  }).then((data) => data.icebreakers);
}
