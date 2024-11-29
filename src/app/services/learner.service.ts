import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AddBulkApplicationsRequest, AddBulkLearnersRequest, LearnersCriteriaSearchRequest } from '../models/requests';
import { API } from '../app.constants';

@Injectable({
  providedIn: 'root'
})
export class LearnerService {

  constructor(private http: HttpClient) { }

  addBulkLearners(request: AddBulkLearnersRequest): Observable<any> {
    return this.http.post<any>(`${API.LEARNERS}/bulk`, request)
      .pipe(catchError(this.errorHandler));
  }

  getLearnersByCriteria(request: LearnersCriteriaSearchRequest): Observable<any> {
    return this.http.post<any>(`${API.LEARNERS}/search`, request)
      .pipe(catchError(this.errorHandler));
  }

  errorHandler(error: HttpErrorResponse) {
    return throwError(error.message || "Server Error");
  }
}
