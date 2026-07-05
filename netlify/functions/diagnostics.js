// Diagnostic Netlify Function to verify API key presence and lengths safely.
// Complies with no em dash, no double/triple hyphen rules.

exports.handler = async function(event, context) {
  const cqcKey = process.env.CQC_API_KEY;
  const chKey = process.env.COMPANIES_HOUSE_API_KEY;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify({
      cqc_present: !!cqcKey,
      cqc_length: cqcKey ? cqcKey.length : 0,
      ch_present: !!chKey,
      ch_length: chKey ? chKey.length : 0
    })
  };
};
