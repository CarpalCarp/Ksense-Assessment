interface Patient {
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

interface FinalResults {
  high_risk_patients: string[]
  fever_patients: string[]
  data_quality_issues: string[]
}

const patientMap: Map<string, number> = new Map();
const patientResults: FinalResults = {
  high_risk_patients: [],
  fever_patients: [],
  data_quality_issues: []
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function evaluateBloodPressureRisk(patient: Patient) {
  if (!patient.blood_pressure) {
    patientResults.data_quality_issues.push(patient.patient_id);
    return;
  }
  const [systolic, dialostic] = patient.blood_pressure.split('/').map((value) => parseInt(value));
  if (systolic === undefined || dialostic === undefined || isNaN(systolic) || isNaN(dialostic)) {
    patientResults.data_quality_issues.push(patient.patient_id);
    return;
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
}

function evaluateTemperatureRisk(patient: Patient) {
  if (!patient.temperature || isNaN(patient.temperature)) {
    patientResults.data_quality_issues.push(patient.patient_id);
    return;
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
}

function evaluateAgeRisk(patient: Patient) {
  if (!patient.age || isNaN(patient.age)) {
    patientResults.data_quality_issues.push(patient.patient_id);
    return;
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
}

async function fetchPatientList(page: number, limit: number) {
  const baseUrl = 'https://assessment.ksensetech.com';
  const url = `${baseUrl}/api/patients?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': 'ak_e3bb2519827cfc68dfaeee99a6041b0f3b0d136ad6a6a746'
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching patient list:', error);
    return [];
  }
}

async function main() {
  const patientList: Patient[] = [];
  let hasNext = true;
  let page = 1;
  while (hasNext) {
    const result = await fetchPatientList(page, 10);
    hasNext = result.pagination.hasNext ?? false;
    patientList.push(...result.data);
    console.log(`Fetched page ${page} of patients.`);
    await delay(2000); // Adding delay to avoid hitting API rate limits
    page++;
  }

  if (patientList.length === 0) {
    console.log('No patients found.');
    return;
  }

  for (const patient of patientList) {
    patientMap.set(patient.patient_id, 0);
    evaluateAgeRisk(patient);
    evaluateTemperatureRisk(patient);
    evaluateBloodPressureRisk(patient);
    const score = patientMap.get(patient.patient_id) ?? 0;
    if (score >= 4) {
      patientResults.high_risk_patients.push(patient.patient_id);
    }
  }

  console.log('patientResults: ', patientResults);
}

main();
