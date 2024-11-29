import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { API } from 'src/app/app.constants';
import { ConfigService } from 'src/app/services/config.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedInUserMap: { [key: string]: any } | null = null;

  constructor(private http: HttpClient, private router: Router, private configService: ConfigService) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${API.AUTH}/login`, { username, password }).pipe(
      tap(response => {
        if (response.errors?.length > 0) {
          throw new Error(response.errors[0].message || 'An unknown error occurred.');
        } else {
          localStorage.setItem('token', response.response.access_token);
        }
      }),
      switchMap(() => this.loadDistrictConfigs()),
      switchMap(() => this.constructLoggedInUserMap()),
      catchError(error => throwError(() => new Error(error.message || 'Login failed.')))
    );
  }

  private loadDistrictConfigs(): Observable<any> {
    return this.configService.getStationAppConfigForUi().pipe(
      tap(response => localStorage.setItem('config', JSON.stringify(response.response))),
      catchError(() => of(null))
    );
  }

  constructLoggedInUserMap(): Observable<any> {
    const userId = this.getUserIdFromToken();
    const roleId = this.getUserRoleIdFromToken();

    if (!userId || !roleId) {
      console.error("Error: userId or roleId is null. Ensure token contains valid user ID and role ID.");
      return of(null);
    }

    return this.getUserDetails(userId).pipe(
      switchMap(userDetails => {
        console.log("User Details:", userDetails);
        return this.getUserRoleDetails(roleId).pipe(
          tap(roleDetails => {
            console.log("Role Details:", roleDetails);

            // Check if both user and role details have the expected response
            if (userDetails.response && roleDetails.response) {
              this.loggedInUserMap = {
                ...userDetails.response,
                ...roleDetails.response,
                isActive: userDetails.response.is_active && roleDetails.response.is_active
              };
              localStorage.setItem('loggedInUserMap', JSON.stringify(this.loggedInUserMap));
              console.log("LoggedInUserMap successfully set in localStorage:", this.loggedInUserMap);
            } else {
              console.warn("Either userDetails or roleDetails response is missing, not setting loggedInUserMap.");
            }
          })
        );
      }),
      catchError(error => {
        console.error('Error constructing logged-in user map:', error.message);
        return of(null);
      })
    );
  }


  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    return !!token && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return true;

    const decodedToken: any = jwtDecode(token);
    return decodedToken.exp * 1000 < Date.now();
  }

  getUserIdFromToken(): string | null {
    const token = localStorage.getItem('token');
    return token ? (jwtDecode(token) as any).id : null;
  }

  getUserRoleIdFromToken(): string | null {
    const token = localStorage.getItem('token');
    return token ? (jwtDecode(token) as any).role : null;
  }

  getUsernameFromToken(): string | null {
    const token = localStorage.getItem('token');
    return token ? (jwtDecode(token) as any).sub : null;
  }

  getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getUserDetails(userId: string): Observable<any> {
    return this.http.get<any>(`${API.USERS}/${userId}`, { headers: this.getAuthHeaders() });
  }

  getUserRoleDetails(roleId: string): Observable<any> {
    return this.http.get<any>(`${API.ROLES}/${roleId}`, { headers: this.getAuthHeaders() });
  }

  getLoggedInUserMap(): { [key: string]: any } | null {
  const userMap = localStorage.getItem('loggedInUserMap');
  return userMap ? JSON.parse(userMap) : null;
}

  logout(): void {
    localStorage.clear();
    this.loggedInUserMap = null;
    this.router.navigate(['/login']);
  }
}
