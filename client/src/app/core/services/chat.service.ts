import { Injectable } from '@angular/core';
import { HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface ChatSessionSummary {
  _id: string;
  title: string;
  manualId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSession extends ChatSessionSummary {
  vehicleId: string | null;
  messages: ChatMessage[];
}

export interface CreateSessionInput {
  manualId: string;
  vehicleId?: string | null;
}

export interface UpdateSessionInput {
  title?: string;
  vehicleId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  listSessions(): Observable<ChatSessionSummary[]> {
    return this.http.get<ChatSessionSummary[]>(`${this.apiUrl}/sessions`);
  }

  createSession(input: CreateSessionInput): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.apiUrl}/sessions`, input);
  }

  getSession(id: string): Observable<ChatSession> {
    return this.http.get<ChatSession>(`${this.apiUrl}/sessions/${id}`);
  }

  updateSession(id: string, patch: UpdateSessionInput): Observable<ChatSession> {
    return this.http.patch<ChatSession>(`${this.apiUrl}/sessions/${id}`, patch);
  }

  deleteSession(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/${id}`);
  }

  sendMessageStream(sessionId: string, message: string): Observable<string> {
    return this.http.post(this.apiUrl, { sessionId, message }, {
      observe: 'events',
      responseType: 'text',
      reportProgress: true
    }).pipe(
      filter((event: HttpEvent<string>): event is HttpDownloadProgressEvent =>
        event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.Response
      ),
      map((event: HttpDownloadProgressEvent | any) => {
        if (event.type === HttpEventType.DownloadProgress) {
          return this.parseSSEChunk(event.partialText as string);
        }
        if (event.type === HttpEventType.Response) {
          return this.parseSSEChunk(event.body as string);
        }
        return '';
      })
    );
  }

  private parseSSEChunk(text: string): string {
    if (!text) return '';
    const lines = text.split('\n');
    let fullMessage = '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const dataStr = line.substring(6);
      if (dataStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(dataStr);
        if (parsed.text) fullMessage += parsed.text;
        else if (parsed.error) fullMessage += `\nError: ${parsed.error}`;
      } catch {
        // ignore partial JSON chunks
      }
    }
    return fullMessage;
  }
}
