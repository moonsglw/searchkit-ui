import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigureComponent } from './views/configure/configure.component';
import { PageNotFoundComponent } from './views/page-not-found/page-not-found.component';
import { ReportsComponent } from './views/reports/reports.component';
import { ClientComponent } from './views/client/client.component';
import { ApplicationsTabComponent } from './views/client/tabs/applications-tab/applications-tab.component';
import { LearnersTabComponent } from './views/client/tabs/learners-tab/learners-tab.component';
import { LoginComponent } from './views/auth/login/login.component';
import { AuthGuardService } from './views/auth/auth-guard.service';
import { ApplicationsComponent } from './views/configure/tabs/applications/applications.component';
import { DistrictConfigsComponent } from './views/configure/tabs/district-configs/district-configs.component';
import { DistrictsComponent } from './views/configure/tabs/districts/districts.component';
import { LearnersComponent } from './views/configure/tabs/learners/learners.component';
import { UserRolesComponent } from './views/configure/tabs/user-roles/user-roles.component';
import { UsersComponent } from './views/configure/tabs/users/users.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'client',
    component: ClientComponent,
    children: [
      { path: 'applications', component: ApplicationsTabComponent },
      { path: 'learners', component: LearnersTabComponent },
      { path: '', redirectTo: 'applications', pathMatch: 'full' }
    ],
    canActivate: [AuthGuardService],
    data: { roles: ['DEVELOPER', 'ADMIN', 'USER'] }
  },
  { path: 'reports', component: ReportsComponent, canActivate: [AuthGuardService], data: { roles: ['DEVELOPER', 'ADMIN'] } },
  {
    path: 'configure', component: ConfigureComponent,
    children: [
      { path: 'users', component: UsersComponent },
      { path: 'user-roles', component: UserRolesComponent },
      { path: 'district-configs', component: DistrictConfigsComponent },
      { path: 'districts', component: DistrictsComponent },
      { path: 'applications', component: ApplicationsComponent },
      { path: 'learners', component: LearnersComponent },
      { path: '', redirectTo: 'district-configs', pathMatch: 'full' }
    ], canActivate: [AuthGuardService], 
    data: { roles: ['DEVELOPER', 'ADMIN'] }
  },
  { path: '**', component: PageNotFoundComponent }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

export const routingComponents = [
  LoginComponent,
  ClientComponent,
  ReportsComponent,
  ConfigureComponent,
  PageNotFoundComponent,
  ApplicationsTabComponent,
  LearnersTabComponent,
  UsersComponent,
  UserRolesComponent,
  DistrictConfigsComponent,
  DistrictsComponent,
  ApplicationsComponent,
  LearnersComponent
]
