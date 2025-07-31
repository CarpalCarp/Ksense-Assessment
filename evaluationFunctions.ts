import type { FinalResults, Patient } from "./Patient.ts";

export function evaluateBloodPressureRisk(patientResults: FinalResults, patient: Patient, patientMap: Map<string, number>): Map<string, number> {
  if (!patient.blood_pressure) {
    patientResults.data_quality_issues.push(patient.patient_id);
    return patientMap;
  }
  const [systolic, dialostic] = patient.blood_pressure.split('/').map((value) => parseInt(value));
  if (systolic === undefined || dialostic === undefined || isNaN(systolic) || isNaN(dialostic)) {
    patientResults.data_quality_issues.push(patient.patient_id);
    return patientMap;
  }

  let score = patientMap.get(patient.patient_id) ?? 0;
  if (systolic >= 140 || dialostic >= 90) {
    score += 3;
  } else if ((systolic >= 130 && systolic <= 139) || (dialostic >= 80 && dialostic <= 89)) {
    score += 2
  } else if (systolic >= 120 && systolic <= 129 && dialostic < 80) {
    score += 1;
  } else if (systolic < 120 && dialostic < 80) {
    score += 0;
  }

  patientMap.set(patient.patient_id, score);
  return patientMap;
}

export function evaluateTemperatureRisk(patientResults: FinalResults, patient: Patient, patientMap: Map<string, number>): Map<string, number> {
  if (!patient.temperature || isNaN(patient.temperature)) {
    patientResults.data_quality_issues.push(patient.patient_id);
    return patientMap;
  }

  let score = patientMap.get(patient.patient_id) ?? 0;
  if (patient.temperature >= 99.6) {
    patientResults.fever_patients.push(patient.patient_id);
  }
  if (patient.temperature > 99.6 && patient.temperature < 100.9) {
    score += 1;
  } else if (patient.temperature <= 99.5) {
    score += 0
  } else if (patient.temperature >= 101) {
    score += 2;
  }

  patientMap.set(patient.patient_id, score);
  return patientMap;
}

export function evaluateAgeRisk(patientResults: FinalResults, patient: Patient, patientMap: Map<string, number>): Map<string, number> {
  if (!patient.age || isNaN(patient.age)) {
    patientResults.data_quality_issues.push(patient.patient_id);
    return patientMap;
  }

  let score = patientMap.get(patient.patient_id) ?? 0;
  if (patient.age >= 40 && patient.age <= 65) {
    score += 1;
  } else if (patient.age < 40) {
    score += 0;
  } else if (patient.age > 65) {
    score += 2;
  }

  patientMap.set(patient.patient_id, score);
  return patientMap;
}
