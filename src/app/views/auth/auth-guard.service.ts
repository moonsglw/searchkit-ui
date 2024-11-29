import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const expectedRoles = next.data['roles']; // Roles expected by the route

    // Redirect if the user is not logged in
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return of(false);
    }

    // Attempt to get `userMap` directly if available
    const userMap = this.authService.getLoggedInUserMap();

    // If `userMap` is already available, check role access directly
    if (userMap) {
      return of(this.checkRoleAccess(userMap, expectedRoles));
    } else {
      // Otherwise, construct the `userMap` and check roles after it's fetched
      return this.authService.constructLoggedInUserMap().pipe(
        map(userMap => this.checkRoleAccess(userMap, expectedRoles)),
        catchError(() => {
          // On error, navigate to login
          this.router.navigate(['/login']);
          return of(false);
        })
      );
    }
  }

  // Checks if the user's role matches any of the expected roles for the route
  private checkRoleAccess(userMap: any, expectedRoles: string[]): boolean {
    // Check if `role_name` in `userMap` matches any role in `expectedRoles`
    if (userMap?.role_name && expectedRoles.includes(userMap.role_name)) {
      return true;
    }
    // If no match, navigate to unauthorized page
    this.router.navigate(['/unauthorized']);
    return false;
  }
}
