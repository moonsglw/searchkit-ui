import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { of, switchMap } from 'rxjs';
import { StationAppConfig } from 'src/app/models/interfaces';
import { CreateDistrictConfigRequest } from 'src/app/models/requests';
import { ConfigService } from 'src/app/services/config.service';
import { AuthService } from 'src/app/views/auth/auth.service';

@Component({
  selector: 'app-district-configs',
  templateUrl: './district-configs.component.html',
  styleUrl: './district-configs.component.css'
})
export class DistrictConfigsComponent implements OnInit {

  stationAppConfigObj: any;
  stationAppConfigDetails: { field: string, value: string | number | boolean | null }[] = [];
  loading: boolean = true;
  listDistricts: any;
  stationAppConfigDialog: boolean = false;
  stationAppConfigForm!: FormGroup;
  stationAppConfigFormSubmitBtnText: string = 'Update Config';
  loadingButton: boolean = false;
  selectedStationAppConfig!: any;
  logoutDialogVisible: boolean = false;

  constructor(private messageService: MessageService,
    private configService: ConfigService,
    private authService: AuthService,
    private fb: FormBuilder, 
  ){}

  ngOnInit(): void {
    this.loadStationAppConfig();
    this.prepareStationAppDialog();
  }

  loadStationAppConfig(): void {
    this.loading = true;

    this.configService.getStationAppConfig().pipe(
      switchMap(response => {
        if (response.errors) {
          this.messageService.add({
            key: 'tc', severity: 'error', summary: 'Ooops', detail: response.errors[0].message
          });
          this.loading = false;
          return of([]);
        }

        if (response.response != null) {
          this.stationAppConfigObj = response.response;
          return of(this.stationAppConfigObj);
        }
        return of([]);
      })
    ).subscribe(
      updatedAppConfig => {
        this.stationAppConfigObj = updatedAppConfig;
        this.prepareStationAppConfigDetails(this.stationAppConfigObj);
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

  prepareStationAppConfigDetails(stationAppConfig: StationAppConfig) {
    this.stationAppConfigDetails = [
      { field: 'ID', value: stationAppConfig.id },
      { field: 'District Name', value: stationAppConfig.district_name },
      { field: 'District Code', value: stationAppConfig.district_code },
      { field: 'Config', value: stationAppConfig.config },
      { field: 'IsActive', value: stationAppConfig.is_active },
      { field: 'Datetime Created', value: stationAppConfig.cr_dtimes },
      { field: 'Created by', value: stationAppConfig.cr_by },
      { field: 'Datetime Updated', value: stationAppConfig.upd_dtimes },
      { field: 'Updated by', value: stationAppConfig.upd_by },
    ];
  }

  prepareStationAppDialog() {

    this.stationAppConfigForm = this.fb.group({
      districtName: ['', [Validators.required]],
      districtCode: ['', [Validators.required]],
      config: ['', Validators.required],
    });


    this.listDistricts = [];
    this.configService.getAllDistricts().subscribe(response => {
      const districts_response = response.response;
      this.listDistricts = districts_response.map((district: any) => ({ label: district.district_name, value: district.code }));
    });

  }

  private hasUserDataChanged(formData: any, editingStationApp: StationAppConfig): boolean {

    const districtChanged = editingStationApp.district_code !== formData.districtCode;

    return (
      formData.config !== editingStationApp.config ||
      districtChanged
    );
  }

  saveStationAppConfig(): void {
    if (this.stationAppConfigForm.valid) {
      const formData = this.stationAppConfigForm.value;

      if (this.selectedStationAppConfig && !this.hasUserDataChanged(formData, this.selectedStationAppConfig)) {
        this.messageService.add({ key: 'tc', severity: 'info', summary: 'No Changes Detected', detail: 'No changes have been made to app config.' });
        return;
      }

      this.loadingButton = true;
      this.stationAppConfigFormSubmitBtnText = 'Updating...';

      setTimeout(() => {

        let configObject: object;

        try {
            configObject = JSON.parse(formData.config); 
        } catch (error) {
            this.messageService.add({
                key: 'tc',
                severity: 'error',
                summary: 'Invalid JSON',
                detail: 'The configuration provided is not a valid JSON.'
            });
            this.loadingButton = false;
            this.stationAppConfigFormSubmitBtnText = 'Update Config';
            return;
        }

        // Construct request object
        const request: CreateDistrictConfigRequest = {
          districtCode: formData.districtCode,
          config: configObject 
        };

        console.log('Request Object:', JSON.stringify(request, null, 2));
        this.finalizeSave(request);
      }, 5000);
    } else {
      this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops', detail: 'You must select a district, and enter configurations for it' });
    }
  }

  private finalizeSave(request: CreateDistrictConfigRequest): void {
    if (this.selectedStationAppConfig) {

      console.log("app config id: " + this.selectedStationAppConfig.id);
      
      this.configService.updateDistrictConfigs(request, this.selectedStationAppConfig.id).subscribe({
        next: data => {
          if (data.errors != null) {
            this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Updating config failed', detail: data.errors[0].message });
          } else {
            this.messageService.add({ key: 'tc', severity: 'success', summary: 'Success', detail: 'Updating config was successful.' });
            this.resetStationAppConfigForm();
            this.stationAppConfigDialog = false;
            this.loadStationAppConfig();

            this.logoutDialogVisible = true;
          }
          this.loadingButton = false;
          this.stationAppConfigFormSubmitBtnText = 'Update Config';
        },
        error: err => {
          this.loadingButton = false;
          this.stationAppConfigFormSubmitBtnText = 'Update Config';
          this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Updating config failed', detail: err.error.message });
        }
      });
    } else {
      this.messageService.add({ key: 'tc', severity: 'error', summary: 'Oops! Updating config failed', detail: 'No station app config found' });
    }
  }

  resetStationAppConfigForm(): void {
    this.stationAppConfigForm.reset();
    this.selectedStationAppConfig = null;
    this.stationAppConfigDialog = false;
  }

  openStationAppConfigDialog() {

    const selectedStationAppConfig = this.stationAppConfigObj;

    this.resetStationAppConfigForm();
    this.stationAppConfigDialog = true;

    if (selectedStationAppConfig) {
      this.selectedStationAppConfig = selectedStationAppConfig;
      this.stationAppConfigFormSubmitBtnText = 'Update Config';

      this.stationAppConfigForm.patchValue({
        districtName: selectedStationAppConfig.district_code,
        districtCode: selectedStationAppConfig.district_code,
        config: selectedStationAppConfig.config,
      });
    
    }
  }

  onDistrictNameChange(event: any): void {

    const selectedDistrict = this.listDistricts.find(
      (district: any) => district.value === event.value
    );
  
    if (selectedDistrict) {
      this.stationAppConfigForm.patchValue({
        districtCode: selectedDistrict.value, 
      });
    } else {
      this.stationAppConfigForm.patchValue({
        districtCode: '',
      });
    }
  }
  
  cancelStationAppConfigForm() {
    this.resetStationAppConfigForm();
  }

  logoutUserAfterConfigChange(): void {
    this.authService.logout();
  }

}
