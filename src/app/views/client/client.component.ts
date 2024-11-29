import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrl: './client.component.css'
})
export class ClientComponent implements OnInit {

  activeTabIndex: number = 0; // Track the active tab index

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {

    // Listen for changes in the route and update the active tab accordingly
    this.route.url.subscribe(() => {
      const tab = this.route.snapshot.firstChild?.url[0].path;

      // Map routes to tab index
      switch (tab) {
        case 'applications':
          this.activeTabIndex = 0;
          break;
        case 'learners':
          this.activeTabIndex = 1;
          break;
        default:
          this.activeTabIndex = 0; // Default to the first tab
          break;
      }
    });

    
  }

  // Handle tab change event and update the route accordingly
  onTabChange(event: any) {
    switch (event.index) {
      case 0:
        this.router.navigate(['client/applications']);
        break;
      case 1:
        this.router.navigate(['client/learners']);
        break;
    }
  }


}
