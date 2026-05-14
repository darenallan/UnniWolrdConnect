import { apiRequest } from "@/lib/api";

export type MentorRequest = {
  id: string;
  studentId: string;
  studentName: string;
  mentorId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: unknown;
  respondedAt?: unknown;
};

export function sendMentorRequest(mentorId: string, message?: string) {
  return apiRequest<{ message: string; id: string }>("/mentors/request", {
    method: "POST",
    body: JSON.stringify({ mentorId, message }),
  });
}

export function getMentorRequests() {
  return apiRequest<{ requests: MentorRequest[] }>("/mentors/requests").then(d => d.requests);
}

export function updateMentorRequestStatus(requestId: string, status: 'accepted' | 'rejected') {
  return apiRequest<{ message: string }>(`/mentors/requests/${requestId}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
