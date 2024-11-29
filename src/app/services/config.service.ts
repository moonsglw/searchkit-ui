import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, shareReplay, tap, throwError } from 'rxjs';
import { API } from '../app.constants';
import { AddBulkDistrictsRequest, CreateAndUpdateSingleDistrictRequest, CreateDistrictConfigRequest, ToggleStateRequest } from '../models/requests';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private districts$: Observable<any> | null = null;
  private registrationAreas$: Observable<any> | null = null;
  private genderTypes$: Observable<any> | null = null;

  constructor(private http: HttpClient) { }

  getAllDistricts(): Observable<any> {
    if (!this.districts$) {
      this.districts$ = this.http.get<any>(`${API.CONFIGS}/districts`).pipe(
        tap(response => console.log('Fetched districts:', response)),
        catchError(this.errorHandler),
        shareReplay(1) // Cache the result to share it across components
      );
    }
    return this.districts$;
  }

  getRegistrationAreas(): Observable<any> {
    if (!this.registrationAreas$) {
      this.registrationAreas$ = this.http.get<any>(`${API.CONFIGS}/registration-areas`).pipe(
        tap(response => console.log('Fetched registration areas:', response)),
        catchError(this.errorHandler),
        shareReplay(1) // Cache the result to share it across components
      );
    }
    return this.registrationAreas$;
  }

  getStationAppConfigForUi(): Observable<any> {
    return this.http.get<any>(`${API.CONFIGS}/ui`)
      .pipe(catchError(this.errorHandler));
  }

  getStationAppConfig(): Observable<any> {
    return this.http.get<any>(`${API.CONFIGS}`)
      .pipe(catchError(this.errorHandler));
  }

  getAllDistrictsForConfigure(): Observable<any> {
    return this.http.get<any>(`${API.CONFIGS}/districts`)
      .pipe(catchError(this.errorHandler));
  }

  addBulkDistricts(request: FormData): Observable<any> {
    return this.http.post<any>(`${API.CONFIGS}/districts/bulk`, request)
      .pipe(catchError(this.errorHandler));
  }

  createNewSingleDistrict(request: CreateAndUpdateSingleDistrictRequest): Observable<any> {
    return this.http.post<any>(`${API.CONFIGS}/districts/`, request)
      .pipe(catchError(this.errorHandler));
  }

  updateSingleDistrict(request: CreateAndUpdateSingleDistrictRequest, code: string): Observable<any> {
    return this.http.put<any>(`${API.CONFIGS}/districts/${code}`, request)
      .pipe(catchError(this.errorHandler));
  }

  toggleDistrictState(code: string, request: ToggleStateRequest): Observable<any> {
    return this.http.put<any>(`${API.CONFIGS}/districts/toggle-state/${code}`, request)
      .pipe(catchError(this.errorHandler));
  }

  createDistrictConfigs(request: CreateDistrictConfigRequest): Observable<any> {
    return this.http.post<any>(`${API.CONFIGS}/`, request)
      .pipe(catchError(this.errorHandler));
  }

  updateDistrictConfigs(request: CreateDistrictConfigRequest, id: string): Observable<any> {
    return this.http.put<any>(`${API.CONFIGS}/${id}`, request)
      .pipe(catchError(this.errorHandler));
  }

  getGenderTypes(): Observable<any> {
    if (!this.genderTypes$) {
      this.genderTypes$ = this.http.get<any>(`/assets/jsons/gender.json`).pipe(
        tap(response => console.log('Fetched gender types:', response)),
        catchError(this.errorHandler),
        shareReplay(1) // Cache the result to share it across components
      );
    }
    return this.genderTypes$;
  }

  getAppReadme(): Observable<any> {
    return this.http.get<any>(`${API.CONFIGS}/readme`)
      .pipe(catchError(this.errorHandler));
  }

  errorHandler(error: HttpErrorResponse) {
    return throwError(error.message || "Server Error");
  }

}
