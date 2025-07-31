import { evaluateAgeRisk, evaluateBloodPressureRisk, evaluateTemperatureRisk } from "./evaluationFunctions.ts";
import type { FinalResults, Patient } from "./Patient.ts";

const patientResults: FinalResults = {
  high_risk_patients: [],
  fever_patients: [],
  data_quality_issues: []
};
let totalRecords = 0;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPatientList(page: number, limit: number): Promise<{ data: Patient[]; pagination?: { hasNext: boolean }; total_records: number }> {
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
    return { data: [], pagination: { hasNext: false }, total_records: 0 };
  }
}

async function submitResults(): Promise<void> {
  const baseUrl = 'https://assessment.ksensetech.com';
  const url = `${baseUrl}/api/submit-assessment`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': 'ak_e3bb2519827cfc68dfaeee99a6041b0f3b0d136ad6a6a746',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patientResults)
    });
    const jsonResp = await response.json();
    console.log('response: ', jsonResp);
  } catch (error) {
    console.error('Error submitting results:', error);
  }
}

async function main(): Promise<void> {
  const patientList: Patient[] = [];
  let hasNext = true;
  let page = 1;
  while (hasNext) {
    const result = await fetchPatientList(page, 10);
    hasNext = result.pagination?.hasNext ?? false;
    if (result.data) {
      patientList.push(...result.data);
    }
    if (!hasNext) {
      totalRecords = result.total_records;
    }
    console.log(`Fetched page ${page} of patients.`);
    await delay(2000); // Adding delay to avoid hitting API rate limits
    page++;
  }

  if (patientList.length === 0) {
    console.log('No patients found.');
    return;
  }

  const patientMap: Map<string, number> = new Map();
  for (const patient of patientList) {
    patientMap.set(patient.patient_id, 0);
    const mapWithAge = evaluateAgeRisk(patientResults, patient, patientMap);
    const mapWithTemp = evaluateTemperatureRisk(patientResults, patient, mapWithAge);
    const mapWithBloodPressure = evaluateBloodPressureRisk(patientResults, patient, mapWithTemp);
    const score = mapWithBloodPressure.get(patient.patient_id) ?? 0;
    if (score >= 4) {
      patientResults.high_risk_patients.push(patient.patient_id);
    }
  }

  console.log(`Fetched ${patientList.length} patients.`);
  if (totalRecords !== patientList.length) {
    console.warn(`Total records mismatch: expected ${totalRecords}, fetched ${patientList.length}.`);
  }
}

(async () => {
  await main();
  await submitResults();
})();
