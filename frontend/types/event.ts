export interface IStageField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'url' | 'file' | 'checkbox';
    required: boolean;
    placeholder?: string;
}

export interface IStageConfig {
    fields?: IStageField[];
    judgeIds?: string[];
    quiz_id?: string;
    pass_mark?: number;
    team_min_size?: number;
    team_max_size?: number;
    allow_individual_registration?: boolean;
    allow_cross_college_teams?: boolean;
    team_formation_instructions?: string;
}

export interface IStageCommunication {
    send_email_on_unlock?: boolean;
    email_subject_override?: string;
    email_body_markdown?: string;
    draft_email_subject_override?: string;
    draft_email_body_markdown?: string;
    has_unpublished_changes?: boolean;
}

export interface IStage {
    id: string;
    name: string;
    type: string;
    description: string;
    start_date: string;
    end_date: string;
    result_time?: string;
    depends_on?: string[];
    status?: 'Active' | 'Upcoming' | 'Completed';
    stored_status?: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
    visibility?: 'Public' | 'Private' | 'Shortlisted Only';
    roundMode?: 'Online' | 'Offline' | 'Hybrid';
    config?: IStageConfig;
    communication?: IStageCommunication;
}

export interface IEvent {
    _id: string;
    title: string;
    description: string;
    category: string;
    status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
    stages: IStage[];
    judges?: any[];
    judging_criteria?: any[];
    opportunity_id?: string;
    min_team_size?: number;
    max_team_size?: number;
    external_registration_link?: string;
}

export interface ITeamMember {
    user_id: string;
    name: string;
    email: string;
    is_leader: boolean;
}

export interface ITeam {
    _id: string;
    team_name: string;
    event_id: string;
    leader_id: string;
    members: ITeamMember[];
    invite_code?: string;
}

export interface IParticipant {
    _id: string;
    event_id: string;
    user_id: string;
    team_id?: string;
    status: string;
    current_stage?: string;
    last_stage_submitted?: string;
    full_name?: string;
    email?: string;
    registered_at?: string;
    source?: string;
    opportunity_application_id?: string;
    opportunity_id?: string;
}

export interface ISubmission {
    _id: string;
    event_id: string;
    stage_id: string;
    team_id?: string;
    user_id?: string;
    user_name?: string;
    team_name?: string;
    submitted_at: string;
    data: {
        file_url?: string;
        filename?: string;
        url?: string;
        [key: string]: any;
    };
}
