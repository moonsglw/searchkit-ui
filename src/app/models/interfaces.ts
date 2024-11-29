export interface District {
    id: string;
    district_name: string;
    code: string;
    is_active: boolean;
    cr_by: string;
    cr_dtimes: string;
}

export interface Usecase {
    name: string;
    code: string;
}

export interface Application {
    application_id: string;
    surname: string;
    given_names: string;
    othernames: string;
    nin: string;
    sex: string;
    date_of_birth: string;
    central_status: string;
    document_number: string;
    batch_number: string;
    local_status: string;
    use_case: string;
    child_applicant_surname: string;
    child_applicant_givenname: string;
    child_applicant_nin: string;
    school_name: string;
    subcounty: string;
    parish: string;
    village: string;
    current_issuing_kit: string;
}

export interface Learner {
    nin: string;
    surname: string;
    given_names: string;
    date_of_birth: string;
    enrollment_school: string;
    district: string;
    subcounty: string;
    parish: string;
    village: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    full_names: string;
    is_active: boolean;
    role_id: string;
    cr_by: string;
    cr_dtimes: string;
}

export interface Role {
    role_id: string;
    role_name: string;
    description: string;
    is_active: boolean;
    cr_by: string;
    cr_dtimes: string;
}

export interface StationAppConfig {
    id: string;
    district_code: string;
    district_name: string;
    config: string;
    is_active: boolean;
    cr_by: string;
    cr_dtimes: string;
    upd_by: string;
    upd_dtimes: string;
}

export interface ApplicationStatisticsDetais {
    total_applications: number;
    use_cases: any;
    local_statuses: any;
    issuing_kits_count: number;
    documents_count: number;
    batches_count: number;
    last_upload_time: string;
    last_upload_by: string;
}