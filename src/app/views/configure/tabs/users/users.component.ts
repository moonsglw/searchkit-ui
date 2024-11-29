import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as FileSaver from 'file-saver';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { catchError, forkJoin, Observable, of, switchMap } from 'rxjs';
import { User } from 'src/app/models/interfaces';
import { CreateAndUpdateUserRequest, ToggleStateRequest } from 'src/app/models/requests';
import { UserService } from 'src/app/services/user.service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {

  @ViewChild('globalFilter') globalFilter!: ElementRef;
  
  listUsers: any;
  loading: boolean = true;
  userDialog: boolean = false;
  userForm!: FormGroup;
  userFormSubmitBtnText: string = 'Save User';
  loadingButton: boolean = false;
  listRoles: any[] = [];
  selectedUsers!: any;
  selectedUser!: any;
  rolesEnabled: boolean = false;
  loadingGenPass = [false, false, false, false];
  menuItems: any[] = [];

  constructor(
    private usersService: UserService, 
    private messageService: MessageService, 
    private fb: FormBuilder, 
    private confirmationService: ConfirmationService,
    private utilService: UtilService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.prepareUserDialogs();
  }

  loadUsers(): void {
    this.loading = true;
    this.usersService.getAllUsers().pipe(
      switchMap(response => {
        if (response.errors) {
          this.messageService.add({
            key: 'tc', severity: 'error', summary: 'Ooops', detail: response.errors[0].message
          });
          this.loading = false;
          return of([]); // Exit early if there are errors
        }
  
        if (response.response != null) {
          // Map the initial user data
          this.listUsers = response.response.map((user: any) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            full_names: user.full_names,
            is_active: user.is_active,
            role_id: user.role_id,
            cr_by: user.cr_by,
            cr_dtimes: user.cr_dtimes,
            role: null // Placeholder for role data
          }));
  
          // Prepare an array of observables for fetching each user's role
          const roleRequests = this.listUsers.map((user: any) => 
            this.usersService.getUserRoleById(user.role_id).pipe(
              switchMap(roleResponse => {
                if (roleResponse.errors) {
                  console.log(`Failed to load role for user ${user.username}.`);
                  user.role = null;
                } else {
                  user.role = roleResponse.response.role_name; // Assign the role directly
                }
                return of(user);
              }),
              catchError(error => {
                console.error(`Error loading role for user ${user.username}:`, error);
                user.role = null;
                return of(user);
              })
            )
          );
  
          // Use forkJoin to wait for all role requests to complete
          return forkJoin(roleRequests);
        }
        return of([]);
      })
    ).subscribe(
      updatedUsers => {
        this.listUsers = updatedUsers;
        this.loading = false;
      },
      error => {
        console.error('API error:', error);
        this.messageService.add({
          key: 'tc', severity: 'error', summary: 'Ooops', detail: 'Failed to load users and roles.'
        });
        this.loading = false;
      }
    );
  }

  /*getUserRoleName(roleId: string): string {
    return roles.map(role => this.transformRoleName(role.name)).join(', ');
  }*/

  transformRoleName(name: string): string {
    switch (name) {
      case 'DEVELOPER':
        return 'System Developer';
      case 'USER':
        return 'User';
      case 'ADMIN':
        return 'Admin';
      // Add more cases as needed
      default:
        return name; // Fallback to the original name if not matched
    }
  }

  prepareUserDialogs() {
    this.userForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      fullNames: ['', Validators.required],
      userRole: ['', Validators.required],
    });

    this.loadUserDialogsDropdowns();
  }

  loadUserDialogsDropdowns() {
    this.listRoles = [];
    this.usersService.getAllUserRoles().subscribe({
      next: response => {
        if (response.response != null && response.errors == null) {
          this.listRoles = response.response.map((role: any) => {
            return { label: role.role_name, value: role.role_id , disabled: !role.is_active };
          });
        }
        else {
          console.log("Error while retrieving roles")
        }
      }, error: err => {
        console.log("Error: " + err.error.message);
      }
    });

  }

  private hasUserDataChanged(formData: any, selectedUser: User): boolean {

    // Compare roles: assuming formData.roles contains the role name, not the role object
    const roleChanged = selectedUser.role_id !== formData.userRole;

    return (
      formData.email !== selectedUser.email ||
      formData.username !== selectedUser.username ||
      formData.fullNames !== selectedUser.full_names ||
      roleChanged
    );
  }

  saveUser(): void {
    if (this.userForm.valid) {
      const formData = this.userForm.value;

      if (this.selectedUser && !this.hasUserDataChanged(formData, this.selectedUser) && !formData.password) {
        this.messageService.add({ key: 'tc', severity: 'info', summary: 'No Changes Detected', detail: 'No changes have been made to the user data.' });
        return;
      }

      this.loadingButton = true;
      this.userFormSubmitBtnText = this.selectedUser ? 'Updating...' : 'Saving...';

      setTimeout(() => {
        // Construct request object
        const request: CreateAndUpdateUserRequest = {
          username: formData.username, // Not allowed to update username
          email: formData.email, // Not allowed to update email
          password: formData.password,
          full_names: formData.fullNames,
          role_id: formData.userRole
        };

        console.log('Request Object:', JSON.stringify(request, null, 2));
        this.finalizeUserSave(request);
      }, 5000);
    } else {
      this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops', detail: 'You must enter username, email, names, and roles' });
    }
  }

  // Finalize the save or update operation
  private finalizeUserSave(request: CreateAndUpdateUserRequest): void {
    if (this.selectedUser) {

      console.log("user id: " + this.selectedUser.id);
      // Update existing user
      this.usersService.updateUser(this.selectedUser.id, request).subscribe({
        next: data => {
          if (data.errors != null) {
            this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Updating user failed', detail: data.errors[0].message });
          } else {
            this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'Updating user was successful.' });
            this.resetUserForm();
            this.userDialog = false;
            this.loadUsers();
          }
          this.loadingButton = false;
          this.userFormSubmitBtnText = 'Update User';
        },
        error: err => {
          this.loadingButton = false;
          this.userFormSubmitBtnText = 'Update User';
          this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Updating user failed', detail: err.error.message });
        }
      });
    } else {
      // Create new user
      this.usersService.createNewUser(request).subscribe({
        next: data => {
          console.log("Create response: {} " + data);

          if (data.errors != null) {
            this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Saving new user failed', detail: data.errors[0].message });
          } else {
            this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'New user created.' });
            this.resetUserForm();
            //this.listUsers = [...this.listUsers, data.response.data];
            this.userDialog = false;
            this.loadUsers();
          }
          this.loadingButton = false;
          this.userFormSubmitBtnText = 'Save User';
        },
        error: err => {
          this.loadingButton = false;
          this.userFormSubmitBtnText = 'Save User';
          this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Saving new user failed', detail: err.error.message });
        }
      });
    }
  }

  resetUserForm(): void {
    this.userForm.reset();
    this.selectedUser = null;
    this.userDialog = false;
  }

  openUserDialog(selectedUser?: User) {
    this.resetUserForm();
    this.userDialog = true;

    if (selectedUser) {
      this.selectedUser = selectedUser;
      this.userFormSubmitBtnText = 'Update User';

      // Patch the form with selected user data
      this.userForm.patchValue({
        username: selectedUser.username,
        email: selectedUser.email,
        fullNames: selectedUser.full_names,
        userRole: selectedUser.role_id, 
      });

      this.passwordControl?.setValidators(null);
      this.passwordControl?.updateValueAndValidity({ onlySelf: true });

    } else {
      this.selectedUser = null;
      this.userFormSubmitBtnText = 'Save User';

      this.passwordControl?.setValidators([Validators.required]); // Add validators for create mode
      this.passwordControl?.updateValueAndValidity({ onlySelf: true });
    }
  }

  cancelUserForm() {
    this.resetUserForm();
  }

  showMenuForUser(menu: any, event: Event, user: any) {
    // Set the menu items for the specific user
    this.menuItems = this.getMenuItemsForRecord(user);
    
    // Open the menu
    menu.toggle(event);
  }
  
  getMenuItemsForRecord(user: any): any[] {
    return [
      {
        label: user.is_active ? 'Deactivate' : 'Activate',
        icon: user.is_active ? 'pi pi-times' : 'pi pi-check',
        command: () => {
          //console.log('Menu item clicked for deactivate/activate:', user);
          this.toggleUserState(user);
        }
      },
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => {
          //console.log('Menu item clicked for edit:', user);
          this.selectUser(user);
        }
      }
    ];
  }

  selectUser(user: User) {
    this.selectedUser = user;
    this.userFormSubmitBtnText = 'Update User';

    // Patch form values with the selected user's data
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      password: '', // Password is typically not pre-filled for security reasons
      fullNames: user.full_names,
      userRole: user.role_id
      //userRole: user.roles && user.roles.length > 0 ? user.roles[0].name : '', // Assuming single role selection
    });

    this.userDialog = true;
  }

  toggleUserState(user: User) {
    
      const enabledOrDisabled = user.is_active;
      const action = enabledOrDisabled ? false : true;
      const actionDesc = enabledOrDisabled ? 'disable' : 'enable';

      const request: ToggleStateRequest = {
        toggle_state : action
      };

      this.confirmationService.confirm({
        message: `Are you sure you want to ${actionDesc} ${user.username}?`,
        accept: () => {

            this.usersService.toggleUserState(user.id, request).subscribe({
              next: (response) => {
                if (response.errors == null && response.response.id != null) {
                  this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'User state changed successfully' });
                  this.loadUsers();
                }
                else {
                  this.messageService.add({ key: 'tc', severity: 'error', summary: 'Chaning user state failed', detail: response.errors[0].message });
                }
              },
              error: (err: any) => {
                console.error('Error deactivating user:', err);
              }
            });  
        },
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-text'
      });
    
  }

  get passwordControl(): AbstractControl | null {
    return this.userForm.get('password');
  }

  generatePassword(index: number) {
    this.loadingGenPass[index] = true;
    setTimeout(() => this.loadingGenPass[index] = false, 1000);
    this.userForm.controls['password'].setValue(this.utilService.generateRandomPassword(6));
  }

  exportExcel() {
    import('xlsx').then((xlsx) => {
      const exportData = this.listUsers.map((user: { id: any; username: any; full_names: any; email: any; enabled: any; role_id: any }) => {
        return {
          ID: user.id,
          Username: user.username,
          Email: user.email,
          Name: user.full_names,
          Role: user.role_id,
          Active: user.enabled ? 'true' : 'false'
        };
      });

      // Convert the filtered data to a worksheet
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });

      this.saveAsExcelFile(excelBuffer, 'users');
    });
  }


  saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

  clear(dt: Table) {
    // Reset sorting and filters
    dt.clear();

    if (this.globalFilter) {
      this.globalFilter.nativeElement.value = '';
    }
  }

  refreshList() {
    this.loading = true;
    setTimeout(() => {
      this.loadUsers();
      this.loading = false;
    }, 3000);
    
  }
}
