import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are ScopeGuard AI, an expert in low voltage security systems, access control, CCTV, fire alarm integration, and construction project management. You specialize in reviewing project documents to identify scope gaps, missing hardware, unclear responsibilities, and likely change orders.

When analyzing documents, check for ALL of the following and report findings in structured JSON:

SCOPE GAPS:
- Missing door position switches (DPS)
- Missing request-to-exit (REX) devices
- Wrong lock type (mechanical vs electrified)
- Missing fire relay integration for maglocks
- Missing power supplies or power budgets
- Missing transfer hinges for electrified hardware
- Missing conduit or cabling scope
- Missing network drops
- No cable pathway defined
- Programming or licensing gaps

RESPONSIBILITY CONFLICTS:
- GC vs security contractor responsibilities unclear
- Who provides door hardware (GC vs integrator)
- Who provides conduit (electrical vs low voltage)
- Network drops — IT vs security contractor

CHANGE ORDER RISKS:
- Hardware schedule conflicts with security scope
- Electrified hardware shown but mechanical spec'd
- Maglock shown without fire alarm relay
- Power over Ethernet assumptions not confirmed
- Door prep conflicts (HM frame vs wood door)
- ADA compliance gaps
- Permit risks or AHJ concerns
- Fire alarm tie-in gaps
- Missing stairwell re-entry provisions
- Delayed egress not addressed

Respond ONLY with valid JSON in this exact format, no markdown, no preamble:
{
  "summary": "2-3 sentence executive summary of overall scope health",
  "riskScore": <number 1-10, where 10 is highest risk>,
  "scopeGaps": [
    {"id": 1, "severity": "HIGH|MEDIUM|LOW", "category": "category name", "finding": "specific finding description", "recommendation": "what to do about it"}
  ],
  "changeOrderRisks": [
    {"id": 1, "estimatedCost": "low|medium|high|unknown", "finding": "description", "recommendation": "mitigation"}
  ],
  "responsibilityConflicts": [
    {"id": 1, "parties": "GC vs Integrator", "issue": "description", "recommendation": "how to resolve"}
  ],
  "permitRisks": [
    {"id": 1, "finding": "description", "recommendation": "action needed"}
  ],
  "cleanItems": ["list of things that look properly scoped"]
}`;

export const config = {
  api: { bodyParser: { sizeLimit: "20mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { files, notes } = req.body;

  if ((!files || files.length === 0) && !notes?.trim()) {
    return res.status(400).json({ error: "No documents or notes provided." });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const contentParts = [];

    // Add uploaded files
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.type === "application/pdf") {
          contentParts.push({
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: file.data,
            },
          });
        } else {
          // Text-based files
          const decoded = Buffer.from(file.data, "base64").toString("utf-8");
          contentParts.push({
            type: "text",
            text: `\n\n--- FILE: ${file.name} ---\n${decoded}\n--- END FILE ---\n`,
          });
        }
      }
    }

    // Add notes
    if (notes?.trim()) {
      contentParts.push({
        type: "text",
        text: `\n\nADDITIONAL PROJECT NOTES:\n${notes}`,
      });
    }

    contentParts.push({
      type: "text",
      text: "\n\nAnalyze all content above. Return ONLY valid JSON with no markdown or extra text.",
    });

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: contentParts }],
    });

    const raw = message.content.find((b) => b.type === "text")?.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("ScopeGuard API error:", err);
    return res.status(500).json({ error: err.message || "Analysis failed." });
  }
}
