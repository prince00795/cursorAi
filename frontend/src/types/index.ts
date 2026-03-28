export interface User {
  id: string;
  name: string;
  phone: string;
  role: 'farmer' | 'admin';
}

export interface FarmerProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  aadhar?: string;
  state: string;
  district: string;
  village?: string;
  pincode?: string;
  land_area_acres: number;
  land_type: 'owned' | 'leased' | 'shared';
  caste: string;
  annual_income: number;
  crops: string; // JSON string
  irrigation_type: string;
  bank_account: number;
  smartphone_proficiency: 'none' | 'low' | 'medium' | 'high';
  preferred_language: string;
  previously_allotted_schemes: string; // JSON string
  created_at: string;
  updated_at: string;
}

export interface Scheme {
  id: string;
  name: string;
  name_hindi: string;
  ministry: string;
  category: string;
  description: string;
  description_hindi: string;
  benefits: string;
  benefits_hindi: string;
  eligibility_criteria: string;
  required_documents: string; // JSON string
  application_url?: string;
  helpline?: string;
  deadline?: string;
  is_active: number;
  min_land_acres: number;
  max_land_acres?: number;
  min_income: number;
  max_income?: number;
  eligible_castes: string; // JSON string
  eligible_states: string; // JSON string
  eligible_crops: string; // JSON string
  requires_bank_account: number;
  priority_score: number;
}

export interface SchemeMatch {
  scheme: Scheme;
  eligible: boolean;
  priority_score: number;
  match_reasons: string[];
  missing_criteria: string[];
}

export interface Application {
  id: string;
  farmer_id: string;
  scheme_id: string;
  scheme_name: string;
  name_hindi?: string;
  ministry: string;
  category: string;
  benefits: string;
  helpline?: string;
  application_url?: string;
  application_number?: string;
  status: 'interested' | 'documents_ready' | 'applied' | 'approved' | 'rejected' | 'disbursed';
  applied_at?: string;
  last_updated: string;
  notes?: string;
  feedback?: string;
  applied_via?: string;
  csc_center?: string;
  created_at: string;
}

export interface CallLog {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_phone: string;
  call_type: 'initial' | 'follow_up' | 'reminder';
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'failed';
  scheduled_at?: string;
  called_at?: string;
  duration_seconds: number;
  outcome?: string;
  notes?: string;
  schemes_discussed: string;
  created_at: string;
}

export interface AdminStats {
  summary: {
    totalFarmers: number;
    totalSchemes: number;
    totalApplications: number;
    appliedCount: number;
    pendingCalls: number;
    completedCalls: number;
  };
  byStatus: Array<{ status: string; count: number }>;
  schemesByCategory: Array<{ category: string; count: number }>;
  topSchemes: Array<{ name: string; applications: number }>;
  recentFarmers: FarmerProfile[];
}

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
];

export const CASTES = ['General', 'OBC', 'SC', 'ST', 'EWS'];

export const CROPS = [
  'Wheat', 'Rice/Paddy', 'Maize', 'Bajra', 'Jowar', 'Ragi',
  'Sugarcane', 'Cotton', 'Soybean', 'Groundnut', 'Mustard', 'Sunflower',
  'Tomato', 'Onion', 'Potato', 'Brinjal', 'Chilli', 'Cabbage',
  'Mango', 'Banana', 'Grapes', 'Pomegranate', 'Orange', 'Guava',
  'Pulses/Dal', 'Chickpea', 'Lentil', 'Moong', 'Urad',
  'Turmeric', 'Ginger', 'Garlic',
];

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  interested: 'Interested',
  documents_ready: 'Documents Ready',
  applied: 'Applied',
  approved: 'Approved',
  rejected: 'Rejected',
  disbursed: 'Benefit Received',
};

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  interested: 'badge-blue',
  documents_ready: 'badge-yellow',
  applied: 'badge-green',
  approved: 'badge-green',
  rejected: 'badge-red',
  disbursed: 'badge-green',
};
