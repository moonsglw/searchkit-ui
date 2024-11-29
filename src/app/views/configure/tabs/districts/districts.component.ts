import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import * as FileSaver from 'file-saver';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Table } from 'primeng/table';
import { switchMap, of, catchError, forkJoin } from 'rxjs';
import { District, User } from 'src/app/models/interfaces';
import { AddBulkDistrictsRequest, CreateAndUpdateSingleDistrictRequest, CreateAndUpdateUserRequest, ToggleStateRequest } from 'src/app/models/requests';
import { ConfigService } from 'src/app/services/config.service';
import { UserService } from 'src/app/services/user.service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-districts',
  templateUrl: './districts.component.html',
  styleUrl: './districts.component.css'
})
export class DistrictsComponent implements OnInit {

  @ViewChild('globalFilter') globalFilter!: ElementRef;

  listDistricts: any;
  loading: boolean = true;
  districtDialog: boolean = false;
  districtForm!: FormGroup;
  districtFormSubmitBtnText: string = 'Save District';
  loadingButton: boolean = false;
  selectedDistricts!: any;
  selectedDistrict!: any;
  menuItems: any[] = [];
  showAddBulkDialog = false; // Controls dialog visibility
  showProgressBar = false; // Controls progress bar visibility
  progress = 0; // Progress value
  selectedFile: File | null = null; // Stores the uploaded file

  constructor(
    private usersService: UserService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private confirmationService: ConfirmationService,
    private utilService: UtilService,
    private configService: ConfigService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadDistricts();
    this.prepareDistrictDialogs();
  }

  loadDistricts(): void {
    this.loading = true;

    this.configService.getAllDistrictsForConfigure().pipe(
      switchMap(response => {
        if (response.errors) {
          this.messageService.add({
            key: 'tc', severity: 'error', summary: 'Ooops', detail: response.errors[0].message
          });
          this.loading = false;
          return of([]);
        }

        if (response.response != null) {
          this.listDistricts = response.response.map((district: any) => ({
            id: district.id,
            code: district.code,
            district_name: district.district_name,
            is_active: district.is_active,
            cr_by: district.cr_by,
            cr_dtimes: district.cr_dtimes
          }));

          return of(this.listDistricts);

        }
        return of([]);
      })
    ).subscribe(
      updatedDistricts => {
        this.listDistricts = updatedDistricts;
        this.loading = false;
      },
      error => {
        console.error('API error:', error);
        this.messageService.add({
          key: 'tc', severity: 'error', summary: 'Ooops', detail: 'Failed to load districts'
        });
        this.loading = false;
      }
    );
  }

  prepareDistrictDialogs() {
    this.districtForm = this.fb.group({
      districtName: ['', [Validators.required]],
      code: ['', [Validators.required]]
    });

  }


  private hasUserDataChanged(formData: any, selectedDistrict: District): boolean {
    return (
      formData.districtName !== selectedDistrict.district_name ||
      formData.code !== selectedDistrict.code
    );
  }

  saveDistrict(): void {
    if (this.districtForm.valid) {
      const formData = this.districtForm.value;

      if (this.selectedDistrict && !this.hasUserDataChanged(formData, this.selectedDistrict) && !formData.password) {
        this.messageService.add({ key: 'tc', severity: 'info', summary: 'No Changes Detected', detail: 'No changes have been made to the district.' });
        return;
      }

      this.loadingButton = true;
      this.districtFormSubmitBtnText = this.selectedDistrict ? 'Updating...' : 'Saving...';

      setTimeout(() => {
        // Construct request object
        const request: CreateAndUpdateSingleDistrictRequest = {
          district_name: formData.districtName,
          code: formData.code
        };

        console.log('Request Object:', JSON.stringify(request, null, 2));
        this.finalizeUserSave(request);
      }, 5000);
    } else {
      this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops', detail: 'You must enter a district name, code and choose status' });
    }
  }

  // Finalize the save or update operation
  private finalizeUserSave(request: CreateAndUpdateSingleDistrictRequest): void {
    if (this.selectedDistrict) {

      // Update existing entity
      this.configService.updateSingleDistrict(request, this.selectedDistrict.code).subscribe({
        next: data => {
          if (data.errors != null) {
            this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Updating district failed', detail: data.errors[0].message });
          } else {
            this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'Updating district was successful.' });
            this.resetDistrictForm();
            this.districtDialog = false;
            this.loadDistricts();
          }
          this.loadingButton = false;
          this.districtFormSubmitBtnText = 'Update District';
        },
        error: err => {
          this.loadingButton = false;
          this.districtFormSubmitBtnText = 'Update District';
          this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Updating district failed', detail: err.error.message });
        }
      });
    } else {
      // Create new district
      this.configService.createNewSingleDistrict(request).subscribe({
        next: data => {
          console.log("Create response: {} " + data);

          if (data.errors != null) {
            this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Saving new district failed', detail: data.errors[0].message });
          } else {
            this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'New district created.' });
            this.resetDistrictForm();
            //this.listDistricts = [...this.listDistricts, data.response.data];
            this.districtDialog = false;
            this.loadDistricts();
          }
          this.loadingButton = false;
          this.districtFormSubmitBtnText = 'Save District';
        },
        error: err => {
          this.loadingButton = false;
          this.districtFormSubmitBtnText = 'Save District';
          this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Saving new district failed', detail: err.error.message });
        }
      });
    }
  }

  resetDistrictForm(): void {
    this.districtForm.reset();
    this.selectedDistrict = null;
    this.districtDialog = false;
  }

  openDistrictDialog(selectedDistrict?: District) {
    this.resetDistrictForm();
    this.districtDialog = true;

    if (selectedDistrict) {
      this.selectedDistrict = selectedDistrict;
      this.districtFormSubmitBtnText = 'Update District';

      // Patch the form with selected user data
      this.districtForm.patchValue({
        code: selectedDistrict.code,
        districtName: selectedDistrict.district_name,
      });

    } else {
      this.selectedDistrict = null;
      this.districtFormSubmitBtnText = 'Save District';
    }
  }

  cancelDistrictForm() {
    this.resetDistrictForm();
  }

  showMenuForDistrict(menu: any, event: Event, district: any) {
    this.menuItems = this.getMenuItemsForRecord(district);
    menu.toggle(event);
  }

  getMenuItemsForRecord(district: any): any[] {
    return [
      {
        label: district.is_active ? 'Deactivate' : 'Activate',
        icon: district.is_active ? 'pi pi-times' : 'pi pi-check',
        command: () => {
          //console.log('Menu item clicked for deactivate/activate:', user);
          this.toggleDistrictState(district);
        }
      },
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        command: () => {
          //console.log('Menu item clicked for edit:', user);
          this.selectDistrict(district);
        }
      }
    ];
  }

  selectDistrict(district: District) {
    this.selectedDistrict = district;
    this.districtFormSubmitBtnText = 'Update District';

    // Patch form values with the selected user's data
    this.districtForm.patchValue({
      code: district.code,
      districtName: district.district_name
    });

    this.districtDialog = true;
  }

  toggleDistrictState(district: District) {

    const enabledOrDisabled = district.is_active;
    const action = enabledOrDisabled ? false : true;
    const actionDesc = enabledOrDisabled ? 'disable' : 'enable';

    const request: ToggleStateRequest = {
      toggle_state: action
    };

    this.confirmationService.confirm({
      message: `Are you sure you want to ${actionDesc} ${district.district_name} (${district.code})?`,
      accept: () => {

        this.configService.toggleDistrictState(district.code, request).subscribe({
          next: (response) => {
            if (response.errors == null && response.response.id != null) {
              this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'District state changed successfully' });
              this.loadDistricts();
            }
            else {
              this.messageService.add({ key: 'tc', severity: 'error', summary: 'Changing district state failed', detail: response.errors[0].message });
            }
          },
          error: (err: any) => {
            console.error('Error changing district state:', err);
          }
        });
      },
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text'
    });

  }

  exportExcel() {
    import('xlsx').then((xlsx) => {
      const exportData = this.listDistricts.map((district: { id: any; district_name: any; code: any; is_active: any; }) => {
        return {
          ID: district.id,
          DistrictName: district.district_name,
          Code: district.code,
          Active: district.is_active ? 'true' : 'false'
        };
      });

      // Convert the filtered data to a worksheet
      const worksheet = xlsx.utils.json_to_sheet(exportData);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });

      this.saveAsExcelFile(excelBuffer, 'districts');
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
      this.loadDistricts();
      this.loading = false;
    }, 3000);

  }

  openAddBulkDistrictDialog() {
    this.showAddBulkDialog = true;
  }
  
  closeAddBulkDistrictDialog() {
    this.showAddBulkDialog = false;
    this.selectedFile = null;
    this.showProgressBar = false;
    this.progress = 0;
  }
  
  onFileSelect(event: any) {
    const file = event.target.files[0]; // Get the file from the input event
    const maxFileSize = 2000000; // 2 MB
  
    if (!file) {
      this.messageService.add({ key: 'tc', severity: 'warn', summary: 'No File', detail: 'Please select a file to upload.' });
      return;
    }
  
    if (!this.isValidType(file)) {
      this.messageService.add({ key: 'tc', severity: 'error', summary: 'Invalid File', detail: 'Please select a valid .xlsx file.' });
      return;
    }
  
    if (file.size > maxFileSize) {
      this.messageService.add({
        key: 'tc',
        severity: 'error',
        summary: 'File Too Large',
        detail: `The file size exceeds the maximum limit of ${maxFileSize / 1000000} MB.`,
      });
      return;
    }
  
    this.selectedFile = file;
  }
  
  // Check if the file is valid .xlsx
  isValidType(file: File): boolean {
    return file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx');
  }
  
  confirmUpload() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to upload the file? All districts will be overridden by this new set.',
      header: 'Confirm Upload',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.startFileUpload();
      },
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text'
    });
  }
  
  startFileUpload() {
    if (!this.selectedFile) {
      this.messageService.add({ key: 'tc', severity: 'warn', summary: 'Warning', detail: 'No file selected!' });
      return;
    }
  
    this.showProgressBar = true;
    this.progress = 0;
  
    const formData = new FormData();
    formData.append('file', this.selectedFile);
  
    const interval = setInterval(() => {
      if (this.progress < 100) {
        this.progress += 10;
      } else {
        clearInterval(interval);
        this.configService.addBulkDistricts(formData).subscribe(
          (response) => {
            this.handleUploadResponse(response);
          },
          (error) => {
            this.handleUploadError(error);
          }
        );
      }
    }, 1000);
  }
  
  // Handle the file upload response
  handleUploadResponse(response: any) {
    this.showProgressBar = false;
  
    if (response.errors && response.errors.length > 0) {
      const errorMessage = response.errors.map((error: any) => error.message).join(', ');
      this.messageService.add({ key: 'tc', severity: 'error', summary: 'Upload Failed', detail: errorMessage });
    } else {
      this.messageService.add({ key: 'tc', severity: 'success', summary: 'Bulk Upload Successful', detail: 'Districts have been uploaded successfully.' });
      this.loadDistricts();
      this.closeAddBulkDistrictDialog();
    }
  }
  
  // Handle the file upload error
  handleUploadError(error: any) {
    this.showProgressBar = false;
    this.messageService.add({ key: 'tc', severity: 'error', summary: 'Upload Failed', detail: 'There was an error uploading the file.' });
  }
  
  clearFile(fileInput: any) {
    fileInput.value = ''; 
    this.selectedFile = null;
    this.messageService.add({ key: 'tc', severity: 'info', summary: 'File Cleared', detail: 'File selection has been cleared.' });
  }  
}
