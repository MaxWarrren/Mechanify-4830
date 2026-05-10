import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { provideIcons } from '@ng-icons/core';
import { lucideUploadCloud, lucideFileText, lucideTrash2, lucideLoader2 } from '@ng-icons/lucide';
import { KnowledgeService, Manual } from '../../core/services/knowledge.service';

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, HlmButton, HlmIconImports],
  providers: [provideIcons({ lucideUploadCloud, lucideFileText, lucideTrash2, lucideLoader2 })],
  template: `
    <div class="max-w-3xl mx-auto space-y-12">

      <!-- Page header -->
      <div class="text-center pt-4">
        <h1 class="text-3xl font-semibold tracking-tight text-foreground">Knowledge Base</h1>
        <p class="text-muted-foreground mt-2 text-sm">
          Upload PDF manuals. The assistant reads, chunks, and embeds them so it can cite passages back to you.
        </p>
      </div>

      <!-- Central dropzone -->
      <div
        class="relative rounded-2xl border-2 border-dashed transition-colors px-10 py-16 flex flex-col items-center text-center"
        [ngClass]="{
          'border-primary bg-primary/5': isDragging,
          'border-border hover:border-primary/40 hover:bg-muted/20': !isDragging && !isUploading,
          'border-primary/50 bg-primary/5': isUploading
        }"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="!isUploading && fileInput.click()">

        <div class="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
          <ng-icon
            hlm
            [name]="isUploading ? 'lucideLoader2' : 'lucideUploadCloud'"
            class="text-primary"
            [ngClass]="{ 'animate-spin': isUploading }">
          </ng-icon>
        </div>

        <h2 class="text-lg font-medium text-foreground" *ngIf="!isUploading">Drop a PDF here</h2>
        <h2 class="text-lg font-medium text-foreground" *ngIf="isUploading">Processing your manual…</h2>

        <p class="text-sm text-muted-foreground mt-1" *ngIf="!isUploading">
          or click anywhere in this box to choose a file
        </p>
        <p class="text-sm text-muted-foreground mt-1" *ngIf="isUploading">
          Extracting text, generating embeddings, and indexing by page.
        </p>

        <input type="file" accept="application/pdf,.pdf" class="hidden" #fileInput (change)="onFileSelected($event)" />

        <button
          hlmBtn
          size="sm"
          class="mt-6"
          type="button"
          (click)="$event.stopPropagation(); fileInput.click()"
          [disabled]="isUploading">
          {{ isUploading ? 'Working…' : 'Select PDF' }}
        </button>

        <p class="text-xs text-muted-foreground/80 mt-4">PDF only · processed entirely in your environment</p>
      </div>

      <!-- Library list -->
      <section class="space-y-3">
        <div class="flex items-baseline justify-between">
          <h3 class="text-sm font-medium text-foreground uppercase tracking-wider">Your Library</h3>
          <span class="text-xs text-muted-foreground">
            {{ manuals.length }} {{ manuals.length === 1 ? 'manual' : 'manuals' }}
          </span>
        </div>

        <div *ngIf="isLoadingList" class="text-sm text-muted-foreground py-6 text-center">
          Loading…
        </div>

        <div
          *ngIf="!isLoadingList && manuals.length === 0"
          class="text-sm text-muted-foreground p-8 border border-dashed border-border/60 rounded-lg text-center">
          Nothing uploaded yet. Drop a PDF above to get started.
        </div>

        <ul *ngIf="!isLoadingList && manuals.length > 0" class="divide-y divide-border/40 border border-border/40 rounded-lg overflow-hidden">
          <li
            *ngFor="let manual of manuals"
            class="flex items-center gap-4 px-4 py-3 bg-card/40 hover:bg-muted/30 transition-colors group">
            <ng-icon hlm name="lucideFileText" class="text-primary shrink-0"></ng-icon>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-foreground truncate" [title]="manual.filename">{{ manual.filename }}</div>
              <div class="text-xs text-muted-foreground mt-0.5">
                {{ (manual.sizeBytes / 1024 / 1024).toFixed(2) }} MB
                · uploaded {{ manual.uploadDate | date:'mediumDate' }}
              </div>
            </div>
            <button
              type="button"
              class="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-2"
              (click)="deleteManual(manual._id!)"
              [disabled]="isUploading"
              aria-label="Delete manual">
              <ng-icon hlm name="lucideTrash2" size="sm"></ng-icon>
            </button>
          </li>
        </ul>
      </section>

    </div>
  `
})
export class KnowledgeBase implements OnInit {
  manuals: Manual[] = [];
  isDragging = false;
  isUploading = false;
  isLoadingList = true;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(private knowledgeService: KnowledgeService) {}

  ngOnInit() {
    this.loadManuals();
  }

  loadManuals() {
    this.isLoadingList = true;
    this.knowledgeService.getManuals().subscribe({
      next: (data) => {
        this.manuals = data;
        this.isLoadingList = false;
      },
      error: (err) => {
        console.error('Error loading manuals', err);
        this.isLoadingList = false;
      }
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    if (!this.isUploading) this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (this.isUploading) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.handleFile(file);
  }

  handleFile(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Only PDF files are supported.');
      return;
    }

    this.isUploading = true;
    this.knowledgeService.uploadManual(file).subscribe({
      next: () => {
        this.isUploading = false;
        this.loadManuals();
        if (this.fileInput) this.fileInput.nativeElement.value = '';
      },
      error: (err) => {
        this.isUploading = false;
        console.error('Upload failed', err);
        alert('Upload failed: ' + (err.error?.error || err.message));
        if (this.fileInput) this.fileInput.nativeElement.value = '';
      }
    });
  }

  deleteManual(id: string) {
    if (!confirm('Delete this manual and all associated chunks?')) return;
    this.knowledgeService.deleteManual(id).subscribe(() => this.loadManuals());
  }
}
