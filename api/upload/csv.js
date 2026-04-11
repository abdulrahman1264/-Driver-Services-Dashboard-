import { getDb } from '../_db.js';
import { requireAdmin } from '../_auth.js';
import { parse } from 'csv-parse/sync';

function parseDate(s) {
  if (!s || !s.trim()) return null;
  const mo = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  const p = s.trim().split('-');
  if (p.length === 3) {
    let d = parseInt(p[0]), m = mo[p[1]?.toLowerCase()], y = parseInt(p[2]);
    if (!isNaN(d) && m !== undefined && !isNaN(y)) {
      if (y < 100) y += y > 30 ? 1900 : 2000;
      return new Date(y, m, d).toISOString().split('T')[0];
    }
  }
  const t = Date.parse(s);
  return isNaN(t) ? null : new Date(t).toISOString().split('T')[0];
}

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { type, csvData } = req.body; // type: 'payroll' | 'recruitment'
  if (!csvData) return res.status(400).json({ error: 'No CSV data' });

  const sql = getDb();

  try {
    const records = parse(csvData, { columns: true, skip_empty_lines: true, trim: true });

    if (type === 'payroll') {
      let inserted = 0, skipped = 0;
      for (const r of records) {
        const rtaId = r['RTA ID']?.trim();
        if (!rtaId) { skipped++; continue; }

        // Upsert by RTA ID
        await sql`
          INSERT INTO drivers (
            rta_id, full_name, arabic_name, depot, nationality, license_number,
            license_issued, license_expired, place_of_issue, traffic_file, license_class,
            contractor, date_of_birth, date_of_hire, contact, passport_number,
            passport_expired, emirates_id, visa_number, visa_issued, visa_expired,
            id_card_expired, id_card_status, assignment_status, real_time_status,
            date_of_resignation, reason_for_leaving, medical_expired, accommodation,
            vendor_number
          ) VALUES (
            ${rtaId},
            ${r['Full Name']||null}, ${r['??? ??????']||null},
            ${r['Depot']||null}, ${r['Nationality']||null},
            ${r['License Number']||null},
            ${parseDate(r['Date of issued'])}, ${parseDate(r['Date of  Expired'])},
            ${r['Place of issue']||null}, ${r['Traffic File']||null},
            ${r['class of license']||null}, ${r['Contractor']||null},
            ${parseDate(r['Date Of Birth'])}, ${parseDate(r['Date of Hire'])},
            ${r['Contact ']||r['Contact']||null}, ${r['Passport #']||null},
            ${parseDate(r['Passport Expired'])}, ${r['Emirates ID ']||r['Emirates ID']||null},
            ${r['visa #']||null}, ${parseDate(r['Issue Date'])},
            ${parseDate(r['Visa Expired'])}, ${parseDate(r['RTA ID Card Expired'])},
            ${r['ID Card Status']||null}, ${r['Assignment Status']||null},
            ${r['Real time Status']||'Active'},
            ${parseDate(r['Date of Resignation'])}, ${r['Reason for Leaving']||null},
            ${parseDate(r['Occupational Medical Expired'])},
            ${r['Accomodation']||null}, ${r['Vendor Number']||null}
          )
          ON CONFLICT (rta_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            depot = EXCLUDED.depot,
            real_time_status = EXCLUDED.real_time_status,
            license_expired = EXCLUDED.license_expired,
            passport_expired = EXCLUDED.passport_expired,
            visa_expired = EXCLUDED.visa_expired,
            medical_expired = EXCLUDED.medical_expired,
            id_card_status = EXCLUDED.id_card_status,
            updated_at = NOW()
        `;
        inserted++;
      }
      return res.json({ ok: true, inserted, skipped, total: records.length });
    }

    if (type === 'recruitment') {
      // Clear existing and re-import
      await sql`DELETE FROM recruitment`;
      let inserted = 0;
      for (const r of records) {
        await sql`
          INSERT INTO recruitment (
            rta_id, license_number, full_name, nationality, dob,
            license_issued, license_expired, place_of_issue, license_class,
            traffic_file, contact, age, company, road_test_date, road_test_result,
            interview_date, interview_result, remarks, status, training_batch,
            training_start, training_end, transfer_date
          ) VALUES (
            ${r['RTA ID']||null}, ${r['License No.']||null},
            ${r['Name as per Driving License']||null}, ${r['Nationality']||null},
            ${parseDate(r['DOB'])}, ${parseDate(r['Date of issued'])},
            ${parseDate(r['Date of expired'])}, ${r['Place of issue']||null},
            ${r['Class of License']||null}, ${r['Traffic file no']||null},
            ${r['Contact']||null},
            ${isNaN(parseFloat(r['Age'])) ? null : parseFloat(r['Age'])},
            ${r['Company']||null}, ${parseDate(r['Date of Road test'])},
            ${r['Road test result ']?.trim()||null},
            ${parseDate(r['Date of Interview'])}, ${r['Interview Result']?.trim()||null},
            ${r['Remarks ']?.trim()||null}, ${r['Status 1']?.trim()||null},
            ${r['Training Batch #']||null}, ${parseDate(r['Date of join Training'])},
            ${parseDate(r['Date of Graduation'])}, ${parseDate(r['Date of Transfer operation'])}
          )
        `;
        inserted++;
      }
      return res.json({ ok: true, inserted, total: records.length });
    }

    return res.status(400).json({ error: 'Unknown type. Use payroll or recruitment' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

export default requireAdmin(handler);