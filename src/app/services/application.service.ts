import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, shareReplay, tap, throwError } from 'rxjs';
import { API } from 'src/app/app.constants';
import { AddBulkApplicationsRequest, ApplicationsCriteriaSearchRequest } from '../models/requests';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {

  private usecases$: Observable<any> | null = null;
  private applicationStates$: Observable<any> | null = null;

  constructor(private http: HttpClient) { }

  getAllUsecases(): Observable<any> {

    if (!this.usecases$) {
        this.usecases$ = this.http.get<any>(`${API.APPLICATIONS}/filter/usecases`).pipe(
          tap(response => console.log('Fetched usecases:', response)),
          catchError(this.errorHandler),
          shareReplay(1)
        );
    }
    return this.usecases$;
  }

  getAllApplicationStates(): Observable<any> {

    if (!this.applicationStates$) {
        this.applicationStates$ = this.http.get<any>(`${API.APPLICATIONS}/filter/states`).pipe(
          tap(response => console.log('Fetched application states:', response)),
          catchError(this.errorHandler),
          shareReplay(1)
        );
    }
    return this.applicationStates$;
  }

  // Deprecated
  getAllApplications(): Observable<any> {
    return this.http.get<any>(`${API.APPLICATIONS}/`)
      .pipe(catchError(this.errorHandler));
  }

  getApplicationById(id: string): Observable<any> {
    return this.http.get<any>(`${API.APPLICATIONS}/${id}`)
      .pipe(catchError(this.errorHandler));
  }

  addBulkApplications(request: FormData): Observable<any> {
    return this.http.post<any>(`${API.APPLICATIONS}/bulk`, request)
      .pipe(catchError(this.errorHandler));
  }

  getApplicationsByCriteria(request: ApplicationsCriteriaSearchRequest): Observable<any> {
    return this.http.post<any>(`${API.APPLICATIONS}/search`, request)
      .pipe(catchError(this.errorHandler));
  }

  getApplicationsStatistics(): Observable<any> {
    return this.http.get<any>(`${API.APPLICATIONS}/statistics/all`)
      .pipe(catchError(this.errorHandler));
  }

  errorHandler(error: HttpErrorResponse) {
    return throwError(error.message || "Server Error");
  }
}
