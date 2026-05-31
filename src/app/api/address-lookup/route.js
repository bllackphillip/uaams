// UK Address Lookup — Ideal Postcodes integration
//
// This route is not active in the academic project build.
// postcodes.io (free, no key) is used directly from the component instead.
//
// To enable full house-level address lookup:
//   1. Sign up at https://ideal-postcodes.co.uk
//   2. Add IDEALPOSTCODES_API_KEY=ak_xxxx to .env.local
//   3. In UKAddressSearch.js, uncomment the proxy call and remove the postcodes.io block
//
// Background: getAddress.io (the original provider) was shut down on 4 February 2026
// following a High Court ruling that found it had used Ideal Postcodes' licensed
// Royal Mail PAF data without authorisation.

/*
const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  const apiKey = process.env.IDEALPOSTCODES_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Address lookup not configured — add IDEALPOSTCODES_API_KEY to .env.local" },
      { status: 503 }
    );
  }

  if (!query || query.length < 3) return Response.json({ suggestions: [] });

  try {
    if (UK_POSTCODE_RE.test(query)) {
      // Postcode lookup — returns all individual addresses at that postcode
      const clean = query.replace(/\s+/g, "").toUpperCase();
      const res = await fetch(
        `https://api.ideal-postcodes.co.uk/v1/postcodes/${encodeURIComponent(clean)}?api_key=${apiKey}`,
        { next: { revalidate: 0 } }
      );
      const data = await res.json();

      if (data.code === 4040 || data.code === 4020) return Response.json({ suggestions: [] });
      if (data.code !== 2000) return Response.json({ error: "Postcode lookup failed." }, { status: 502 });

      const postcode = data.result[0]?.postcode || query.toUpperCase();
      const suggestions = data.result.map((a) => ({
        address: [a.line_1, a.line_2, a.post_town, postcode].filter(Boolean).join(", "),
        fullAddress: {
          line1:    a.line_1 || "",
          line2:    [a.line_2, a.line_3].filter(Boolean).join(", "),
          city:     a.post_town || "",
          postcode: a.postcode || postcode,
        },
      }));
      return Response.json({ suggestions });
    }

    // Text/address autocomplete — requires Ideal Postcodes paid plan
    const res = await fetch(
      `https://api.ideal-postcodes.co.uk/v1/autocomplete/addresses?q=${encodeURIComponent(query)}&api_key=${apiKey}&limit=10`,
      { next: { revalidate: 0 } }
    );
    const data = await res.json();

    if (data.code === 4010) {
      return Response.json({
        suggestions: [],
        notice: "Address text search requires a paid Ideal Postcodes plan. Try searching by postcode instead.",
      });
    }
    if (data.code !== 2000) return Response.json({ suggestions: [] });

    const suggestions = (data.result?.hits || []).map((h) => ({
      address: h.suggestion,
      id: h.udprn?.toString() || null,
      fullAddress: null,
    }));
    return Response.json({ suggestions });

  } catch (err) {
    console.error("Address lookup error:", err);
    return Response.json({ error: "Address lookup failed." }, { status: 500 });
  }
}
*/
