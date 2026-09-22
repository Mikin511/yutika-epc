export async function onRequestPost(context) {
  const { request, env } = context;
  const db = env.DB;
  if (!db) return json({ ok: false, error: "DB not bound" }, 500);

  let b;
  try { b = await request.json(); } catch { return json({ ok: false }, 400); }

  try {
    if (b.type === "solar") {
      await db.prepare(
        `INSERT INTO solar_calculator_submissions
         (location, yearly_consumption, yearly_bill, shadow_free_area, solar_panel_selection,
          required_plant_size, specific_yield, estimated_annual_generation, area_required,
          is_area_sufficient, max_capacity_fits, payback_period, co2_footprint, one_year_saving,
          estimated_january_output, estimated_february_output, estimated_march_output,
          estimated_april_output, estimated_may_output, estimated_june_output,
          estimated_july_output, estimated_august_output, estimated_september_output,
          estimated_october_output, estimated_november_output, estimated_december_output)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(
        b.location, b.yearly_consumption, b.yearly_bill, b.shadow_free_area, b.solar_panel_selection,
        b.required_plant_size, b.specific_yield, b.estimated_annual_generation, b.area_required,
        b.is_area_sufficient, b.max_capacity_fits, b.payback_period, b.co2_footprint, b.one_year_saving,
        b.jan, b.feb, b.mar, b.apr, b.may, b.jun, b.jul, b.aug, b.sep, b.oct, b.nov, b.dec
      ).run();

    } else if (b.type === "review") {
      await db.prepare(
        `INSERT INTO review_submissions (name, email, company, rating, review_message)
         VALUES (?,?,?,?,?)`
      ).bind(b.name, b.email, b.company, b.rating, b.review_message).run();

    } else if (b.type === "contact") {
      await db.prepare(
        `INSERT INTO contact_submissions (name, email, subject, message) VALUES (?,?,?,?)`
      ).bind(b.name, b.email, b.subject, b.message).run();

    } else {
      return json({ ok: false, error: "unknown type" }, 400);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json" }
  });
}
