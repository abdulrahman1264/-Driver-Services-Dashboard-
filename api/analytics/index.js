import { getDb } from '../_db.js';
import { requireAuth } from '../_auth.js';

async function handler(req, res) {
  const sql = getDb();

  const [
    statusCount, depotCount, natCount, contCount,
    idCardCount, hireByYear, docExpiry, recStatus, recCompany, recRoad
  ] = await Promise.all([
    sql`SELECT real_time_status, COUNT(*) FROM drivers WHERE is_deleted=FALSE GROUP BY real_time_status`,
    sql`SELECT depot, COUNT(*) FROM drivers WHERE is_deleted=FALSE GROUP BY depot ORDER BY count DESC`,
    sql`SELECT nationality, COUNT(*) FROM drivers WHERE is_deleted=FALSE GROUP BY nationality ORDER BY count DESC LIMIT 10`,
    sql`SELECT contractor, COUNT(*) FROM drivers WHERE is_deleted=FALSE GROUP BY contractor ORDER BY count DESC`,
    sql`SELECT id_card_status, COUNT(*) FROM drivers WHERE is_deleted=FALSE GROUP BY id_card_status`,
    sql`SELECT EXTRACT(YEAR FROM date_of_hire)::int AS yr, COUNT(*) FROM drivers WHERE is_deleted=FALSE AND date_of_hire IS NOT NULL GROUP BY yr ORDER BY yr`,
    sql`SELECT
      COUNT(*) FILTER (WHERE license_expired < NOW()) AS lic_expired,
      COUNT(*) FILTER (WHERE license_expired BETWEEN NOW() AND NOW()+INTERVAL'30 days') AS lic_30,
      COUNT(*) FILTER (WHERE passport_expired < NOW()) AS pass_expired,
      COUNT(*) FILTER (WHERE passport_expired BETWEEN NOW() AND NOW()+INTERVAL'30 days') AS pass_30,
      COUNT(*) FILTER (WHERE visa_expired < NOW()) AS visa_expired,
      COUNT(*) FILTER (WHERE visa_expired BETWEEN NOW() AND NOW()+INTERVAL'30 days') AS visa_30,
      COUNT(*) FILTER (WHERE medical_expired < NOW()) AS med_expired,
      COUNT(*) FILTER (WHERE medical_expired BETWEEN NOW() AND NOW()+INTERVAL'30 days') AS med_30,
      COUNT(*) AS total
      FROM drivers WHERE is_deleted=FALSE`,
    sql`SELECT status, COUNT(*) FROM recruitment WHERE is_deleted=FALSE GROUP BY status ORDER BY count DESC`,
    sql`SELECT company, COUNT(*) FROM recruitment WHERE is_deleted=FALSE GROUP BY company ORDER BY count DESC LIMIT 8`,
    sql`SELECT LOWER(road_test_result) AS result, COUNT(*) FROM recruitment WHERE is_deleted=FALSE AND road_test_result IS NOT NULL GROUP BY LOWER(road_test_result)`
  ]);

  res.json({
    drivers: {
      status: Object.fromEntries(statusCount.map(r=>[r.real_time_status, parseInt(r.count)])),
      depot:  Object.fromEntries(depotCount.map(r=>[r.depot, parseInt(r.count)])),
      nationality: Object.fromEntries(natCount.map(r=>[r.nationality, parseInt(r.count)])),
      contractor:  Object.fromEntries(contCount.map(r=>[r.contractor, parseInt(r.count)])),
      idCard: Object.fromEntries(idCardCount.map(r=>[r.id_card_status, parseInt(r.count)])),
      hireByYear: Object.fromEntries(hireByYear.map(r=>[r.yr, parseInt(r.count)])),
    },
    documents: docExpiry[0],
    recruitment: {
      status:  Object.fromEntries(recStatus.map(r=>[r.status, parseInt(r.count)])),
      company: Object.fromEntries(recCompany.map(r=>[r.company, parseInt(r.count)])),
      roadTest: Object.fromEntries(recRoad.map(r=>[r.result, parseInt(r.count)])),
    }
  });
}

export default requireAuth(handler);