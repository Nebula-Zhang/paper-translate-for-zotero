# API provider implementation plan — 1.5.0

User-authorized scope: implement the approved provider/API design, produce a local installable XPI, and do not push, open a PR, tag or publish.

## Source references

- Existing adapted llm-for-zotero revision: d9724df84ac053343cf32b00c7829620a243e5b9.
- Additional reviewed revision: 7e26a134fe0808070d63df49a25ca9ba3bf031c9.
- Reviewed paths: src/utils/modelProviders.ts, providerProtocol.ts, providerTransport.ts, apiHelpers.ts, llmClient.ts, and src/modules/preferenceScript.ts.
- Official contracts: OpenAI Responses / Chat Completions; Claude Messages / OpenAI compatibility; DeepSeek Chat Completions / Responses / Anthropic compatibility.

## Implemented design

1. Preserve two auth modes. Keep Codex credentials restricted to the original official endpoint. Store API Key mode as openai_compatible for compatibility.
2. Add schema 3 API settings: protocol, presetId, timeoutSeconds, anthropicVersion, workspaceId and maxTokens. Legacy configurations remain Chat Completions and custom; retain credentials, endpoint, model IDs and active selection.
3. Offer seven URL presets and custom editing. Explicit preset selection sets the protocol and address. Cross-host preset changes clear old credentials. Preview the final endpoint without query values.
4. Resolve endpoints with URL pathname operations, preserve query and proxy prefixes, reject mismatched full endpoints, URL credentials and automatic redirects.
5. Send independent Chat Completions, public Responses and Anthropic Messages payloads and headers. Convert local MinerU image crops into each protocol's image format. Do not add model-name inference, fallback or runtime sharing.
6. Parse SSE frames across Unicode and CRLF chunk boundaries. Enforce protocol-specific successful termination; fail on truncation, filters, refusal, malformed response, byte/character limits or disconnection. Stop reading at terminal completion, including Codex.
7. Add a bounded, abortable request lifetime and ordinary translation output/response limits. Configuration changes cancel old work; cache identity includes protocol and workspace.
8. Expose separate user-triggered text and synthetic-image tests. They use the real selected transport and real OCR JSON validation. Saving never calls a model. No paper is used for connection tests.
9. Retain MinerU provenance, context generation, finite knowledge jobs and independent plugin state. API-key web research is explicitly unimplemented; no silent Codex fallback.

## Validation and delivery

- Automated request/response, migration, timeout/cancellation, key-redaction, cache-identity and live DOM-event tests.
- Existing regression suite, TypeScript, ESLint, Prettier and production XPI build.
- Isolated Zotero runtime smoke test where available; do not change the user's active Zotero profile or API settings.
- Verify XPI ZIP integrity, manifest ID/version/compatibility, bundled code and license notices.
- Deliver the XPI, checksum, concise Chinese change notes and a PR-description draft locally. Commit completed source changes on dev only; do not push or create a PR.

## Completed validation

- 254 automated tests passed; TypeScript, ESLint, Prettier and production build passed.
- Settings interaction tests and browser-rendered visual inspection passed.
- XPI ZIP integrity, ID/version/compatibility, resources, locale strings, no development fixtures, updater and notices verified.
- An attempted isolated Zotero launch was rejected by automatic approval (blocked by policy, no more specific reason). Native Zotero loading and real provider calls remain unverified; no live credentials were used and the active user profile was not changed.

## 1.5.1 — user-requested settings simplification

- Remove the advanced disclosure and all its input controls; keep request timeout directly visible for both authentication modes.
- Remove the Anthropic workspace field from the UI. Keep stored protocol parameters compatible; required Anthropic version/output fields still use internal defaults for new configurations.
- Relabel the Anthropic Chat Completions compatibility preset without changing its ID, protocol or destination.
- Confirm the simplified UI for OpenAI, Anthropic, DeepSeek and Codex using the existing DOM interaction test; rebuild and deliver a patch XPI without pushing or opening a PR.

## 1.5.2 — provider UI parity

- Reference: llm-for-zotero 7e26a134fe0808070d63df49a25ca9ba3bf031c9, src/modules/preferenceScript.ts provider-row section; copied provider SVG assets under addon/content/icons/providers/ (openai.svg, anthropic.svg, deepseek.svg). Provenance is retained in NOTICE.
- Replace stacked always-visible forms with initially collapsed, accessible provider cards. Preserve expanded cards during rerender and automatically open new providers.
- Match the reference's summary, brand icon, auth tag, chevron, two-column connection form, model rows, footer actions and full-width dashed add button.
- Organize existing AI-provider and translation settings into two keyboard-navigable tabs; do not introduce Agent or MinerU tabs.
- Keep API protocols, request timeouts, explicit save, current-model selection, text/image tests and deletion safeguards unchanged. No advanced settings disclosure or workspace input is reintroduced.
- Verify interactions in the actual preferences markup, browser-render collapsed/expanded/narrow views, run regression and static checks, and deliver a local patch XPI without pushing or creating a PR.

## 1.5.4 — native settings layout fixes

- Inspect the installed Zotero preferences stylesheet read-only: its global HTML button rule imposes max-height:25px and negative margins, clipping the multi-line provider heading and shifting tab labels. Reset these rules within the plugin pane, with explicit heading line heights and centered tabs.
- Keep the model input followed by two consistently sized actions: Test reveals separate text/image test buttons; More retains current-model, removal and Codex effort controls. Opening or dismissing choices never calls a model. Escape restores focus, and a running test disables its trigger.
- Rename the URL/protocol bundle to Endpoint preset, with Custom endpoint as the explicit manual option. Protocol selection remains visible only for custom endpoints; transport behavior and saved preset IDs remain unchanged.
- Recheck DOM interactions, native-style reproduction in browser previews, regressions, static checks and the production XPI. Deliver a local patch and commit on dev without pushing or opening a PR.

## 1.5.5 — model discovery and selection

- API-key providers get an explicit Fetch models action. Derive the catalog path from the current endpoint, retaining gateway prefixes and query parameters. For the exact official presets, Anthropic's chat compatibility route uses the native Models catalog authentication, and DeepSeek's Anthropic route uses its root bearer-authenticated Models catalog. Never move custom credentials to a different origin or use Codex credentials for catalog requests.
- Use bounded GET requests with redirect rejection, key-redacted errors, a 30-second/user-timeout deadline, a 2 MiB cumulative response limit, 5,000 distinct model limit and ten-page limit. Read Anthropic has_more/last_id pagination; fail explicitly on invalid or incomplete listings without synthetic defaults or silent retries.
- Show a modal, keyboard-accessible search/multi-select picker with already-added models disabled. Keep provider model IDs, current selection and persistence unchanged until explicit add/save actions. Preserve manual entry and Codex manual configuration. Editing the endpoint/key, rerendering or unloading cancels requests and closes stale pickers.
- Validate routes/authentication, pagination, deduplication, malformed responses, HTTP failures, redaction, size/time limits and cancellation. Exercise actual DOM add/cancel/search/focus/save actions and inspect browser previews before building a local patch and committing on dev.
- Official API references reviewed 2026-10-29: https://developers.openai.com/api/reference/resources/models/methods/list ; https://platform.claude.com/docs/en/api/models/list ; https://api-docs.deepseek.com/api/list-models/ . No upstream source was copied for this feature.
