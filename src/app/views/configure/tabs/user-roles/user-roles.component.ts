import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import * as FileSaver from 'file-saver';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table } from 'primeng/table';
import { switchMap, of, catchError, forkJoin } from 'rxjs';
import { Role, User } from 'src/app/models/interfaces';
import { CreateAndUpdateRoleRequest, ToggleStateRequest } from 'src/app/models/requests';
import { UserService } from 'src/app/services/user.service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-user-roles',
  templateUrl: './user-roles.component.html',
  styleUrl: './user-roles.component.css'
})
export class UserRolesComponent implements OnInit {

  @ViewChild('globalFilter') globalFilter!: ElementRef;
  
  listRoles: any;
  loading: boolean = true;
  roleDialog: boolean = false;
  roleForm!: FormGroup;
  roleFormSubmitBtnText: string = 'Save User';
  loadingButton: boolean = false;
  selectedRoles!: any;
  selectedRole!: any;
  //rolesEnabled: boolean = false;
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
    this.loadRoles();
    this.prepareRoleDialogs();
  }

  loadRoles(): void {
    this.loading = true;
    this.usersService.getAllUserRoles().pipe(
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
          this.listRoles = response.response.map((role: any) => ({
            role_id: role.role_id,
            role_name: role.role_name,
            description: role.description,
            is_active: role.is_active,
            cr_by: role.cr_by,
            cr_dtimes: role.cr_dtimes,
          }));

          return of(this.listRoles);
        }
        return of([]);
      })
    ).subscribe(
      updatedRoles => {
        this.listRoles = updatedRoles;
        this.loading = false;
      },
      error => {
        console.error('API error:', error);
        this.messageService.add({
          key: 'tc', severity: 'error', summary: 'Ooops', detail: 'Failed to load roles.'
        });
        this.loading = false;
      }
    );
  }

  prepareRoleDialogs() {
    this.roleForm = this.fb.group({
      roleName: ['', [Validators.required]],
      description: ['', [Validators.required]],
    });

    //this.loadRoleDialogsDropdowns();
  }

  loadRoleDialogsDropdowns() {
    this.listRoles = [];
    this.usersService.getAllUserRoles().subscribe({
      next: response => {
        if (response.response != null && response.errors == null) {
          this.listRoles = response.response.map((role: any) => {
            return { label: role.role_name, value: role.role_id };
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

  private hasUserDataChanged(formData: any, selectedRole: Role): boolean {

    return (
      formData.roleName !== selectedRole.role_name ||
      formData.description !== selectedRole.description
    );
  }

  saveRole(): void {
    if (this.roleForm.valid) {
      const formData = this.roleForm.value;

      if (this.selectedRole && !this.hasUserDataChanged(formData, this.selectedRole)) {
        this.messageService.add({ key: 'tc', severity: 'info', summary: 'No Changes Detected', detail: 'No changes have been made to the data.' });
        return;
      }

      this.loadingButton = true;
      this.roleFormSubmitBtnText = this.selectedRole ? 'Updating...' : 'Saving...';

      setTimeout(() => {
        // Construct request object
        const request: CreateAndUpdateRoleRequest = {
          role_name: formData.roleName, 
          description: formData.description, 
        };

        console.log('Request Object:', JSON.stringify(request, null, 2));
        this.finalizeEntitySave(request);
      }, 5000);
    } else {
      this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops', detail: 'You must enter username, email, names, and roles' });
    }
  }

  // Finalize the save or update operation
  private finalizeEntitySave(request: CreateAndUpdateRoleRequest): void {
    if (this.selectedRole) {

      // Update existing role
      this.usersService.updateUserRole(this.selectedRole.role_id, request).subscribe({
        next: data => {
          if (data.errors != null) {
            this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Updating role failed', detail: data.errors[0].message });
          } else {
            this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'Updating role was successful.' });
            this.resetRoleForm();
            this.roleDialog = false;
            this.loadRoles();
          }
          this.loadingButton = false;
          this.roleFormSubmitBtnText = 'Update Role';
        },
        error: err => {
          this.loadingButton = false;
          this.roleFormSubmitBtnText = 'Update Role';
          this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Updating role failed', detail: err.error.message });
        }
      });
    } else {
      // Create new role
      this.usersService.createNewUserRole(request).subscribe({
        next: data => {
          console.log("Create response: {} " + data);

          if (data.errors != null) {
            this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Saving new role failed', detail: data.errors[0].message });
          } else {
            this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'New role created.' });
            this.resetRoleForm();
            this.roleDialog = false;
            this.loadRoles();
          }
          this.loadingButton = false;
          this.roleFormSubmitBtnText = 'Save Role';
        },
        error: err => {
          this.loadingButton = false;
          this.roleFormSubmitBtnText = 'Save Role';
          this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Saving new role failed', detail: err.error.message });
        }
      });
    }
  }

  resetRoleForm(): void {
    this.roleForm.reset();
    this.selectedRole = null;
    this.roleDialog = false;
  }

  openRoleDialog(selectedRole?: Role) {
    this.resetRoleForm();
    this.roleDialog = true;

    if (selectedRole) {
      this.selectedRole = selectedRole;
      this.roleFormSubmitBtnText = 'Update Role';

      // Patch the form with selected data
      this.roleForm.patchValue({
        roleName: selectedRole.role_name,
        description: selectedRole.description
      });

    } else {
      this.selectedRole = null;
      this.roleFormSubmitBtnText = 'Save Role';
    }
  }

  cancelRoleForm() {
    this.resetRoleForm();
  }

  showMenuForRole(menu: any, event: Event, role: any) {
    this.menuItems = this.getMenuItemsForRecord(role);
    
    // Open the menu
    menu.toggle(event);
  }
  
  getMenuItemsForRecord(role: any): any[] {
    return [
      {
        label: role.is_active ? 'Deactivate' : 'Activate',
        icon: role.is_active ? 'pi pi-times' : 'pi pi-check',
        command: () => {
          this.toggleRoleState(role);
        }
      },
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => {
          this.selectRole(role);
        }
      }
    ];
  }

  selectRole(role: Role) {
    this.selectedRole = role;
    this.roleFormSubmitBtnText = 'Update Role';

    // Patch form values with the selected data
    this.roleForm.patchValue({
      roleName: role.role_name,
      description: role.description
    });

    this.roleDialog = true;
  }

  toggleRoleState(role: Role) {
    
      const enabledOrDisabled = role.is_active;
      const action = enabledOrDisabled ? false : true;
      const actionDesc = enabledOrDisabled ? 'disable' : 'enable';
      const actionCautionText = enabledOrDisabled ? 'If you deactivate this role, users assigned to it wont be able to log in' : ''

      const request: ToggleStateRequest = {
        toggle_state : action
      };

      this.confirmationService.confirm({
        message: `Are you sure you want to ${actionDesc} ${role.role_name} ? ${actionCautionText}`,
        accept: () => {

            this.usersService.toggleUserRoleState(role.role_id, request).subscribe({
              next: (response) => {
                if (response.errors == null && response.response.id != null) {
                  this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'Role state changed successfully' });
                  this.loadRoles();
                }
                else {
                  this.messageService.add({ key: 'tc', severity: 'error', summary: 'Changing role state failed', detail: response.errors[0].message });
                }
              },
              error: (err: any) => {
                console.error('Error changing role state:', err);
              }
            });  
        },
        acceptButtonStyleClass: 'p-button-danger',
        rejectButtonStyleClass: 'p-button-text'
      });
    
  }

  exportExcel() {
    import('xlsx').then((xlsx) => {
      const exportData = this.listRoles.map((role: { id: any; role_name: any; description: any; is_active: any; }) => {
        return {
          ID: role.id,
          RoleName: role.role_name,
          Description: role.description,
          Active: role.is_active ? 'true' : 'false'
        };
      });

      // Convert the filtered data to a worksheet
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });

      this.saveAsExcelFile(excelBuffer, 'roles');
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
      this.loadRoles();
      this.loading = false;
    }, 3000);
    
  }
}
