export interface IStageField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'url' | 'file' | 'checkbox';
    required: boolean;
    placeholder?: string;
}

export interface IStageConfig {
    fields?: IStageField[];
    quiz_id?: string;
}

export interface IStage {
    id: string;
    name: string;
    type: string;
    description: string;
    start_date: string;
    end_date: string;
    config?: IStageConfig;
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
