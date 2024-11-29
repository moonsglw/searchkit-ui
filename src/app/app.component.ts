import { Component, OnInit } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { District } from './models/interfaces';
import { ConfigService } from './services/config.service';
import { environment } from 'src/environments/environment';
import { CONFIG_PROPERTY, ROLE } from './app.constants';
import { AuthService } from './views/auth/auth.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { BnNgIdleService } from 'bn-ng-idle';
import { Location } from '@angular/common';
import { catchError, Observable, of, tap } from 'rxjs';
import { ApplicationService } from './services/application.service';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  appTitle!: string;
  appVersion!: string;
  topMainMenuLeftItems!: MenuItem[];
  topMainMenuRightPopupItems!: MenuItem[];
  loggedinUser: any;
  districts!: District[];
  configuredDistrict!: string;
  config: any;
  userId: any;
  showMenu = false;
  displayTimeOutModal = false;
  role!: string;
  location!: Location // Inject Location
  displayAppReadMeDialog = false; // Controls dialog visibility
  appReadMeContent: SafeHtml = ''; // Holds the rendered HTML of the README

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private idleService: BnNgIdleService,
    private activatedRoute: ActivatedRoute,
    private applicationService: ApplicationService,
    private sanitizer: DomSanitizer
  ) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.updateMenuVisibility(this.router.url);
      }
    });
  }

  ngOnInit() {
    //(document.body.style as any).zoom = "90%";
    this.loadAppConfig();
    this.loadMasterData();
    this.checkLoginStatus();
    
    // Prevent back navigation
    this.preventBackNavigation();
  }

  loadAppConfig(): void {
    const storedConfig = localStorage.getItem('config');
    if (storedConfig) {
      this.config = JSON.parse(storedConfig);
      this.appVersion = 'v' + this.config[CONFIG_PROPERTY.APP_VERSION];
      this.appTitle = this.config[CONFIG_PROPERTY.APP_NAME];
      this.configuredDistrict = this.config[CONFIG_PROPERTY.CONFIGS].hasDivisionAsOffices
        ? this.config[CONFIG_PROPERTY.CONFIGS].divisionOffice
        : this.config[CONFIG_PROPERTY.CONFIGURED_DISTRICT];
    } else {
      console.warn('No config found in localStorage');
    }
  }

  loadMasterData(): void {
    // get master data for dropdowns to be consumed i.e. list of usecases, districts, registrationAreas
    this.loadDistricts();  
    this.loadUsecases();
    this.loadRegistrationAreas();
    this.loadGenderTypes();
    this.loadApplicationStates();
  }

  loadDistricts(): void {
    this.configService.getAllDistricts().subscribe();
  }

  loadRegistrationAreas(): void {
    this.configService.getRegistrationAreas().subscribe();
  }

  loadUsecases(): void {
    this.applicationService.getAllUsecases().subscribe();
  }

  loadGenderTypes(): void {
    this.configService.getGenderTypes().subscribe();
  }

  loadApplicationStates(): void {
    this.applicationService.getAllApplicationStates().subscribe();
  }

  checkLoginStatus(): void {
    if (this.isLoggedIn()) {
      this.userId = this.authService.getUserIdFromToken();
      this.loggedinUser = this.authService.getUsernameFromToken();

      if (this.userId) {
        const storedUserMap = this.authService.getLoggedInUserMap();
        
        if (storedUserMap) {
          this.role = storedUserMap['role_name'] || '';
          localStorage.setItem('role', this.role);
          this.initializeMenuItems();
          this.updateMenuVisibility(this.router.url);
        } else {
          this.authService.constructLoggedInUserMap().subscribe(userMap => {
            if (userMap) {
              this.role = userMap.role_name || '';
              localStorage.setItem('role', this.role);
              this.initializeMenuItems();
              this.updateMenuVisibility(this.router.url);
            }
          });
        }
      }

      // Navigate to the client page and replace the login route in the stack
      this.router.navigate(['/client'], { replaceUrl: true });

      this.idleService.startWatching(600).subscribe((isTimedOut: boolean) => {
        if (isTimedOut) {
          this.authService.logout();
          this.displayTimeOutModal = true;
        }
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  initializeMenuItems() {
    this.loadMainMenuItems();
  }

  loadMainMenuItems() {
    this.topMainMenuLeftItems = [
      {
        label: `${this.appTitle}`,
      },
      {
        label: `${this.appVersion}`,
        icon: 'pi pi-tag',
        command: () => this.displayAppInfo()
      },
      {
        label: 'Reports',
        icon: 'pi pi-copy',
        routerLink: '/reports'
      }
    ];

    this.topMainMenuRightPopupItems = [
      {
        label: 'My Profile',
        icon: 'pi pi-user-edit'
      },
      {
        separator: true
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];
  }

  private updateMenuVisibility(url: string) {
    this.showMenu = this.isLoggedIn() && !url.includes('/login');
  }

  isAdmin(): boolean {
    return this.role.includes(ROLE.ADMIN) || this.role.includes(ROLE.DEVELOPER);
  }

  isUser(): boolean {
    return this.role.includes(ROLE.USER);
  }

  isAtClientPanel(): boolean {
    return this.router.url.includes("/client");
  }

  isAtConfigurePanel(): boolean {
    return this.router.url.includes("/configure");
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
  }

  modalLogin() {
    this.displayTimeOutModal = false;
    window.location.href = '/login';
  }

  preventBackNavigation(): void {
    // Use pushState to add a new state to the history stack
    window.history.pushState(null, '', window.location.href);
    
    // Listen for the 'popstate' event, which is triggered when back navigation occurs
    window.addEventListener('popstate', () => {
      // Push the same state again to disable back navigation
      window.history.pushState(null, '', window.location.href);
    });
  }

displayAppInfo() {
    this.configService.getAppReadme().subscribe({
      next: (response) => {
        if (response.errors == null && response.response.readme) {
          // Convert Markdown to HTML
          const htmlContent: any = marked(response.response.readme);
          this.appReadMeContent = this.sanitizer.bypassSecurityTrustHtml(htmlContent);
          this.displayAppReadMeDialog = true; // Show the dialog
        }
        else {
          this.messageService.add({ key: 'tc', severity: 'error', summary: 'Error fetching readme', detail: response.errors[0].message });
        }
      },
      error: (err: any) => {
        console.error('Error fetching README:', err);
      }
    });
}
 

}
