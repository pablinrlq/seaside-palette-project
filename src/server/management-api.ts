import { initialState, applyCommand, type ManagementState } from "../lib/management";
import { products, defaultCategories } from "../lib/catalog";

type Settings = { url: string; key: string; password: string; secret: string; local: boolean };
type Environment = Record<string, unknown>;
let localSettings: Promise<Settings> | undefined;
let writeQueue: Promise<unknown> = Promise.resolve();
const attempts = new Map<string, { count: number; until: number }>();
const encoder = new TextEncoder();
const localDirectory = () =>
  (typeof process !== "undefined" ? process.env["ADMIN_LOCAL_DATA_DIR"] : "") || ".data";
const hex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
const equal = (a: string, b: string) => {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
};
async function settings(environment: unknown): Promise<Settings> {
  const env = (environment ?? {}) as Environment;
  const get = (name: string) =>
    String(env[name] ?? (typeof process !== "undefined" ? (process.env[name] ?? "") : ""));
  const url = get("SUPABASE_URL"),
    key = get("SUPABASE_SERVICE_ROLE_KEY");
  const password = get("ADMIN_PASSWORD"),
    secret = get("ADMIN_SESSION_SECRET");
  if (url && key && password.length >= 14 && secret.length >= 32) {
    if (!url.startsWith("https://")) throw new Error("CONFIG");
    return { url, key, password, secret, local: false };
  }
  if (import.meta.env.DEV && !url && !key) {
    localSettings ??= (async () => {
      const fs = await import("node:fs/promises");
      await fs.mkdir(localDirectory(), { recursive: true, mode: 0o700 });
      const path = localDirectory() + "/admin-credentials.json";
      let value: { password: string; secret: string };
      try {
        value = JSON.parse(await fs.readFile(path, "utf8"));
      } catch (error) {
        if ((error as { code?: string }).code !== "ENOENT") throw error;
        value = {
          password: hex(crypto.getRandomValues(new Uint8Array(12)).buffer),
          secret: hex(crypto.getRandomValues(new Uint8Array(32)).buffer),
        };
        await fs.writeFile(path, JSON.stringify(value, null, 2), { mode: 0o600, flag: "wx" });
      }
      return { url: "", key: "", ...value, local: true };
    })();
    return localSettings;
  }
  throw new Error("CONFIG");
}
async function rpc(config: Settings, name: string, body: unknown) {
  const response = await fetch(config.url + "/rest/v1/rpc/" + name, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: "Bearer " + config.key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  }).catch(() => {
    throw new Error("DATABASE");
  });
  if (!response.ok) throw new Error("DATABASE");
  return response.json();
}
async function read(config: Settings): Promise<ManagementState> {
  if (config.local) {
    const fs = await import("node:fs/promises");
    try {
      return JSON.parse(await fs.readFile(localDirectory() + "/store.json", "utf8"));
    } catch (error) {
      if ((error as { code?: string }).code !== "ENOENT") throw error;
      return initialState(products, defaultCategories);
    }
  }
  return await rpc(config, "store_read", { seed: initialState(products, defaultCategories) });
}
async function commit(config: Settings, command: unknown, operationId: string, revision: number) {
  const run = async () => {
    const previous = await read(config);
    if (previous.processed.includes(operationId)) return previous;
    if (previous.revision !== revision) throw new Error("CONFLICT");
    const next = applyCommand(previous, command, operationId);
    if (config.local) {
      const fs = await import("node:fs/promises");
      await fs.writeFile(localDirectory() + "/store.json.tmp", JSON.stringify(next), {
        mode: 0o600,
      });
      await fs.rename(localDirectory() + "/store.json.tmp", localDirectory() + "/store.json");
    } else {
      const ok = await rpc(config, "store_commit", {
        expected_revision: previous.revision,
        next_state: next,
      });
      if (!ok) throw new Error("CONFLICT");
    }
    return next;
  };
  const result = writeQueue.then(run, run);
  writeQueue = result.catch(() => undefined);
  return result;
}
async function signature(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}
async function authenticated(request: Request, config: Settings) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("agua_admin="))
    ?.slice(11);
  if (!cookie) return false;
  const [expiry, nonce, signed] = cookie.split(".");
  if (!expiry || !nonce || !signed || Number(expiry) < Date.now()) return false;
  return equal(signed, await signature(config.secret + config.password, expiry + "." + nonce));
}
function response(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}
async function body(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("Formato inválido.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Corpo vazio.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 1_000_000) {
      await reader.cancel();
      throw new Error("Arquivo muito grande.");
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(buffer));
}
export async function managementApi(request: Request, environment: unknown) {
  const url = new URL(request.url);
  try {
    if (!["GET", "POST"].includes(request.method))
      return response({ error: "Método inválido." }, 405);
    if (request.method === "POST" && request.headers.get("origin") !== url.origin)
      return response({ error: "Origem não autorizada." }, 403);
    let config: Settings;
    try {
      config = await settings(environment);
    } catch {
      if (url.pathname === "/api/catalog")
        return response({ products, categories: defaultCategories });
      return response(
        {
          error: "Configure o banco de dados e os segredos administrativos no servidor.",
          configured: false,
        },
        503,
      );
    }
    if (url.pathname === "/api/catalog" && request.method === "GET") {
      const state = await read(config);
      return response({ products: state.products, categories: state.categories });
    }
    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      // Best-effort per-instance throttling; production also needs an edge rate-limit rule.
      const address = request.headers.get("cf-connecting-ip") || "shared";
      const now = Date.now();
      if (attempts.size > 5000)
        for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
      const limit = attempts.get(address);
      if (limit && limit.until > now && limit.count >= 5)
        return response({ error: "Muitas tentativas. Aguarde 15 minutos." }, 429);
      const data = await body(request);
      if (!data || typeof data.password !== "string" || data.password.length > 1024)
        return response({ error: "Senha inválida." }, 400);
      const provided = await signature(config.secret, data.password);
      const expected = await signature(config.secret, config.password);
      if (!equal(provided, expected)) {
        attempts.set(address, {
          count: limit && limit.until > now ? limit.count + 1 : 1,
          until: limit && limit.until > now ? limit.until : now + 900000,
        });
        return response({ error: "Senha incorreta." }, 401);
      }
      attempts.delete(address);
      const token = String(now + 8 * 60 * 60 * 1000) + "." + crypto.randomUUID();
      const cookie = token + "." + (await signature(config.secret + config.password, token));
      return response({ ok: true }, 200, {
        "Set-Cookie":
          "agua_admin=" +
          cookie +
          "; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=28800" +
          (url.protocol === "https:" ? "; Secure" : ""),
      });
    }
    if (url.pathname === "/api/admin/logout" && request.method === "POST")
      return response({ ok: true }, 200, {
        "Set-Cookie": "agua_admin=; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=0",
      });
    if (!(await authenticated(request, config)))
      return response({ error: "Entre para acessar o painel.", configured: true }, 401);
    if (url.pathname === "/api/admin/session") return response({ ok: true, local: config.local });
    if (url.pathname === "/api/admin/state" && request.method === "GET")
      return response({ state: await read(config), local: config.local });
    if (url.pathname === "/api/admin/commands" && request.method === "POST") {
      const data = await body(request);
      if (typeof data.operationId !== "string" || !Number.isInteger(data.revision))
        return response({ error: "Operação inválida." }, 400);
      return response({
        state: await commit(config, data.command, data.operationId, data.revision),
        local: config.local,
      });
    }
    return response({ error: "Não encontrado." }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "CONFLICT")
      return response(
        { error: "Os dados mudaram. Atualize o painel antes de tentar novamente." },
        409,
      );
    if (message === "DATABASE" || (error as { code?: string }).code)
      return response(
        { error: "Não foi possível acessar o banco. Nenhuma confirmação foi enviada." },
        503,
      );
    if ((error as { name?: string }).name === "ZodError")
      return response(
        { error: "Confira os campos: valores, quantidades e formatos inválidos." },
        400,
      );
    return response({ error: message || "Não foi possível concluir a operação." }, 400);
  }
}
