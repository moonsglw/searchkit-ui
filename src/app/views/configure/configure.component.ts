import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs';

@Component({
  selector: 'app-configure',
  templateUrl: './configure.component.html',
  styleUrl: './configure.component.css'
})
export class ConfigureComponent implements OnInit {
  leftMenuItems!: MenuItem[];
  items!: MenuItem[];

  constructor(private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnInit() {

    this.leftMenuItems = [
      {
        label: 'Manage Users',
        icon: 'pi pi-users',
        
        items: [
          {
            label: 'Users',
            icon: 'pi pi-users',
            route: '/configure/users',
            
          },
          {
            label: 'User Roles',
            icon: 'pi pi-key',
            route: '/configure/user-roles'
          }
        ]
      },
      {
        label: 'Station App Config',
        icon: 'pi pi-palette',
        expanded: true,
        items: [
          {
            label: 'District Config',
            icon: 'pi pi-cog',
            route: '/configure/district-configs'
          },
          {
            label: 'Districts',
            icon: 'pi pi-map',
            route: '/configure/districts'
          }
        ]
      },
      {
        label: 'Applications',
        icon: 'pi pi-file-check',
        command: () => {
          this.router.navigate(['/configure/applications']);
        }
      },
      {
        label: 'Leaners',
        icon: 'pi pi-graduation-cap',
        command: () => {
          this.router.navigate(['/configure/learners']);
        }
      }
    ];

    // Detect route changes and set the active menu item
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveMenuItem();
      });

    // Set the active item on initial load
    this.updateActiveMenuItem();

  }

  // Update active state based on current route
  updateActiveMenuItem() {
    const currentRoute = this.router.url;
    this.leftMenuItems.forEach(group => {
      group.items?.forEach(item => {
        item.styleClass = item['route'] === currentRoute ? 'active-menu-item' : '';
      });
    });
  }
  
 
}
