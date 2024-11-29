import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { API } from '../app.constants';
import { CreateAndUpdateUserRequest, CreateAndUpdateRoleRequest, ToggleStateRequest } from '../models/requests';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<any> {
    return this.http.get<any>(`${API.USERS}/`)
      .pipe(catchError(this.errorHandler));
  }

  createNewUser(request: CreateAndUpdateUserRequest): Observable<any> {
    return this.http.post<any>(`${API.USERS}/`, request)
      .pipe(catchError(this.errorHandler));
  }

  getUserById(id: string): Observable<any> {
    return this.http.get<any>(`${API.USERS}/${id}`)
      .pipe(catchError(this.errorHandler));
  }

  updateUser(id: string, request: CreateAndUpdateUserRequest): Observable<any> {
    return this.http.put<any>(`${API.USERS}/${id}`, request)
      .pipe(catchError(this.errorHandler));
  }
  
  getUsersByRoleId(roleId: string): Observable<any> {
    return this.http.get<any>(`${API.USERS}/role/${roleId}`)
      .pipe(catchError(this.errorHandler));
  }

  toggleUserState(id: string, request: ToggleStateRequest): Observable<any> {
    return this.http.put<any>(`${API.USERS}/toggle-state/${id}`, request)
      .pipe(catchError(this.errorHandler));
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${API.USERS}/${id}`)
      .pipe(catchError(this.errorHandler));
  }

  getAllUserRoles(): Observable<any> {
    return this.http.get<any>(`${API.ROLES}/`)
      .pipe(catchError(this.errorHandler));
  }

  createNewUserRole(request: CreateAndUpdateRoleRequest): Observable<any> {
    return this.http.post<any>(`${API.ROLES}/`, request)
      .pipe(catchError(this.errorHandler));
  }

  getUserRoleById(id: string): Observable<any> {
    return this.http.get<any>(`${API.ROLES}/${id}`)
      .pipe(catchError(this.errorHandler));
  }

  updateUserRole(id: string, request: CreateAndUpdateRoleRequest): Observable<any> {
    return this.http.put<any>(`${API.ROLES}/${id}`, request)
      .pipe(catchError(this.errorHandler));
  }

  toggleUserRoleState(id: string, request: ToggleStateRequest): Observable<any> {
    return this.http.put<any>(`${API.ROLES}/toggle-state/${id}`, request)
      .pipe(catchError(this.errorHandler));
  }


  errorHandler(error: HttpErrorResponse) {
    return throwError(error.message || "Server Error");
  }
}
