# UK Care Provider Intelligence Dashboard (V1)

A sales enablement intelligence dashboard built for SDRs, BDMs, and AEs in the UK care sector. It automates pre-call research, qualification scoring, and demo handovers for care provider targets.

## Project Structure

* `index.html` : Single-page application template.
* `style.css` : Design system and card styling.
* `app.js` : Controller entry point.
* `ui.js` : DOM and view management.
* `api.js` : Routing between Demo and Live database endpoints.
* `mockData.js` : Initial sample accounts.
* `cqc.js` : CQC regulatory data formatter.
* `companiesHouse.js` : Companies House corporate registrar parser.
* `scoring.js` : BANT and MEDDICC scoring logic.
* `intelligenceGenerator.js` : Outreach copy templates.
* `qualityCheck.js` : QA checking for compliance constraints.
* `storage.js` : Browser localStorage interface.
* `export.js` : CSV/Text downloads exporter.
* `netlify.toml` : Path mapping for Netlify.
* `package.json` : Dependencies config.
* `netlify/functions/` : Directory containing CQC and Companies House proxy functions.

## Local Setup and Running

1. Open your terminal in the project directory:
   `C:/Users/IshraqAlam/.gemini/antigravity/scratch/uk-care-provider-dashboard`

2. Install backend proxy dependencies:
   ```bash
   npm install
   ```

3. Run the development server using Netlify CLI:
   ```bash
   netlify dev
   ```

4. Open your browser and navigate to:
   `http://localhost:8888`

## Operations Modes

### 1. Demo Mode
Demo Mode runs by default out of the box with zero setup. It uses the fictional profiles and mocked results in `mockData.js`. You do not need any API keys configured on your local system to run this mode.

### 2. Live API Mode
To query live registries, swap the operational setting inside the configuration card. Live mode targets local routes `/api/cqc` and `/api/companies-house`, redirecting traffic to serverless functions that hold your API credentials securely on the backend host.

### 3. Adding API Credentials
Declare these variables on your Netlify project settings page:
* `CQC_API_KEY` : Your public CQC subscription key.
* `COMPANIES_HOUSE_API_KEY` : Your Companies House token.

For local verification of Live mode, declare these variables on your local environment before running:
```bash
$env:CQC_API_KEY="your-key"
$env:COMPANIES_HOUSE_API_KEY="your-key"
netlify dev
```

## Netlify Deployment Steps

1. Install Netlify CLI locally.
2. Run `netlify login` to authenticate.
3. Run `netlify init` to link your local repository with a Netlify site.
4. Set your build parameters:
   * Build Command: None (or leave blank)
   * Publish Directory: `.`
   * Functions Directory: `netlify/functions`
5. Run deployment:
   ```bash
   netlify deploy --prod
   ```

## Known Limitations and V2 Ideas

* **CQC England Boundary**: CQC data only covers England. Wales, Scotland, and Northern Ireland coverage is marked for V2.
* **V2 Idea**: Direct links to local authority directory files for offline CQC fallbacks.
* **V2 Idea**: Automated LinkedIn officer profiles scraper integration.
