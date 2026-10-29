import assert from "node:assert/strict";
import test from "node:test";
import { setImmediate } from "node:timers/promises";
import { JSDOM } from "jsdom";
import { registerPrefsScripts } from "../src/modules/preferenceWindow";
import {
  getModelProviderConfiguration,
  setActiveModelId,
  setModelProviderConfiguration,
} from "../src/models/providers";
import { createModelSelectionActions } from "../src/models/selection";

test("settings preset selection, custom editing, save, text test and image test work through the real UI handlers", async () => {
  const dom = new JSDOM(
    '<input id="papertranslateforzotero-sourceLanguage"><button id="papertranslateforzotero-add-provider">Add</button><div id="papertranslateforzotero-model-providers"></div>',
  );
  const prefs = new Map<string, unknown>();
  let cancellations = 0;
  let requests = 0;
  (globalThis as any).Zotero = {
    Prefs: {
      get: (key: string) => prefs.get(key),
      set: (key: string, value: unknown) => prefs.set(key, value),
    },
  };
  (globalThis as any).addon = {
    data: {
      prefs: {},
      locale: {
        current: {
          formatMessagesSync: (items: any[]) =>
            items.map((entry) => ({
              value: entry.id.replace("papertranslateforzotero-", ""),
            })),
        },
      },
    },
  };
  (globalThis as any).ztoolkit = {
    getGlobal: () => async (_url: string, init: RequestInit) => {
      requests += 1;
      const payload = JSON.parse(String(init.body));
      const text = payload.input[0].content.some(
        (part: any) => part.type === "input_image",
      )
        ? '{"text":"TEST 42"}'
        : "OK";
      return new Response(
        `data: ${JSON.stringify({ type: "response.output_text.delta", delta: text })}\n\ndata: {"type":"response.completed","response":{"status":"completed"}}\n\n`,
      );
    },
  };
  setModelProviderConfiguration(
    [
      {
        id: "p",
        name: "Example",
        authMode: "openai_compatible",
        apiBase: "https://api.openai.com/v1",
        apiKey: "fake-key",
        models: [{ id: "m", model: "example-model", effort: "" }],
      },
    ],
    "m",
  );
  const actions = createModelSelectionActions({
    getConfiguration: getModelProviderConfiguration,
    setActiveModelId,
    setConfiguration: setModelProviderConfiguration,
    cancelModelTasks() {
      cancellations += 1;
    },
  });
  const doc = dom.window.document;
  const control = (label: string) => {
    const result = doc.querySelector(`[aria-label="${label}"]`) as
      | HTMLInputElement
      | HTMLSelectElement;
    assert.ok(result, label);
    return result;
  };
  const change = (label: string, value: string) => {
    const node = control(label);
    node.value = value;
    node.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  };
  const input = (label: string, value: string) => {
    const node = control(label);
    node.value = value;
    node.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  };
  const button = (text: string) => {
    const node = Array.from(doc.querySelectorAll("button")).find(
      (item) => item.textContent === text,
    );
    assert.ok(node, text);
    return node;
  };
  try {
    registerPrefsScripts(dom.window as unknown as Window, actions);
    const assertSimpleSettings = () => {
      assert.equal(
        doc.querySelector("details"),
        null,
        "No advanced settings disclosure",
      );
      for (const label of [
        "pref-provider-workspace",
        "pref-provider-version",
        "pref-provider-max-tokens",
      ]) {
        assert.equal(doc.querySelector(`[aria-label="${label}"]`), null);
      }
      assert.equal(control("pref-provider-timeout").closest("details"), null);
      assert.equal(
        control("pref-provider-timeout").closest("section"),
        doc.querySelector("section"),
      );
    };
    assertSimpleSettings();
    assert.equal(
      (control("pref-provider-preset") as HTMLSelectElement).options.length,
      8,
    );
    change("pref-provider-preset", "openai-responses");
    assert.equal(
      control("pref-provider-api-base").value,
      "https://api.openai.com/v1/responses",
    );
    assert.equal(control("pref-provider-protocol").value, "responses");
    assert.equal(control("pref-provider-protocol").disabled, true);
    assert.equal(control("pref-provider-api-key").value, "fake-key");
    change("pref-provider-preset", "deepseek-chat");
    assert.equal(control("pref-provider-api-key").value, "");
    assert.equal(
      control("pref-provider-api-base").value,
      "https://api.deepseek.com/chat/completions",
    );
    change("pref-provider-preset", "custom");
    assert.equal(
      (control("pref-provider-api-base") as HTMLInputElement).readOnly,
      false,
    );
    change("pref-provider-protocol", "responses");
    assert.match(
      doc.querySelector('[aria-live="polite"]')!.textContent!,
      /不匹配/u,
    );
    input("pref-provider-api-base", "https://example.test/v1?api-version=2026");
    assert.match(
      doc.querySelector('[aria-live="polite"]')!.textContent!,
      /\/v1\/responses\?…/u,
    );
    input("pref-provider-api-key", "new-fake-key");
    input("pref-provider-timeout", "90");
    button("pref-provider-save").click();
    const saved = getModelProviderConfiguration();
    assert.equal(saved.providers[0].protocol, "responses");
    assert.equal(saved.providers[0].timeoutSeconds, 90);
    assert.equal(saved.providers[0].apiKey, "new-fake-key");
    assert.equal(saved.activeModelId, "m");
    assert.equal(cancellations, 1);
    assert.equal(requests, 0, "saving does not run a paid connection test");
    button("pref-codex-test").click();
    await setImmediate();
    assert.match(
      doc.querySelector(".papertranslateforzotero-provider-status")!
        .textContent!,
      /success: OK/u,
    );
    button("pref-provider-image-test").click();
    await setImmediate();
    assert.match(
      doc.querySelector(".papertranslateforzotero-provider-status")!
        .textContent!,
      /success: TEST 42/u,
    );
    assert.equal(requests, 2);
    for (const preset of [
      "anthropic-messages",
      "anthropic-chat",
      "deepseek-chat",
    ]) {
      change("pref-provider-preset", preset);
      assertSimpleSettings();
    }
    const anthropicOption = doc.querySelector('option[value="anthropic-chat"]');
    assert.equal(
      anthropicOption?.textContent,
      "Anthropic · Chat Completions（兼容）",
    );
    change("pref-auth-mode", "codex_auth");
    assertSimpleSettings();
  } finally {
    dom.window.dispatchEvent(new dom.window.Event("unload"));
    dom.window.close();
  }
});
