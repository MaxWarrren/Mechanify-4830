import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Manual {
  _id?: string;
  filename: string;
  sizeBytes: number;
  uploadDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class KnowledgeService {
  private apiUrl = `${environment.apiUrl}/knowledge`;

  constructor(private http: HttpClient) { }

  getManuals(): Observable<Manual[]> {
    return this.http.get<Manual[]>(this.apiUrl);
  }

  uploadManual(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }

  deleteManual(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
