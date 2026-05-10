import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { provideIcons } from '@ng-icons/core';
import { lucideSend, lucidePlus, lucideTrash2, lucideFileText, lucidePanelLeftClose, lucidePanelLeftOpen, lucideMessageSquare } from '@ng-icons/lucide';
import { ChatService, ChatMessage, ChatSession, ChatSessionSummary } from '../../core/services/chat.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { KnowledgeService, Manual } from '../../core/services/knowledge.service';
import { Vehicle } from '../../core/interfaces/vehicle.interface';
import { MarkdownPipe } from '../../core/pipes/markdown.pipe';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, HlmButton, HlmInput, HlmIconImports, MarkdownPipe],
  providers: [provideIcons({ lucideSend, lucidePlus, lucideTrash2, lucideFileText, lucidePanelLeftClose, lucidePanelLeftOpen, lucideMessageSquare })],
  styles: [`
    .md-body :where(h1, h2, h3, h4) { font-weight: 600; margin: 0.75rem 0 0.25rem; line-height: 1.3; }
    .md-body h1 { font-size: 1.15rem; }
    .md-body h2 { font-size: 1.05rem; }
    .md-body h3 { font-size: 0.95rem; }
    .md-body p { margin: 0.35rem 0; }
    .md-body ul, .md-body ol { margin: 0.35rem 0; padding-left: 1.25rem; }
    .md-body ul { list-style: disc; }
    .md-body ol { list-style: decimal; }
    .md-body li { margin: 0.15rem 0; }
    .md-body code { background: var(--muted); padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.85em; }
    .md-body pre { background: var(--muted); padding: 0.75rem; border-radius: 0.5rem; overflow-x: auto; margin: 0.5rem 0; }
    .md-body pre code { background: transparent; padding: 0; }
    .md-body strong { font-weight: 600; }
    .md-body em { font-style: italic; }
    .md-body a { color: var(--primary); text-decoration: underline; }
    .md-body blockquote { border-left: 2px solid var(--border); padding-left: 0.75rem; color: var(--muted-foreground); margin: 0.5rem 0; }
  `],
  template: `
    <div class="h-[calc(100vh-4rem)] flex bg-background text-foreground overflow-hidden">

      <!-- Sessions sidebar (animated collapse) -->
      <aside
        class="shrink-0 border-r border-border/40 flex flex-col overflow-hidden transition-[width] duration-200 ease-out"
        [ngClass]="sidebarCollapsed ? 'w-14' : 'w-64'">

        <!-- Top bar with toggle + new chat -->
        <div class="p-3 flex items-center gap-2" [ngClass]="sidebarCollapsed ? 'flex-col' : ''">
          <button
            type="button"
            (click)="toggleSidebar()"
            class="h-9 w-9 shrink-0 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center justify-center transition-colors"
            [attr.aria-label]="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            [title]="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'">
            <ng-icon hlm size="sm" [name]="sidebarCollapsed ? 'lucidePanelLeftOpen' : 'lucidePanelLeftClose'"></ng-icon>
          </button>

          <button
            *ngIf="!sidebarCollapsed"
            hlmBtn size="sm"
            class="flex-1 justify-start gap-2"
            (click)="newSession()">
            <ng-icon hlm name="lucidePlus" size="sm"></ng-icon>
            <span class="whitespace-nowrap">New Chat</span>
          </button>

          <button
            *ngIf="sidebarCollapsed"
            type="button"
            (click)="newSession()"
            class="h-9 w-9 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors"
            title="New chat"
            aria-label="New chat">
            <ng-icon hlm name="lucidePlus" size="sm"></ng-icon>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3 space-y-1">
          <div *ngIf="!sidebarCollapsed && sessions.length === 0" class="text-xs text-muted-foreground px-3 py-2">
            No conversations yet.
          </div>

          <div
            *ngFor="let s of sessions"
            (click)="loadSession(s._id)"
            [title]="sidebarCollapsed ? (s.title || 'New conversation') : ''"
            class="rounded-md text-sm flex items-center gap-2 group transition-colors cursor-pointer"
            [ngClass]="[
              sidebarCollapsed ? 'h-10 w-10 justify-center mx-auto' : 'w-full px-3 py-2',
              s._id === activeSessionId ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            ]">
            <ng-icon hlm name="lucideMessageSquare" size="sm" class="shrink-0"></ng-icon>
            <span *ngIf="!sidebarCollapsed" class="flex-1 truncate whitespace-nowrap">{{ s.title || 'New conversation' }}</span>
            <button
              *ngIf="!sidebarCollapsed"
              class="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              (click)="deleteSession($event, s._id)"
              aria-label="Delete conversation">
              <ng-icon hlm name="lucideTrash2" size="sm"></ng-icon>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main chat column -->
      <section class="flex-1 flex flex-col min-w-0">

        <!-- Header -->
        <header class="px-10 pt-10 pb-6 shrink-0">
          <h1 class="text-2xl font-semibold tracking-tight text-foreground">Mechanify Assistant</h1>
          <p *ngIf="activeManualName" class="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <ng-icon hlm name="lucideFileText" size="sm"></ng-icon>
            Referencing <span class="text-foreground font-medium">{{ activeManualName }}</span>
          </p>
          <p *ngIf="!activeManualName" class="text-sm text-muted-foreground mt-1">
            Pick a manual to start a conversation.
          </p>
        </header>

        <!-- Manual picker (only shown when no active session) -->
        <div *ngIf="!activeSessionId" class="flex-1 overflow-y-auto px-10">
          <div class="max-w-2xl mx-auto py-10">
            <h2 class="text-lg font-medium text-foreground mb-1">Choose a manual</h2>
            <p class="text-sm text-muted-foreground mb-6">
              The assistant will answer questions grounded in this manual and cite page numbers.
            </p>

            <div *ngIf="manuals.length === 0" class="text-sm text-muted-foreground p-6 border border-dashed border-border rounded-lg bg-card/20">
              No manuals uploaded yet. Visit the Knowledge Base tab to upload a PDF first.
            </div>

            <div *ngIf="manuals.length > 0" class="space-y-2">
              <button
                *ngFor="let m of manuals"
                (click)="startConversation(m)"
                [disabled]="isStarting"
                class="w-full text-left p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-start gap-3">
                <ng-icon hlm name="lucideFileText" class="text-primary mt-0.5 shrink-0"></ng-icon>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-foreground truncate">{{ m.filename }}</div>
                  <div class="text-xs text-muted-foreground mt-0.5">
                    {{ (m.sizeBytes / 1024 / 1024).toFixed(2) }} MB · uploaded {{ m.uploadDate | date:'mediumDate' }}
                  </div>
                </div>
              </button>
              <p *ngIf="isStarting" class="text-xs text-muted-foreground pt-2">Preparing your assistant…</p>
            </div>
          </div>
        </div>

        <!-- Conversation (only shown when session active) -->
        <div *ngIf="activeSessionId" #scrollContainer class="flex-1 overflow-y-auto px-10">
          <div class="max-w-3xl mx-auto space-y-8 pb-8">

            <div *ngFor="let msg of messages" class="flex gap-4"
                 [ngClass]="msg.role === 'user' ? 'flex-row-reverse' : ''">
              <div class="shrink-0 mt-1">
                <div class="w-2 h-2 rounded-full"
                     [ngClass]="msg.role === 'user' ? 'bg-primary' : 'bg-muted-foreground/60'"></div>
              </div>
              <div *ngIf="msg.role === 'user'"
                   class="bg-primary text-primary-foreground rounded-2xl px-5 py-3 max-w-[75%] whitespace-pre-wrap text-sm leading-relaxed">
                {{ msg.content }}
              </div>
              <div *ngIf="msg.role === 'assistant'"
                   class="md-body text-foreground max-w-[80%] text-sm leading-relaxed"
                   [innerHTML]="msg.content | markdown">
              </div>
            </div>

            <div *ngIf="isLoading && !streamingContent" class="flex gap-4">
              <div class="shrink-0 mt-1">
                <div class="w-2 h-2 rounded-full bg-muted-foreground/60"></div>
              </div>
              <div class="flex items-center gap-1.5 pt-1">
                <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style="animation-delay: 0.15s"></span>
                <span class="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style="animation-delay: 0.3s"></span>
              </div>
            </div>

          </div>
        </div>

        <!-- Context strip + composer (only when session active) -->
        <div *ngIf="activeSessionId" class="px-10 pb-10 pt-2 shrink-0">
          <div class="max-w-3xl mx-auto space-y-3">

            <div class="flex items-center gap-3 text-xs text-muted-foreground">
              <label class="flex items-center gap-2">
                <span>Vehicle</span>
                <select
                  [(ngModel)]="selectedVehicleId"
                  (ngModelChange)="onVehicleChange()"
                  class="bg-card border border-border text-foreground rounded-md py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                  <option [ngValue]="null">None</option>
                  <option *ngFor="let v of vehicles" [ngValue]="v._id">
                    {{ v.year }} {{ v.make }} {{ v.model }}
                  </option>
                </select>
              </label>
            </div>

            <form (ngSubmit)="sendMessage()" class="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2">
              <input
                hlmInput
                [(ngModel)]="currentInput"
                name="messageInput"
                placeholder="Ask about the manual..."
                class="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
                [disabled]="isLoading"
                autocomplete="off"
              />
              <button hlmBtn type="submit" size="sm" [disabled]="!currentInput.trim() || isLoading" class="gap-2">
                <ng-icon hlm name="lucideSend" size="sm"></ng-icon>
                Send
              </button>
            </form>

          </div>
        </div>

      </section>
    </div>
  `
})
export class Chat implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  sessions: ChatSessionSummary[] = [];
  activeSessionId: string | null = null;
  activeManualId: string | null = null;
  activeManualName: string | null = null;
  sidebarCollapsed = false;

  messages: ChatMessage[] = [];
  currentInput = '';
  isLoading = false;
  streamingContent = false;
  isStarting = false;

  vehicles: Vehicle[] = [];
  selectedVehicleId: string | null = null;

  manuals: Manual[] = [];

  constructor(
    private chatService: ChatService,
    private vehicleService: VehicleService,
    private knowledgeService: KnowledgeService
  ) {}

  ngOnInit() {
    this.vehicleService.getVehicles().subscribe({
      next: (data) => (this.vehicles = data),
      error: () => (this.vehicles = [])
    });
    this.knowledgeService.getManuals().subscribe({
      next: (data) => (this.manuals = data),
      error: () => (this.manuals = [])
    });
    this.refreshSessions(true);
  }

  ngAfterViewChecked() {
    try {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }

  refreshSessions(autoLoadFirst = false) {
    this.chatService.listSessions().subscribe({
      next: (data) => {
        this.sessions = data;
        if (autoLoadFirst && !this.activeSessionId && data.length > 0) {
          this.loadSession(data[0]._id);
        }
      },
      error: () => (this.sessions = [])
    });
  }

  loadSession(id: string) {
    this.chatService.getSession(id).subscribe({
      next: (session: ChatSession) => {
        this.activeSessionId = session._id;
        this.activeManualId = session.manualId;
        this.activeManualName = this.manuals.find(m => m._id === session.manualId)?.filename
          || session.title
          || null;
        this.messages = session.messages || [];
        this.selectedVehicleId = session.vehicleId || null;
      },
      error: (err) => console.error('Failed to load session', err)
    });
  }

  newSession() {
    this.activeSessionId = null;
    this.activeManualId = null;
    this.activeManualName = null;
    this.messages = [];
    this.selectedVehicleId = null;
    this.currentInput = '';
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  startConversation(manual: Manual) {
    if (!manual._id || this.isStarting) return;
    this.isStarting = true;
    this.chatService.createSession({
      manualId: manual._id,
      vehicleId: this.selectedVehicleId
    }).subscribe({
      next: (session) => {
        this.activeSessionId = session._id;
        this.activeManualId = session.manualId;
        this.activeManualName = manual.filename;
        this.messages = session.messages || [];
        this.selectedVehicleId = session.vehicleId || null;
        this.isStarting = false;
        this.refreshSessions();
      },
      error: (err) => {
        console.error('Could not start conversation', err);
        this.isStarting = false;
        alert('Could not start: ' + (err?.error?.error || err?.message || 'unknown error'));
      }
    });
  }

  deleteSession(event: Event, id: string) {
    event.stopPropagation();
    if (!confirm('Delete this conversation?')) return;
    this.chatService.deleteSession(id).subscribe(() => {
      if (this.activeSessionId === id) this.newSession();
      this.refreshSessions();
    });
  }

  onVehicleChange() {
    if (!this.activeSessionId) return;
    this.chatService.updateSession(this.activeSessionId, {
      vehicleId: this.selectedVehicleId
    }).subscribe();
  }

  sendMessage() {
    const text = this.currentInput.trim();
    if (!text || this.isLoading || !this.activeSessionId) return;

    const sessionId = this.activeSessionId;
    this.messages = [...this.messages, { role: 'user', content: text }];
    this.currentInput = '';
    this.isLoading = true;
    this.streamingContent = false;

    this.messages = [...this.messages, { role: 'assistant', content: '' }];
    const assistantIdx = this.messages.length - 1;

    this.chatService.sendMessageStream(sessionId, text).subscribe({
      next: (partial) => {
        this.streamingContent = true;
        const next = [...this.messages];
        next[assistantIdx] = { role: 'assistant', content: partial };
        this.messages = next;
      },
      error: (err) => {
        console.error(err);
        const next = [...this.messages];
        next[assistantIdx] = { role: 'assistant', content: 'Sorry, I encountered an error communicating with the AI service.' };
        this.messages = next;
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
        this.streamingContent = false;
        this.refreshSessions();
      }
    });
  }
}
