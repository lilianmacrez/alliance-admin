export interface Financeur {
  id: string
  name: string
  type: 'DPEJ' | 'MECS' | 'FOYER' | 'AUTRE'
  contact_email: string | null
  contact_phone: string | null
  address: string | null
}

export interface ActType {
  id: string
  name: string
  default_rate: number
}

export interface Situation {
  id: string
  name: string
  parents_names: string | null
  children_names: string | null
  financeur_id: string
  eds_referent: string | null
  judge_name: string | null
  placement_location: string | null
  rate_vm_override: number | null
  rate_entretien_override: number | null
  is_active: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Act {
  id: string
  situation_id: string
  act_type_id: string
  act_date: string
  attendees: string | null
  status: 'PLANNED' | 'REALIZED' | 'ABSENT' | 'CANCELED'
  amount: number
  is_billed: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  type: 'DEVIS' | 'FACTURE'
  document_number: string
  situation_id: string
  financeur_id: string
  month_year: string | null
  total_amount: number
  status: 'DRAFT' | 'SENT' | 'PAID'
  issue_date: string
  notes: string | null
  created_at: string
}

export interface DocumentLine {
  id: string
  document_id: string
  act_id: string | null
  description: string
  quantity: number
  unit_price: number
  total: number
}
