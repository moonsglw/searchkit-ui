import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import * as FileSaver from 'file-saver';
import { MessageService } from 'primeng/api';
import { District, Learner } from 'src/app/models/interfaces';
import { LearnersCriteriaSearchRequest } from 'src/app/models/requests';
import { ConfigService } from 'src/app/services/config.service';
import { LearnerService } from 'src/app/services/learner.service';
import { FieldValidationConfig, UtilService } from 'src/app/services/util.service';


@Component({
  selector: 'app-learners-tab',
  templateUrl: './learners-tab.component.html',
  styleUrl: './learners-tab.component.css'
})
export class LearnersTabComponent implements OnInit {

  @ViewChildren('p-floatLabel') floatLabels!: QueryList<ElementRef>;

  registrationAreas: any;
  districts!: District[];
  selectedDistrict: District | undefined;
  listLearners!: Learner[];
  learnersObject: any;
  selectedLearner!: Learner;
  hasDivisionAsOffices: boolean = false;

  todayDate!: Date;
  queryForm!: FormGroup;
  showMoreFilters = false;

  loadingResults: boolean = false;
  totalRecords: number = 0; // Total number of applications for pagination
  pageSize: number = 10; // Number of rows per page
  currentPage: number = 1; // Current page

  hasQueryRun: boolean = false;
  displayLearnerDialog: boolean = false;
  learnerDetails: { field: string, value: string | number | null }[] = [];

  constructor(private fb: FormBuilder, private messageService: MessageService,
    private configService: ConfigService,
    private learnerService: LearnerService,
    private utilService: UtilService,
  ) { }

  ngOnInit() {
    this.initializeTab();
    this.checkDistrictConfig();
  }

  initializeTab() {
    this.todayDate = new Date();
    this.todayDate.setHours(0, 0, 0, 0);
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

    const ninConfig: FieldValidationConfig = {
      customPattern: /^(CM|CF|NM|NF|RM|PM|PF)\d{5}[AC-HJ-NP-RT-Z0-9]{7}$/,
      requiredLength: 14,
      restrictedCharsPattern: /[OISBoisb]/
    };

    this.queryForm = this.fb.group({
      surname: [''],
      otherNames: [''],
      dateOfBirth: [''],
      registrationArea: [null],
      nin: ['', [this.utilService.globalFieldValidator(ninConfig)]],
      enrollmentSchool: [''],
    });
  }

  populateFormDropdowns() {

    this.configService.getAllDistricts().subscribe(response => {
      const districts_response = response.response;
      this.registrationAreas = districts_response.map((district: any) => ({ label: district.district_name, value: district.district_name }));
    });

  }

  // toggleMoreFilters() {
  //   this.showMoreFilters = !this.showMoreFilters;

  //   // If hiding extended filters, reset only those fields
  //   if (!this.showMoreFilters) {
  //     this.resetExtendedFilters();
  //   }
  // }

  // resetExtendedFilters() {
  //   const extendedFilterControls = ['gender', 'nin', 'applicationState', 'documentNumber', 'batchNumber', 'issuanceKit'];
    
  //   extendedFilterControls.forEach(control => {
  //     this.queryForm.get(control)?.reset();
  //   });
  // }

  runQuery() {
    if (this.queryForm.valid) {
      this.currentPage = 1; // Reset to the first page on new search
      this.hasQueryRun = true; // Indicate that a query has been run
      this.loadLearners(this.buildSearchRequest());
    } else {
      this.displayFormErrors();
    }
  }

  displayFormErrors() {
    Object.keys(this.queryForm.controls).forEach(field => {
      const control = this.queryForm.get(field);

      if (control && control.invalid) {
        // Find the label associated with this control
        const labelElement = this.floatLabels.find(label => {
          const inputElement = label.nativeElement.querySelector('input');
          return inputElement && inputElement.getAttribute('formControlName') === field;
        });
        
        // Fallback to form control name if label is not found
        const labelText = labelElement ? labelElement.nativeElement.querySelector('label').textContent : field;

        // Display error messages based on the validation error types
        if (control.hasError('invalidFormat')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Invalid Format',
            detail: `${labelText} does not match the required format.`,
            life: 5000
          });
        }
        if (control.hasError('invalidLength')) {
          const requiredLength = control.getError('invalidLength').requiredLength;
          this.messageService.add({
            severity: 'error',
            summary: 'Invalid Length',
            detail: `${labelText} must be ${requiredLength} characters long.`,
            life: 5000
          });
        }
        if (control.hasError('invalidChars')) {
          this.messageService.add({
            severity: 'error',
            summary: 'Invalid Characters',
            detail: `${labelText} contains restricted characters.`,
            life: 5000
          });
        }
      }
    });
  }
  

  loadLearners(request: LearnersCriteriaSearchRequest) {
    this.loadingResults = true;
    this.learnerService.getLearnersByCriteria(request).subscribe(
      response => {
        if (response.errors) {
          this.messageService.add({
            key: 'tc', severity: 'error', summary: 'Run Query', detail: response.errors[0].message
          });
        } else if (response.response != null) {
          // Map the applications data to listLearners
          this.listLearners = response.response.learners.map((learner: any) => ({
            nin: learner.nin,
            surname: learner.surname,
            given_names: learner.given_names,
            date_of_birth: learner.date_of_birth,
            district: learner.district,
            subcounty: learner.subcounty,
            parish: learner.parish,
            village: learner.village,
            enrollment_school: learner.enrollment_school
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


  buildSearchRequest(): LearnersCriteriaSearchRequest {
    const formValues = this.queryForm.value;

    return {
      surname: formValues.surname ?? null,
      otherNames: formValues.otherNames ?? null,
      dateOfBirth: formValues.dateOfBirth ? this.utilService.formatDateForDb(formValues.dateOfBirth.toISOString()) : "",
      registrationArea: formValues.registrationArea ?? "",
      enrollmentSchool: formValues.enrollmentSchool ?? "",
      nin: formValues.nin ?? "",
      page: this.currentPage,
      page_size: this.pageSize
    };
  }

  onLazyLoad(event: any) {
    if (this.hasQueryRun) { // Check if the query has run at least once
      this.currentPage = Math.floor(event.first / event.rows) + 1;
      this.pageSize = event.rows;
      console.log('Loading page:', this.currentPage, 'with page size:', this.pageSize);
      this.loadLearners(this.buildSearchRequest());
    }
  }

  clearForm() {
    this.queryForm.reset();
    this.prepareFilterForm();

    this.listLearners = []; 
    this.hasQueryRun = false; 
    this.totalRecords = 0; 
    this.currentPage = 1; 
    this.pageSize = 10; 
    this.loadingResults = false; 
  }

  refreshResultsList() {

  }

  exportResultsExcel() {

    if(this.totalRecords > 0){
      import('xlsx').then((xlsx) => {
        const exportData = this.listLearners.map((learner: Learner) => {
          return {
            NIN: learner.nin,
            Surname: learner.surname,
            GivenNames: learner.given_names,
            DOB: learner.date_of_birth,
            District: learner.district,
            Subcounty: learner.subcounty,
            Parish: learner.parish,
            Village: learner.village,
            School: learner.enrollment_school
          };
        });
  
        // Convert the filtered data to a worksheet
        const worksheet = xlsx.utils.json_to_sheet(exportData);
        const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
        const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
  
        this.saveAsExcelFile(excelBuffer, 'learners');
      });
    }
    else{
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

  selectLearner(learner: Learner) {
    this.selectedLearner = learner;
    this.prepareLearnerDetails(learner);
    this.displayLearnerDialog = true;
  }

  prepareLearnerDetails(learner: Learner) {
    this.learnerDetails = [
      { field: 'NIN', value: learner.nin },
      { field: 'Surname', value: learner.surname },
      { field: 'Given Names', value: learner.given_names },
      { field: 'Date of Birth', value: learner.date_of_birth ? new Date(learner.date_of_birth).toLocaleDateString() : null },
      { field: 'School', value: learner.enrollment_school },
      { field: 'District', value: learner.district },
      { field: 'Subcounty', value: learner.subcounty },
      { field: 'Parish', value: learner.parish },
      { field: 'Village', value: learner.village },
    ];
  }

}
