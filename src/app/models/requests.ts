export interface AddBulkApplicationsRequest {
    file: File
}

export interface ApplicationsCriteriaSearchRequest {
    surname: string | null;
    otherNames: string | null;
    dateOfBirth: string | null;
    usecase: string | null;
    registrationArea: string | null;
    applicationId: string | null;
    gender: string | null;
    nin: string | null;
    documentNumber: string | null;
    batchNumber: string | null;
    issuanceKit: string | null;
    state: string | null;
    page: number | null;
    page_size: number | null;
}

export interface AddBulkDistrictsRequest {
    file: File
}

export interface CreateAndUpdateSingleDistrictRequest {
    district_name: string;
    code: string;
}

export interface CreateDistrictConfigRequest {
    districtCode: string;
    config: any;
}

export interface AddBulkLearnersRequest {
    file: File
}

export interface LearnersCriteriaSearchRequest {
    nin: string | null;
    surname: string | null;
    otherNames: string | null;
    dateOfBirth: string | null;
    enrollmentSchool: string | null;
    registrationArea: string | null;
    page: number | null;
    page_size: number | null;
}

export interface CreateAndUpdateUserRequest {
    username?: string;
    email?: string;
    full_names?: string;
    password?: string;
    role_id?: string;
}

export interface ToggleStateRequest {
    toggle_state: boolean;
}

export interface CreateAndUpdateRoleRequest {
    role_name?: string;
    description?: string;
}