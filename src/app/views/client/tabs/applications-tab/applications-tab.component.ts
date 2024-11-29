import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Application, District, Usecase } from 'src/app/models/interfaces';
import { AbstractControl, ValidatorFn } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ConfigService } from 'src/app/services/config.service';
import { ApplicationService } from 'src/app/services/application.service';
import { ApplicationsCriteriaSearchRequest } from 'src/app/models/requests';
import * as FileSaver from 'file-saver';
import { FieldValidationConfig, UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-applications-tab',
  templateUrl: './applications-tab.component.html',
  styleUrl: './applications-tab.component.css'
})
export class ApplicationsTabComponent implements OnInit, AfterViewInit {

  @ViewChildren('floatLabel') floatLabels!: QueryList<ElementRef>;

  registrationAreas: any;
  districts!: District[];
  selectedDistrict: District | undefined;
  usecases!: Usecase[];
  selectedUsecase!: Usecase;
  listApplications!: Application[];
  applicationsObject: any;
  selectedApplication!: Application;
  hasDivisionAsOffices: boolean = false;
  genderTypes!: any;
  applicationStates!: any;

  todayDate!: Date;
  queryForm!: FormGroup;
  showMoreFilters = false;

  loadingResults: boolean = false;
  totalRecords: number = 0; // Total number of applications for pagination
  pageSize: number = 10; // Number of rows per page
  currentPage: number = 1; // Current page

  hasQueryRun: boolean = false;
  displayApplicationDialog: boolean = false;
  applicationDetails: { field: string, value: string | number | null }[] = [];

  constructor(private fb: FormBuilder, private messageService: MessageService,
    private configService: ConfigService,
    private applicationService: ApplicationService,
    private utilService: UtilService,
  ) { }

  ngOnInit() {
    this.initializeTab();
    this.checkDistrictConfig();
  }

  ngAfterViewInit() {
    console.log(this.floatLabels.toArray()); // Check that floatLabels is populated
  }
  

  initializeTab() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0); // Ensure todayDate is at midnight
    this.prepareFilterForm();
  }

  checkDistrictConfig() {
    const configString = localStorage.getItem('config');
    if (configString) {
      try {
        const configObject = JSON.parse(configString);
        this.hasDivisionAsOffices = configObject.config?.hasDivisionAsOffices || false;
      } catch (error) {
        console.error('Failed to parse config from localStorage:', error);
        this.hasDivisionAsOffices = false; // Default to false in case of an error
      }
    }
  }

  prepareFilterForm() {
    this.populateFormDropdowns();

    const appIdConfig: FieldValidationConfig = {
      customPattern: /^[a-zA-Z0-9]+$/,
      requiredLength: 13,
      restrictedCharsPattern: /[OISBoisb]/
    };

    const ninConfig: FieldValidationConfig = {
      customPattern: /^(CM|CF|NM|NF|RM|PM|PF)\d{5}[AC-HJ-NP-RT-Z0-9]{7}$/,
      requiredLength: 14,
      restrictedCharsPattern: /[OISBoisb]/
    };

    const documentNumberConfig: FieldValidationConfig = {
      customPattern: /^\d{9}$/,
      requiredLength: 9
    };

    const issuanceKitConfig: FieldValidationConfig = {
      customPattern: /^\d{5}$/,
      requiredLength: 5
    }

    this.queryForm = this.fb.group({
      surname: [''],
      otherNames: [''],
      dateOfBirth: [''],
      applicationId: ['', [this.utilService.globalFieldValidator(appIdConfig)]],
      usecase: [null],
      registrationArea: [null],
      gender: [null],
      nin: ['', [this.utilService.globalFieldValidator(ninConfig)]],
      documentNumber: ['', [this.utilService.globalFieldValidator(documentNumberConfig)]],
      batchNumber: [''],
      issuanceKit: ['', [this.utilService.globalFieldValidator(issuanceKitConfig)]],
      applicationState: [null],
    });
  }

  populateFormDropdowns() {

    this.applicationService.getAllUsecases().subscribe(response => {
      const usecases_response = response.response.use_cases;
      //console.log(JSON.stringify(usecases_response));
      this.usecases = usecases_response.map((usecase: any) => ({ label: usecase, value: usecase }));
    });

    this.configService.getRegistrationAreas().subscribe(response => {
      const regAreas_response = response.response.registration_areas;
      this.registrationAreas = regAreas_response.map((area: any) => ({ label: area, value: area }));
    });

    this.configService.getGenderTypes().subscribe(response => {
      const gender_types_response = response;
      console.log(JSON.stringify(gender_types_response));
      this.genderTypes = gender_types_response.map((gender: any) => ({ label: gender.label, value: gender.value }));
    });

    this.applicationService.getAllApplicationStates().subscribe(response => {
      const states_response = response.response.states;
      this.applicationStates = states_response.map((state: any) => ({ label: state, value: state }));
    });
  }

  toggleMoreFilters() {
    this.showMoreFilters = !this.showMoreFilters;

    // If hiding extended filters, reset only those fields
    if (!this.showMoreFilters) {
      this.resetExtendedFilters();
    }
  }

  resetExtendedFilters() {
    const extendedFilterControls = ['gender', 'nin', 'applicationState', 'documentNumber', 'batchNumber', 'issuanceKit'];

    extendedFilterControls.forEach(control => {
      this.queryForm.get(control)?.reset();
    });
  }

  runQuery() {
    if (this.queryForm.valid) {
      this.currentPage = 1; // Reset to the first page on new search
      this.hasQueryRun = true; // Indicate that a query has been run
      this.loadApplications(this.buildSearchRequest());
    } else {
      setTimeout(() => {
        this.displayFormErrors();
      }, 200);
    }
  }

  displayFormErrors() {

    Object.keys(this.queryForm.controls).forEach(field => {
      const control = this.queryForm.get(field);
  
      if (control && control.invalid) {
        console.log(`Errors for ${field}:`, control.errors);
  
        // // Find the p-floatLabel that corresponds to the control
        // const labelElement = this.floatLabels.toArray().find(label => {
        //   const inputElement = label.nativeElement.querySelector(`input[formControlName="${field}"]`);
        //   return inputElement !== null;
        // });
  
        // // Fallback to the formControlName if labelElement is not found
        // const labelText = labelElement ? labelElement.nativeElement.querySelector('label').textContent : field;
  
        // Display error messages based on the validation error types
        if (control.hasError('invalidFormat')) {
          this.messageService.add({
            key: 'tc',
            severity: 'error',
            summary: 'Invalid Format',
            detail: `${this.utilService.capitalizeFirstLetterOfEachWord(field)} does not match the required format.`,
            life: 5000
          });
        }
        if (control.hasError('invalidLength')) {
          const requiredLength = control.getError('invalidLength').requiredLength;
          this.messageService.add({
            key: 'tc',
            severity: 'error',
            summary: 'Invalid Length',
            detail: `${this.utilService.capitalizeFirstLetterOfEachWord(field)} must be ${requiredLength} characters long.`,
            life: 5000
          });
        }
        if (control.hasError('invalidChars')) {
          this.messageService.add({
            key: 'tc',
            severity: 'error',
            summary: 'Invalid Characters',
            detail: `${this.utilService.capitalizeFirstLetterOfEachWord(field)} contains restricted characters.`,
            life: 5000
          });
        }
      }
    });
  }
  

  loadApplications(request: ApplicationsCriteriaSearchRequest) {
    this.loadingResults = true;
    this.applicationService.getApplicationsByCriteria(request).subscribe(
      response => {
        if (response.errors) {
          this.messageService.add({
            key: 'tc', severity: 'error', summary: 'Run Query', detail: response.errors[0].message
          });
        } else if (response.response != null) {
          // Map the applications data to listApplications
          this.listApplications = response.response.applications.map((app: any) => ({
            application_id: app.application_id,
            surname: app.surname,
            given_names: app.given_names,
            othernames: app.othernames,
            sex: app.sex,
            nin: app.nin,
            date_of_birth: app.date_of_birth,
            batch_number: app.batch_number,
            local_status: app.local_status,
            use_case: app.use_case,
            subcounty: app.subcounty,
            parish: app.parish,
            village: app.village,
            school_name: app.school_name
          }));
          this.totalRecords = response.response.pagination.totalRecords;
        }
        this.loadingResults = false;
      },
      error => {
        console.error('API error:', error);
        this.messageService.add({
          key: 'tc', severity: 'error', summary: 'Run Query', detail: 'Failed to execute query.'
        });
        this.loadingResults = false;
      }
    );
  }


  buildSearchRequest(): ApplicationsCriteriaSearchRequest {
    const formValues = this.queryForm.value;

    return {
      applicationId: formValues.applicationId ?? null,
      surname: formValues.surname ?? null,
      otherNames: formValues.otherNames ?? null,
      dateOfBirth: formValues.dateOfBirth ? this.utilService.formatDateForDb(formValues.dateOfBirth.toISOString()) : "",
      registrationArea: formValues.registrationArea ?? "",
      usecase: formValues.usecase ?? "",
      nin: formValues.nin ?? "",
      gender: formValues.gender ?? "",
      documentNumber: formValues.documentNumber ?? "",
      batchNumber: formValues.batchNumber ?? "",
      issuanceKit: formValues.issuanceKit ?? "",
      state: formValues.applicationState ?? "",
      page: this.currentPage,
      page_size: this.pageSize
    };
  }

  onLazyLoad(event: any) {
    if (this.hasQueryRun) { // Check if the query has run at least once
      this.currentPage = Math.floor(event.first / event.rows) + 1;
      this.pageSize = event.rows;
      console.log('Loading page:', this.currentPage, 'with page size:', this.pageSize);
      this.loadApplications(this.buildSearchRequest());
    }
  }

  clearForm() {
    this.queryForm.reset();
    this.prepareFilterForm();

    this.listApplications = []; // Clear the applications list
    this.hasQueryRun = false; // Reset the query run state
    this.totalRecords = 0; // Reset total records for pagination
    this.currentPage = 1; // Reset current page
    this.pageSize = 10; // Reset page size (optional if page size is fixed)
    this.loadingResults = false; // Ensure loading state is off
  }

  refreshResultsList() {

  }

  exportResultsExcel() {

    if (this.totalRecords > 0) {
      import('xlsx').then((xlsx) => {
        const exportData = this.listApplications.map((application: Application) => {
          return {
            ID: application.application_id,
            Surname: application.surname,
            Givenames: application.given_names,
            Othernames: application.othernames,
            DOB: application.date_of_birth,
            Sex: application.sex,
            NIN: application.nin,
            BatchNumber: application.batch_number,
            Status: application.local_status,
            Usecase: application.use_case,
            Subcounty: application.subcounty,
            Parish: application.parish,
            Village: application.village,
            School: application.school_name
          };
        });

        // Convert the filtered data to a worksheet
        const worksheet = xlsx.utils.json_to_sheet(exportData);
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });

        this.saveAsExcelFile(excelBuffer, 'applications');
      });
    }
    else {
      this.messageService.add({
        key: 'tc', severity: 'error', summary: 'Exporting', detail: 'No search results to export'
      });
    }
  }


  saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }

  selectApplication(application: Application) {
    this.selectedApplication = application;
    this.prepareApplicationDetails(application);
    this.displayApplicationDialog = true;
  }

  prepareApplicationDetails(application: Application) {
    this.applicationDetails = [
      { field: 'Application ID', value: application.application_id },
      { field: 'Surname', value: application.surname },
      { field: 'Other Names', value: `${application.given_names || ''} ${application.othernames || ''}`.trim() },
      { field: 'Date of Birth', value: application.date_of_birth ? new Date(application.date_of_birth).toLocaleDateString() : null },
      { field: 'Gender', value: application.sex },
      { field: 'NIN', value: application.nin },
      { field: 'Status', value: application.local_status },
      { field: 'Usecase', value: application.use_case },
      { field: 'Batch Number', value: application.batch_number },
      { field: 'Subcounty', value: application.subcounty },
      { field: 'Parish', value: application.parish },
      { field: 'Village', value: application.village },
      { field: 'School', value: application.school_name },
      // Add more fields as needed
    ];
  }

}
