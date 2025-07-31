export interface Patient {
  patient_id: string
  name: string
  age: number
  gender: string
  blood_pressure: string
  temperature: number
  visit_date: Date
  diagnosis: string
  medications: string
}

export interface FinalResults {
  high_risk_patients: string[]
  fever_patients: string[]
  data_quality_issues: string[]
}
