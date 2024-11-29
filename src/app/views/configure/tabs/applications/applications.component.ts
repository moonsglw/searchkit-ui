import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { switchMap, of, BehaviorSubject } from 'rxjs';
import { API } from 'src/app/app.constants';
import { ApplicationStatisticsDetais } from 'src/app/models/interfaces';
import { ApplicationService } from 'src/app/services/application.service';

import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.css'
})
export class ApplicationsComponent implements OnInit {

  applicationsStatisticsObj: any;
  applicationsStatisticsDetails: { field: string, value: any }[] = [];
  loading: boolean = true;
  applicationsStatisticsDialog: boolean = false;
  applicationsStatisticsForm!: FormGroup;
  applicationsStatisticsFormSubmitBtnText: string = 'Update Config';
  loadingButton: boolean = false;
  selectedStationAppConfig!: any;
  logoutDialogVisible: boolean = false;
  addNewDataSetVisible: boolean = false;
  showAddNewDateSetDialog: boolean = false;
  showProgressBar = false; // Controls progress bar visibility
  progress = 0; // Progress value
  selectedFile: File | null = null; // Stores the uploaded file

  constructor(private messageService: MessageService,
    private applicationService: ApplicationService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadApplicationsStatistics();
  }

  loadApplicationsStatistics() {
    this.loading = true;

    this.applicationService.getApplicationsStatistics().pipe(
      switchMap((response: any) => {
        if (response.errors) {
          this.messageService.add({
            key: 'tc', severity: 'error', summary: 'Ooops', detail: response.errors[0].message
          });
          this.loading = false;
          return of([]);
        }

        if (response.response != null) {

          if (response.response.total_applications == 0) {
            this.addNewDataSetVisible = true;
          }

          this.applicationsStatisticsObj = response.response;
          return of(this.applicationsStatisticsObj);
        }
        return of([]);
      })
    ).subscribe(
      updatedStats => {
        this.applicationsStatisticsObj = updatedStats;
        this.prepareApplicationStatisticsDetails(this.applicationsStatisticsObj);
        this.loading = false;
      },
      error => {
        console.error('API error:', error);
        this.messageService.add({
          key: 'tc', severity: 'error', summary: 'Ooops', detail: 'Failed to load station app config'
        });
        this.loading = false;
      }
    );
  }

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  prepareApplicationStatisticsDetails(statDetail: ApplicationStatisticsDetais) {
    this.applicationsStatisticsDetails = [
      { field: 'Total number of applications', value: statDetail.total_applications ?? 'None' },
      { field: 'Usecases', value: statDetail.use_cases && statDetail.use_cases.length > 0 ? statDetail.use_cases : 'None' },
      { field: 'Local States', value: statDetail.local_statuses && statDetail.local_statuses.length > 0 ? statDetail.local_statuses : 'None' },
      { field: 'Number of issuance kits', value: statDetail.issuing_kits_count ?? 'None' },
      { field: 'Number of documents', value: statDetail.documents_count ?? 'None' },
      { field: 'Number of batches', value: statDetail.batches_count ?? 'None' },
      { field: 'Last Upload Date', value: statDetail.last_upload_time ?? 'None' },
      { field: 'Last Uploaded by', value: statDetail.last_upload_by ?? 'None' },
    ];
  }

  openAddNewDataSetDialog(): void {
    this.showAddNewDateSetDialog = true;
  }


  closeAddNewDataSetDialog() {
    this.showAddNewDateSetDialog = false;
    this.selectedFile = null;
    this.showProgressBar = false;
    this.progress = 0;
  }

  onFileSelect(event: any) {
    const file = event.target.files[0]; // Get the file from the input event
    const maxFileSize = 2147483648; // 2 GB

    if (!file) {
      this.messageService.add({ key: 'tc', severity: 'warn', summary: 'No File', detail: 'Please select a file to upload.' });
      return;
    }

    if (!this.isValidType(file)) {
      this.messageService.add({ key: 'tc', severity: 'error', summary: 'Invalid File', detail: 'Please select a valid .csv file.' });
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

  // Check if the file is valid .csv
  isValidType(file: File): boolean {
    return file.type === 'application/csv' || file.name.endsWith('.csv');
  }

  confirmUpload() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to upload the file? All applications will be overridden by this new set.',
      header: 'Confirm Upload',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.startFileUpload();
      },
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text'
    });
  }

  // startFileUpload() {
  //   if (!this.selectedFile) {
  //     this.messageService.add({ key: 'tc', severity: 'warn', summary: 'Warning', detail: 'No file selected!' });
  //     return;
  //   }

  //   this.showProgressBar = true;
  //   this.progress = 0;

  //   const formData = new FormData();
  //   formData.append('file', this.selectedFile);

  //   const interval = setInterval(() => {
  //     if (this.progress < 100) {
  //       this.progress += 10;
  //     } else {
  //       clearInterval(interval);
  //       this.applicationService.addBulkApplications(formData).subscribe(
  //         (response) => {
  //           this.handleUploadResponse(response);
  //         },
  //         (error) => {
  //           this.handleUploadError(error);
  //         }
  //       );
  //     }
  //   }, 1000);
  // }

  // // Handle the file upload response
  // handleUploadResponse(response: any) {
  //   this.showProgressBar = false;

  //   if (response.errors && response.errors.length > 0) {
  //     const errorMessage = response.errors.map((error: any) => error.message).join(', ');
  //     this.messageService.add({ key: 'tc', severity: 'error', summary: 'Upload Failed', detail: errorMessage });
  //   } else {
  //     this.messageService.add({ key: 'tc', severity: 'success', summary: 'Bulk Upload Successful', detail: response.response.count + ' applications have been uploaded successfully.' });
  //     this.loadApplicationsStatistics();
  //     this.addNewDataSetVisible = false;
  //     this.closeAddNewDataSetDialog();
  //   }
  // }

  startFileUpload() {
    if (!this.selectedFile) {
      this.messageService.add({ key: 'tc', severity: 'warn', summary: 'Warning', detail: 'No file selected!' });
      return;
    }

    this.showProgressBar = true;
    this.progress = 0;

    // Generate operationId in the frontend
    const operationId = uuidv4();
    console.log('Generated operationId:', operationId);

    // Connect to the WebSocket immediately
    this.trackProgress(operationId);

    // Prepare the form data with the operationId
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('operation_id', operationId); // Include the operationId in the form data

    // Upload the file
    this.applicationService.addBulkApplications(formData).subscribe(
      (response) => {
        console.log('File uploaded successfully:', response);
      },
      (error) => {
        this.handleUploadError(error);
      }
    );
  }

  // Track progress using WebSocket
  trackProgress(operationId: string) {
    const ws = new WebSocket(`ws://${API.WEBSOCKET}/progress/${operationId}`);
  
    ws.onopen = () => {
      console.log('WebSocket connection established for operation:', operationId);
    };
  
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
  
        if (data.progress !== undefined) {
          this.progress = data.progress;
          this.cdr.detectChanges(); // Update UI
          console.log('Progress updated:', data.progress);
  
          if (data.progress === 100) {
            this.showProgressBar = false;
            console.log('Operation complete, closing WebSocket.');
            ws.close();
  
            // Handle success or failure
            if (data.status === 'Completed') {
              this.messageService.add({
                key: 'tc',
                severity: 'success',
                summary: 'Upload Successful',
                detail: 'Bulk upload completed.',
              });
              this.loadApplicationsStatistics();
              this.addNewDataSetVisible = false;
              this.closeAddNewDataSetDialog();
            } else if (data.status.startsWith('Failed')) {
              this.handleUploadError({ message: data.status });
            }
          }
        }
      } catch (e) {
        console.error('Error processing WebSocket message:', e);
      }
    };
  
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleUploadError({ message: 'WebSocket error occurred.' });
      ws.close();
    };
  
    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
    };
  
    // Optional: Automatic reconnection logic
    const reconnectInterval = 5000;
    ws.onclose = (event) => {
      if (!this.progress || this.progress < 100) {
        console.warn('WebSocket closed prematurely, attempting to reconnect...');
        setTimeout(() => this.trackProgress(operationId), reconnectInterval);
      }
    };
  
    // Remove the fixed timeout or adjust dynamically based on operation duration
  }
  
  // Handle the file upload error
  handleUploadError(error: any) {
    this.showProgressBar = false;
    this.messageService.add({ key: 'tc', severity: 'error', summary: 'Upload Failed', detail: error.message });
  }

  clearFile(fileInput: any) {
    fileInput.value = '';
    this.selectedFile = null;
    this.messageService.add({ key: 'tc', severity: 'info', summary: 'File Cleared', detail: 'File selection has been cleared.' });
  }
}
