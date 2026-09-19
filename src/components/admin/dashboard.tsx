import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ArrowLeftRight,
  Wallet,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Plus,
  Search,
  RefreshCw,
  Download,
  Pencil,
  Trash2,
  Copy,
  LockKeyhole,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Check,
  Truck,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BrandLogo } from "@/components/store/brand-logo";
import { money, type Product } from "@/lib/catalog";
import {
  metrics,
  businessDate,
  type ManagementState,
  type Command,
  type Order,
  type LedgerEntry,
} from "@/lib/management";
import "@/admin.css";

const tabs = [
  { id: "overview", name: "Visão geral", icon: LayoutDashboard },
  { id: "orders", name: "Pedidos", icon: ShoppingBag },
  { id: "products", name: "Produtos", icon: Package },
  { id: "inventory", name: "Estoque", icon: ArrowLeftRight },
  { id: "finance", name: "Financeiro", icon: Wallet },
  { id: "customers", name: "Clientes", icon: Users },
  { id: "settings", name: "Configurações", icon: Settings },
] as const;
type Tab = (typeof tabs)[number]["id"];
type Modal =
  | { kind: "product"; product?: Product }
  | { kind: "inventory"; product: Product }
  | { kind: "order" }
  | { kind: "expense" }
  | { kind: "detail"; id: string }
  | null;
const statusLabels = {
  pending: "Aguardando",
  paid: "Pago",
  fulfilled: "Enviado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};
const currency = (cents: number) => money(cents / 100);
const newId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
const date = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
const isoDate = (value: Date) =>
  value.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Não foi possível concluir.";
const field = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const amount = (data: FormData, key: string) => Math.round(Number(field(data, key) || 0) * 100);
const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
async function api(path: string, body?: unknown) {
  const response = await fetch("/api/admin/" + path, {
    credentials: "same-origin",
    ...(body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const data = await response.json();
  if (!response.ok)
    throw Object.assign(new Error(data.error || "Falha de comunicação."), {
      status: response.status,
    });
  return data;
}
function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csv(entries: LedgerEntry[]) {
  const escape = (v: unknown) =>
    '"' +
    String(v)
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  return (
    "\ufeff" +
    [
      ["Data", "Descrição", "Tipo", "Valor BRL"],
      ...entries.map((e) => [date(e.at), e.description, e.kind, (e.amount / 100).toFixed(2)]),
    ]
      .map((row) => row.map(escape).join(";"))
      .join("\r\n")
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="admin-empty">
      <Package size={28} strokeWidth={1.3} />
      <p>{children}</p>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function NumberField({
  name,
  label,
  value = 0,
  required = false,
}: {
  name: string;
  label: string;
  value?: number | string;
  required?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        name={name}
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        max="1000000"
        defaultValue={value}
        required={required}
      />
    </Field>
  );
}
function Status({ order }: { order: Order }) {
  return (
    <span className={"admin-status status-" + order.status}>{statusLabels[order.status]}</span>
  );
}

export function Dashboard() {
  const [state, setState] = useState<ManagementState | null>(null);
  const [mode, setMode] = useState<"loading" | "login" | "ready" | "setup" | "error">("loading");
  const [local, setLocal] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const pendingOperation = useRef<{ command: string; id: string } | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [modal, setModal] = useState<Modal>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const data = await api("state");
      setState(data.state);
      setLocal(data.local);
      setMode("ready");
      setError("");
    } catch (e) {
      setError(errorMessage(e));
      const code = (e as { status?: number }).status;
      if (code === 401) {
        setState(null);
        setMode("login");
      } else {
        setMode((previous) => (previous === "ready" ? previous : code === 503 ? "setup" : "error"));
        toast.error(errorMessage(e));
      }
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function send(command: Command) {
    if (!state || busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    setError("");
    const serialized = JSON.stringify(command);
    if (pendingOperation.current?.command !== serialized)
      pendingOperation.current = { command: serialized, id: newId() };
    try {
      const data = await api("commands", {
        command,
        operationId: pendingOperation.current.id,
        revision: state.revision,
      });
      pendingOperation.current = null;
      setState(data.state);
      window.dispatchEvent(new Event("catalog-updated"));
      toast.success("Alteração salva.");
      return true;
    } catch (e) {
      if ([400, 401, 403, 409].includes((e as { status?: number }).status ?? 0))
        pendingOperation.current = null;
      setError(errorMessage(e));
      toast.error(errorMessage(e));
      if ((e as { status?: number }).status === 401) {
        setState(null);
        setMode("login");
      }
      if ((e as { status?: number }).status === 409) await refresh();
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const submit =
    (callback: (data: FormData) => Command) => async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const command = callback(new FormData(event.currentTarget));
      if (await send(command)) setModal(null);
    };
  if (mode !== "ready" || !state)
    return (
      <main className="admin-login">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const password = field(new FormData(e.currentTarget), "password");
            try {
              await api("login", { password });
              await refresh();
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <BrandLogo className="w-44 h-auto md:h-auto" />
          <LockKeyhole size={24} />
          <h1>{mode === "setup" ? "Conectar a gestão" : "Seu negócio, por inteiro."}</h1>
          {mode === "loading" ? (
            <p role="status">Carregando painel...</p>
          ) : mode === "setup" || mode === "error" ? (
            <>
              <p role="alert">{error}</p>
              <button type="button" className="admin-primary" onClick={refresh}>
                <RefreshCw size={16} /> Tentar novamente
              </button>
            </>
          ) : (
            <>
              <Field label="Senha administrativa">
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  autoFocus
                />
              </Field>
              {error && (
                <p className="admin-error" role="alert">
                  {error}
                </p>
              )}
              <button className="admin-primary" disabled={busy}>
                {busy ? "Entrando..." : "Entrar no painel"}
                <ArrowUpRight size={17} />
              </button>
            </>
          )}
          <Link to="/">Voltar à loja</Link>
        </form>
      </main>
    );

  const summary = metrics(state, from, to || "\uffff");
  const filteredOrders = state.orders.filter(
    (o) =>
      (status === "all" || o.status === status) &&
      [o.number, o.customer.name, o.customer.email, o.customer.phone]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      businessDate(o.createdAt) >= from &&
      (!to || businessDate(o.createdAt) <= to),
  );
  const filteredProducts = state.products.filter((p) =>
    (p.name + " " + p.category + " " + p.color).toLowerCase().includes(query.toLowerCase()),
  );
  const ledger = state.ledger.filter(
    (e) =>
      businessDate(e.at) >= from &&
      (!to || businessDate(e.at) <= to) &&
      (e.description + " " + (e.category ?? "")).toLowerCase().includes(query.toLowerCase()),
  );
  const lowStock = state.products.filter((p) => p.stock <= 5);
  const customers = new Map<
    string,
    { name: string; email: string; phone: string; orders: Order[] }
  >();
  for (const order of state.orders) {
    const key =
      order.customer.email.toLowerCase() || order.customer.phone.replace(/\D/g, "") || order.id;
    const existing = customers.get(key) ?? { ...order.customer, orders: [] };
    existing.orders.push(order);
    customers.set(key, existing);
  }
  const detailed =
    modal?.kind === "detail" ? state.orders.find((o) => o.id === modal.id) : undefined;
  const selectedOrders = selectedCustomer ? customers.get(selectedCustomer)?.orders : undefined;
  const showOrders = (orders: Order[]) =>
    orders.length ? (
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Pedido / cliente</th>
              <th>Data</th>
              <th>Status</th>
              <th>Total</th>
              <th>
                <span className="sr-only">Detalhes</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <button
                    className="admin-text-button"
                    onClick={() => setModal({ kind: "detail", id: order.id })}
                  >
                    #{order.number} · {order.customer.name}
                  </button>
                  <small>{order.lines.reduce((s, l) => s + l.quantity, 0)} peça(s)</small>
                </td>
                <td>{date(order.createdAt)}</td>
                <td>
                  <Status order={order} />
                </td>
                <td>{currency(order.total)}</td>
                <td>
                  <button
                    title={"Abrir pedido #" + order.number}
                    aria-label={"Abrir pedido #" + order.number}
                    className="admin-icon"
                    onClick={() => setModal({ kind: "detail", id: order.id })}
                  >
                    <ArrowUpRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <Empty>Nenhum pedido neste período.</Empty>
    );

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand" aria-label="Água Limpa, voltar à loja">
          <BrandLogo className="w-40 h-auto md:h-auto" />
        </Link>
        <span className="admin-section-label">GESTÃO DA LOJA</span>
        <nav aria-label="Painel administrativo">
          {tabs.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => {
                setTab(item.id);
                setQuery("");
                setStatus("all");
                setSelectedCustomer(null);
              }}
            >
              <item.icon size={19} />
              <span>{item.name}</span>
              {item.id === "orders" && state.orders.some((o) => o.status === "pending") && (
                <b>{state.orders.filter((o) => o.status === "pending").length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link to="/">
            <ExternalLink size={16} /> Ver loja
          </Link>
          <button
            onClick={async () => {
              try {
                await api("logout", {});
                setState(null);
                setMode("login");
              } catch (e) {
                toast.error(errorMessage(e));
              }
            }}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
      <main className="admin-main" id="conteudo">
        <header className="admin-header">
          <div>
            <p className="admin-section-label">ÁGUA LIMPA / OPERAÇÃO</p>
            <h1>{tabs.find((item) => item.id === tab)?.name}</h1>
          </div>
          <div className="admin-actions">
            <button
              className="admin-icon"
              title="Atualizar dados"
              aria-label="Atualizar dados"
              disabled={busy}
              onClick={refresh}
            >
              <RefreshCw size={19} />
            </button>
            <Link className="admin-icon" to="/" title="Ver loja" aria-label="Ver loja">
              <ExternalLink size={19} />
            </Link>
          </div>
        </header>
        {local && (
          <div className="admin-notice">
            <AlertCircle size={17} />
            <span>
              Ambiente local · dados salvos neste computador. Conecte o Supabase para compartilhar a
              gestão.
            </span>
          </div>
        )}
        {error && (
          <div className="admin-error" role="alert">
            {error}
          </div>
        )}
        {["overview", "orders", "finance"].includes(tab) && (
          <div className="admin-period">
            <Field label="De">
              <input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </Field>
            <Field label="Até">
              <input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </Field>
            <button
              onClick={() => {
                const today = new Date();
                setFrom(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
                setTo(isoDate(today));
              }}
            >
              Este mês
            </button>
            <button
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Todo o histórico
            </button>
          </div>
        )}
        {tab === "overview" && (
          <>
            <div className="admin-metrics">
              <Metric
                label="Receita líquida de reembolsos"
                value={currency(summary.revenue)}
                detail={summary.sales + " pagamentos confirmados"}
              />
              <Metric
                label="Resultado estimado"
                value={summary.profit === null ? "Custos pendentes" : currency(summary.profit)}
                detail={
                  summary.missingCosts
                    ? "Há vendas sem custo de aquisição informado"
                    : "Após custo das peças, taxas e despesas"
                }
              />
              <Metric
                label="Variação de caixa"
                value={currency(summary.cash)}
                detail="Entradas menos saídas do período"
              />
              <Metric
                label="Pedidos em aberto"
                value={String(
                  state.orders.filter((o) => ["pending", "paid"].includes(o.status)).length,
                )}
                detail={lowStock.length + " produtos com estoque baixo"}
              />
            </div>
            <div className="admin-overview-grid">
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <h2>Movimentação financeira</h2>
                  <button onClick={() => setTab("finance")}>
                    Ver financeiro <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="admin-cash-row">
                  <span>
                    <ArrowDownRight size={18} /> Entradas
                  </span>
                  <strong>{currency(summary.incoming)}</strong>
                </div>
                <div className="admin-bar">
                  <span
                    style={{
                      width:
                        summary.incoming + summary.outgoing
                          ? (summary.incoming / Math.max(summary.incoming, summary.outgoing)) *
                              100 +
                            "%"
                          : "0%",
                    }}
                  />
                </div>
                <div className="admin-cash-row">
                  <span>
                    <ArrowUpRight size={18} /> Saídas
                  </span>
                  <strong>{currency(summary.outgoing)}</strong>
                </div>
                <div className="admin-bar outgoing">
                  <span
                    style={{
                      width:
                        summary.incoming + summary.outgoing
                          ? (summary.outgoing / Math.max(summary.incoming, summary.outgoing)) *
                              100 +
                            "%"
                          : "0%",
                    }}
                  />
                </div>
                <p className="admin-muted">
                  Compras de estoque entram no caixa; o custo das peças vendidas entra no resultado.
                  Estimativa gerencial, não contábil.
                </p>
              </section>
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <h2>Atenção ao estoque</h2>
                  <button onClick={() => setTab("inventory")}>
                    Ver estoque <ArrowUpRight size={16} />
                  </button>
                </div>
                {lowStock.length ? (
                  lowStock.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      className="admin-stock-alert"
                      onClick={() => setModal({ kind: "inventory", product: p })}
                    >
                      <img src={p.image} alt="" />
                      <span>
                        {p.name}
                        <small>{p.category}</small>
                      </span>
                      <b>{p.stock} un.</b>
                    </button>
                  ))
                ) : (
                  <Empty>Estoque em dia.</Empty>
                )}
              </section>
            </div>
            <section className="admin-panel">
              <div className="admin-panel-heading">
                <h2>Últimos pedidos</h2>
                <button className="admin-primary" onClick={() => setModal({ kind: "order" })}>
                  <Plus size={16} /> Novo pedido
                </button>
              </div>
              {showOrders(filteredOrders.slice(0, 6))}
            </section>
          </>
        )}
        {["orders", "products", "inventory", "finance", "customers"].includes(tab) && (
          <div className="admin-toolbar">
            <label className="admin-search">
              <Search size={18} />
              <input
                aria-label="Buscar no painel"
                placeholder={tab === "orders" ? "Pedido, nome ou contato..." : "Buscar..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {tab === "orders" && (
              <>
                <select
                  aria-label="Filtrar status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">Todos os status</option>
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                <button className="admin-primary" onClick={() => setModal({ kind: "order" })}>
                  <Plus size={17} /> Novo pedido
                </button>
              </>
            )}
            {tab === "products" && (
              <button className="admin-primary" onClick={() => setModal({ kind: "product" })}>
                <Plus size={17} /> Novo produto
              </button>
            )}
            {tab === "finance" && (
              <>
                <button
                  title="Exportar lançamentos CSV"
                  onClick={() =>
                    download("financeiro-agua-limpa.csv", csv(ledger), "text/csv;charset=utf-8")
                  }
                >
                  <Download size={17} /> Exportar
                </button>
                <button className="admin-primary" onClick={() => setModal({ kind: "expense" })}>
                  <Plus size={17} /> Despesa
                </button>
              </>
            )}
          </div>
        )}
        {tab === "orders" && (
          <section className="admin-panel">{showOrders(filteredOrders)}</section>
        )}
        {(tab === "products" || tab === "inventory") && (
          <>
            {tab === "inventory" && (
              <div className="admin-metrics">
                <Metric
                  label="Unidades disponíveis"
                  value={String(state.products.reduce((s, p) => s + p.stock, 0))}
                  detail="Estoque total por produto, compartilhado entre tamanhos"
                />
                <Metric
                  label="Estoque baixo"
                  value={String(lowStock.length)}
                  detail="Produtos com até 5 unidades"
                />
              </div>
            )}
            <section className="admin-panel admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Preço / custo</th>
                    <th>Estoque</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="admin-product">
                          <img src={p.image} alt="" />
                          <div>
                            <strong>{p.name}</strong>
                            <small>
                              {p.category} · {p.color}
                            </small>
                            <small>{p.sizes.join(" / ")}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {money(p.price)}
                        <small>
                          {state.costs[p.id] == null
                            ? "Custo pendente"
                            : "Custo " + currency(state.costs[p.id]!)}
                        </small>
                      </td>
                      <td>
                        <span className={p.stock <= 5 ? "admin-stock-low" : ""}>{p.stock} un.</span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button
                            className="admin-icon"
                            aria-label={"Editar " + p.name}
                            title="Editar produto"
                            onClick={() => setModal({ kind: "product", product: p })}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            className="admin-icon"
                            aria-label={"Movimentar " + p.name}
                            title="Movimentar estoque"
                            onClick={() => setModal({ kind: "inventory", product: p })}
                          >
                            <ArrowLeftRight size={17} />
                          </button>
                          {tab === "products" && (
                            <>
                              <button
                                className="admin-icon"
                                aria-label={"Duplicar " + p.name}
                                title="Duplicar produto"
                                onClick={() =>
                                  setModal({
                                    kind: "product",
                                    product: {
                                      ...p,
                                      id: "",
                                      slug: p.slug + "-copia",
                                      name: p.name + " (cópia)",
                                      stock: 0,
                                    },
                                  })
                                }
                              >
                                <Copy size={17} />
                              </button>
                              <button
                                className="admin-icon"
                                aria-label={"Remover " + p.name}
                                title="Remover produto sem estoque"
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Remover " +
                                        p.name +
                                        " do catálogo? Pedidos e histórico serão preservados.",
                                    )
                                  )
                                    void send({ type: "archive", productId: p.id });
                                }}
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredProducts.length && <Empty>Nenhum produto encontrado.</Empty>}
            </section>
            {tab === "inventory" && (
              <section className="admin-panel">
                <div className="admin-panel-heading">
                  <h2>Histórico de movimentações</h2>
                </div>
                {state.movements.length ? (
                  <div className="admin-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Data / motivo</th>
                          <th>Produto</th>
                          <th>Variação</th>
                          <th>Saldo após</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.movements
                          .filter((m) =>
                            (m.name + " " + m.reason).toLowerCase().includes(query.toLowerCase()),
                          )
                          .slice(0, 100)
                          .map((m) => (
                            <tr key={m.id}>
                              <td>
                                {date(m.at)}
                                <small>{m.reason}</small>
                              </td>
                              <td>{m.name}</td>
                              <td className={m.delta > 0 ? "admin-positive" : ""}>
                                {m.delta > 0 ? "+" : ""}
                                {m.delta}
                              </td>
                              <td>{m.balance}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty>Nenhuma movimentação registrada.</Empty>
                )}
                <p className="admin-muted">
                  Últimas 100 movimentações. Histórico completo disponível no backup.
                </p>
              </section>
            )}
          </>
        )}
        {tab === "finance" && (
          <>
            <div className="admin-metrics">
              <Metric
                label="Entradas"
                value={currency(summary.incoming)}
                detail="Vendas e estornos de despesas"
              />
              <Metric
                label="Saídas"
                value={currency(summary.outgoing)}
                detail="Despesas, compras e reembolsos"
              />
              <Metric
                label="Variação de caixa"
                value={currency(summary.cash)}
                detail="Não inclui saldo bancário inicial"
              />
              <Metric
                label="Resultado estimado"
                value={summary.profit === null ? "Custos pendentes" : currency(summary.profit)}
                detail="Não substitui apuração contábil"
              />
            </div>
            <section className="admin-panel admin-table-wrap">
              {ledger.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Data / lançamento</th>
                      <th>Categoria</th>
                      <th>Valor</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((e) => (
                      <tr key={e.id}>
                        <td>
                          {e.description}
                          <small>{date(e.at)}</small>
                        </td>
                        <td>
                          {e.category ??
                            {
                              sale: "Venda",
                              refund: "Reembolso",
                              fee: "Taxa",
                              shipping: "Frete",
                              purchase: "Compra de estoque",
                              expense: "Despesa",
                              reversal: "Estorno",
                            }[e.kind]}
                        </td>
                        <td className={e.amount > 0 ? "admin-positive" : ""}>
                          {currency(e.amount)}
                        </td>
                        <td>
                          {e.kind === "expense" &&
                            !state.ledger.some((l) => l.reverses === e.id) && (
                              <button
                                className="admin-icon"
                                aria-label={"Estornar " + e.description}
                                title="Estornar despesa"
                                disabled={busy}
                                onClick={() => {
                                  const reason = prompt("Motivo do estorno:");
                                  if (reason?.trim())
                                    void send({ type: "reverseExpense", entryId: e.id, reason });
                                }}
                              >
                                <RotateCcw size={17} />
                              </button>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty>Nenhum lançamento neste período.</Empty>
              )}
            </section>
          </>
        )}
        {tab === "customers" && (
          <section className="admin-panel">
            {selectedOrders ? (
              <>
                <div className="admin-panel-heading">
                  <h2>{customers.get(selectedCustomer!)?.name}</h2>
                  <button onClick={() => setSelectedCustomer(null)}>Todos os clientes</button>
                </div>
                {showOrders(selectedOrders)}
              </>
            ) : customers.size ? (
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Contato</th>
                      <th>Pedidos</th>
                      <th>Compras líquidas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...customers.entries()]
                      .filter(([, c]) =>
                        (c.name + " " + c.email + " " + c.phone)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map(([key, c]) => (
                        <tr key={key}>
                          <td>
                            <button
                              className="admin-text-button"
                              onClick={() => setSelectedCustomer(key)}
                            >
                              {c.name}
                            </button>
                          </td>
                          <td>
                            {c.email || "Sem e-mail"}
                            <small>{c.phone}</small>
                          </td>
                          <td>{c.orders.length}</td>
                          <td>
                            {currency(
                              c.orders
                                .filter((o) => ["paid", "fulfilled"].includes(o.status))
                                .reduce((s, o) => s + o.total, 0),
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>Os clientes aparecerão aqui ao registrar pedidos.</Empty>
            )}
          </section>
        )}
        {tab === "settings" && (
          <div className="admin-settings">
            <section className="admin-panel">
              <h2>Conexões</h2>
              <div className="admin-setting-row">
                <div>
                  <strong>Banco de dados</strong>
                  <p>
                    {local
                      ? "Local neste computador. Supabase ainda não conectado."
                      : "Supabase conectado. Dados compartilhados entre dispositivos."}
                  </p>
                </div>
                <span className="admin-status">{local ? "Local" : "Conectado"}</span>
              </div>
              <div className="admin-setting-row">
                <div>
                  <strong>Stripe / checkout</strong>
                  <p>
                    Não conectado. Confirmações e reembolsos neste painel são registros manuais; não
                    cobram nem devolvem dinheiro.
                  </p>
                </div>
                <span className="admin-status">Pendente</span>
              </div>
              <div className="admin-setting-row">
                <div>
                  <strong>Segurança</strong>
                  <p>Sessão de 8 horas em cookie HttpOnly. A senha é configurada no servidor.</p>
                </div>
                <LockKeyhole size={20} />
              </div>
            </section>
            <section className="admin-panel">
              <h2>Dados e catálogo</h2>
              <p className="admin-muted">
                O backup contém dados de clientes. Guarde-o em local privado. A importação abaixo
                aceita somente catálogo, antes da primeira movimentação.
              </p>
              <div className="admin-actions flex-wrap">
                <button
                  onClick={() =>
                    download(
                      "agua-limpa-backup-" + isoDate(new Date()) + ".json",
                      JSON.stringify(state, null, 2),
                      "application/json",
                    )
                  }
                >
                  <Download size={17} /> Backup completo
                </button>
                <button
                  onClick={() =>
                    download(
                      "catalogo-agua-limpa.json",
                      JSON.stringify(
                        { products: state.products, categories: state.categories },
                        null,
                        2,
                      ),
                      "application/json",
                    )
                  }
                >
                  <Download size={17} /> Catálogo
                </button>
                <label className="admin-upload">
                  Importar catálogo
                  <input
                    type="file"
                    accept=".json,application/json"
                    disabled={busy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      try {
                        if (file.size > 1_000_000) throw new Error("Arquivo muito grande.");
                        const data = JSON.parse(await file.text());
                        if (confirm("Substituir o catálogo atual pelo arquivo selecionado?"))
                          await send({
                            type: "importCatalog",
                            products: data.products,
                            categories: data.categories,
                          });
                      } catch (err) {
                        toast.error(errorMessage(err));
                      }
                    }}
                  />
                </label>
                <button
                  disabled={busy}
                  onClick={() => {
                    try {
                      const saved = localStorage.getItem("agua-limpa-catalog-v1");
                      if (!saved) {
                        toast.info("Nenhum catálogo antigo neste navegador.");
                        return;
                      }
                      const data = JSON.parse(saved);
                      if (confirm("Migrar o catálogo antigo deste navegador?"))
                        void send({
                          type: "importCatalog",
                          products: data.products,
                          categories: data.categories,
                        });
                    } catch {
                      toast.error("Catálogo antigo inválido.");
                    }
                  }}
                >
                  Migrar catálogo antigo
                </button>
              </div>
            </section>
          </div>
        )}
        <footer className="admin-footnote">
          Água Limpa · Gestão <span>Atualização #{state.revision}</span>
        </footer>
      </main>
      <Dialog
        open={modal !== null}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setModal(null);
            setError("");
          }
        }}
      >
        <DialogContent className="admin-dialog">
          <DialogTitle>
            {modal?.kind === "product"
              ? modal.product?.id
                ? "Editar produto"
                : "Novo produto"
              : modal?.kind === "inventory"
                ? "Movimentar estoque"
                : modal?.kind === "order"
                  ? "Novo pedido manual"
                  : modal?.kind === "expense"
                    ? "Registrar despesa"
                    : detailed
                      ? "Pedido #" + detailed.number
                      : "Detalhes"}
          </DialogTitle>
          <DialogDescription>
            {modal?.kind === "order"
              ? "O pedido fica pendente até a confirmação do recebimento."
              : modal?.kind === "detail"
                ? "Histórico, pagamento e entrega."
                : "Alterações salvas na gestão da loja."}
          </DialogDescription>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
          <fieldset disabled={busy} className="admin-form-fields">
            {modal?.kind === "product" && (
              <ProductForm
                key={modal.product?.id ?? "new"}
                product={modal.product}
                state={state}
                onSubmit={submit((data) => {
                  const p = modal.product;
                  const name = field(data, "name");
                  return {
                    type: "product",
                    cost: field(data, "cost") === "" ? null : amount(data, "cost"),
                    product: {
                      id: p?.id || newId(),
                      name,
                      slug: field(data, "slug") || slugify(name),
                      category: field(data, "category"),
                      price: amount(data, "price") / 100,
                      image: field(data, "image"),
                      color: field(data, "color"),
                      sizes: field(data, "sizes")
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                      description: field(data, "description"),
                      featured: data.get("featured") === "on",
                      stock: p?.id ? p.stock : Number(field(data, "stock")),
                      badge: field(data, "badge"),
                    },
                  };
                })}
              />
            )}
            {modal?.kind === "inventory" && (
              <form
                className="admin-form"
                onSubmit={submit((data) => ({
                  type: "inventory",
                  productId: modal.product.id,
                  delta: Number(field(data, "delta")),
                  reason: field(data, "reason"),
                  purchase: data.get("purchase") === "on",
                  unitCost: field(data, "unitCost") === "" ? null : amount(data, "unitCost"),
                }))}
              >
                <p>
                  <strong>{modal.product.name}</strong> · {modal.product.stock} unidades disponíveis
                </p>
                <Field label="Quantidade (+ entrada / - saída)">
                  <input
                    name="delta"
                    type="number"
                    inputMode="text"
                    step="1"
                    min="-100000"
                    max="100000"
                    required
                  />
                </Field>
                <NumberField
                  name="unitCost"
                  label="Custo unitário (R$)"
                  value={
                    state.costs[modal.product.id] == null
                      ? ""
                      : state.costs[modal.product.id]! / 100
                  }
                />
                <Field label="Motivo">
                  <input
                    name="reason"
                    required
                    maxLength={300}
                    placeholder="Compra, avaria, contagem..."
                  />
                </Field>
                <label className="admin-checkbox">
                  <input name="purchase" type="checkbox" /> Lançar compra como saída de caixa
                </label>
                <Save />
              </form>
            )}
            {modal?.kind === "order" && (
              <OrderForm products={state.products} onSave={send} onClose={() => setModal(null)} />
            )}
            {modal?.kind === "expense" && (
              <form
                className="admin-form"
                onSubmit={submit((data) => ({
                  type: "expense",
                  amount: amount(data, "amount"),
                  category: field(data, "category") as "Operação",
                  description: field(data, "description"),
                }))}
              >
                <NumberField name="amount" label="Valor (R$)" required />
                <Field label="Categoria">
                  <select name="category">
                    {["Operação", "Marketing", "Impostos", "Outros"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Descrição">
                  <input name="description" required maxLength={300} />
                </Field>
                <Save />
              </form>
            )}
            {detailed && <OrderDetail order={detailed} onSave={send} />}
          </fieldset>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="admin-metric">
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}
function Save() {
  return (
    <button className="admin-primary" type="submit">
      <Check size={17} /> Salvar
    </button>
  );
}
function ProductForm({
  product: p,
  state,
  onSubmit,
}: {
  product: Product | undefined;
  state: ManagementState;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form-grid">
        <Field label="Nome">
          <input name="name" defaultValue={p?.name} required maxLength={300} />
        </Field>
        <Field label="Slug">
          <input
            name="slug"
            defaultValue={p?.slug}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            placeholder="Gerado pelo nome"
          />
        </Field>
        <Field label="Categoria">
          <input
            name="category"
            list="admin-categories"
            defaultValue={p?.category ?? state.categories[0]}
            required
          />
          <datalist id="admin-categories">
            {state.categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Cor">
          <input name="color" defaultValue={p?.color} required />
        </Field>
        <NumberField name="price" label="Preço de venda (R$)" value={p?.price ?? ""} required />
        <NumberField
          name="cost"
          label="Custo de aquisição (R$)"
          value={p && state.costs[p.id] != null ? state.costs[p.id]! / 100 : ""}
        />
        <Field label="Tamanhos (separados por vírgula)">
          <input name="sizes" defaultValue={p?.sizes.join(", ") ?? "P, M, G"} required />
        </Field>
        {!p?.id && (
          <Field label="Estoque inicial">
            <input
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue={p?.stock ?? 0}
              required
            />
          </Field>
        )}
      </div>
      <Field label="Imagem (URL HTTPS ou caminho local)">
        <input name="image" defaultValue={p?.image} required maxLength={2000} />
      </Field>
      <Field label="Descrição">
        <textarea name="description" defaultValue={p?.description} rows={3} maxLength={5000} />
      </Field>
      <Field label="Etiqueta">
        <input name="badge" defaultValue={p?.badge} maxLength={100} />
      </Field>
      <label className="admin-checkbox">
        <input name="featured" type="checkbox" defaultChecked={p?.featured ?? false} /> Destaque na
        loja
      </label>
      <Save />
    </form>
  );
}
function OrderForm({
  products,
  onSave,
  onClose,
}: {
  products: Product[];
  onSave: (c: Command) => Promise<boolean>;
  onClose: () => void;
}) {
  const [lines, setLines] = useState([
    {
      key: newId(),
      productId: products[0]?.id ?? "",
      size: products[0]?.sizes[0] ?? "",
      quantity: 1,
    },
  ]);
  const subtotal = lines.reduce(
    (s, l) => s + (products.find((p) => p.id === l.productId)?.price ?? 0) * l.quantity,
    0,
  );
  return (
    <form
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        if (
          await onSave({
            type: "order",
            customer: {
              name: field(data, "name"),
              email: field(data, "email"),
              phone: field(data, "phone"),
            },
            lines: lines.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
            shipping: amount(data, "shipping"),
            discount: amount(data, "discount"),
            note: field(data, "note"),
          })
        )
          onClose();
      }}
    >
      <Field label="Nome da cliente">
        <input name="name" required maxLength={300} autoComplete="name" />
      </Field>
      <div className="admin-form-grid">
        <Field label="E-mail">
          <input name="email" type="email" autoComplete="email" />
        </Field>
        <Field label="Telefone">
          <input name="phone" type="tel" autoComplete="tel" maxLength={40} />
        </Field>
      </div>
      <div className="admin-order-lines">
        {lines.map((line, index) => (
          <div key={line.key} className="admin-order-line">
            <Field label={"Produto " + (index + 1)}>
              <select
                value={line.productId}
                onChange={(e) =>
                  setLines((old) =>
                    old.map((l, i) =>
                      i === index
                        ? {
                            ...l,
                            productId: e.target.value,
                            size: products.find((p) => p.id === e.target.value)?.sizes[0] ?? "",
                          }
                        : l,
                    ),
                  )
                }
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {money(p.price)} · {p.stock} un.
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tamanho">
              <select
                value={line.size}
                onChange={(e) =>
                  setLines((old) =>
                    old.map((l, i) => (i === index ? { ...l, size: e.target.value } : l)),
                  )
                }
              >
                {products
                  .find((p) => p.id === line.productId)
                  ?.sizes.map((size) => (
                    <option key={size}>{size}</option>
                  ))}
              </select>
            </Field>
            <Field label="Qtd.">
              <input
                type="number"
                min="1"
                max="10000"
                required
                value={line.quantity}
                onChange={(e) =>
                  setLines((old) =>
                    old.map((l, i) =>
                      i === index ? { ...l, quantity: Number(e.target.value) } : l,
                    ),
                  )
                }
              />
            </Field>
            <button
              type="button"
              className="admin-icon"
              title="Remover item"
              aria-label={"Remover item " + (index + 1)}
              disabled={lines.length === 1}
              onClick={() => setLines((old) => old.filter((_, i) => i !== index))}
            >
              <X size={17} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={lines.length >= 50 || !products.length}
        onClick={() =>
          setLines((old) => [
            ...old,
            {
              key: newId(),
              productId: products[0]?.id ?? "",
              size: products[0]?.sizes[0] ?? "",
              quantity: 1,
            },
          ])
        }
      >
        <Plus size={17} /> Adicionar peça
      </button>
      <p className="admin-total">
        Subtotal <strong>{money(subtotal)}</strong>
      </p>
      <div className="admin-form-grid">
        <NumberField name="shipping" label="Frete cobrado (R$)" />
        <NumberField name="discount" label="Desconto (R$)" />
      </div>
      <Field label="Observações / endereço de entrega">
        <textarea name="note" rows={3} maxLength={2000} />
      </Field>
      <Save />
    </form>
  );
}
function OrderDetail({
  order,
  onSave,
}: {
  order: Order;
  onSave: (c: Command) => Promise<boolean>;
}) {
  const [action, setAction] = useState("");
  return (
    <div className="admin-order-detail">
      <div className="admin-panel-heading">
        <strong>{order.customer.name}</strong>
        <Status order={order} />
      </div>
      <p className="admin-muted">
        {[order.customer.email, order.customer.phone].filter(Boolean).join(" · ")}
      </p>
      {order.lines.map((l, i) => (
        <div className="admin-setting-row" key={i}>
          <span>
            {l.name}
            <small>
              {l.size} · {l.quantity} unidade(s)
            </small>
          </span>
          <strong>{currency(l.unitPrice * l.quantity)}</strong>
        </div>
      ))}
      <p className="admin-total">
        Frete / desconto{" "}
        <span>
          {currency(order.shipping)} / {currency(order.discount)}
        </span>
      </p>
      <p className="admin-total">
        Total <strong>{currency(order.total)}</strong>
      </p>
      {order.note && <p className="admin-order-note">{order.note}</p>}
      {order.tracking && (
        <p>
          Rastreio: <strong>{order.tracking}</strong>
        </p>
      )}
      <div className="admin-actions flex-wrap">
        {order.status === "pending" && (
          <>
            <button className="admin-primary" onClick={() => setAction("payment")}>
              <Check size={17} /> Confirmar recebimento
            </button>
            <button
              onClick={async () => {
                if (confirm("Cancelar este pedido pendente?"))
                  await onSave({ type: "cancel", orderId: order.id });
              }}
            >
              <X size={17} /> Cancelar
            </button>
          </>
        )}
        {order.status === "paid" && (
          <button className="admin-primary" onClick={() => setAction("fulfill")}>
            <Truck size={17} /> Registrar envio
          </button>
        )}
        {["paid", "fulfilled"].includes(order.status) && (
          <button onClick={() => setAction("refund")}>
            <RotateCcw size={17} /> Registrar reembolso
          </button>
        )}
      </div>
      {action === "payment" && order.status === "pending" && (
        <form
          className="admin-form admin-action-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            if (
              await onSave({
                type: "payment",
                orderId: order.id,
                fees: amount(data, "fees"),
                shippingCost: amount(data, "shippingCost"),
              })
            )
              setAction("");
          }}
        >
          <p>Confirme apenas após verificar o recebimento. Esta ação não cobra a cliente.</p>
          <div className="admin-form-grid">
            <NumberField name="fees" label="Taxas pagas (R$)" />
            <NumberField name="shippingCost" label="Custo do frete (R$)" />
          </div>
          <Save />
        </form>
      )}
      {action === "fulfill" && order.status === "paid" && (
        <form
          className="admin-form admin-action-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await onSave({
                type: "fulfill",
                orderId: order.id,
                tracking: field(new FormData(e.currentTarget), "tracking"),
              })
            )
              setAction("");
          }}
        >
          <Field label="Código de rastreio / entrega">
            <input name="tracking" required maxLength={300} />
          </Field>
          <Save />
        </form>
      )}
      {action === "refund" && ["paid", "fulfilled"].includes(order.status) && (
        <form
          className="admin-form admin-action-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            if (
              await onSave({
                type: "refund",
                orderId: order.id,
                reason: field(data, "reason"),
                restock: data.get("restock") === "on",
              })
            )
              setAction("");
          }}
        >
          <p>
            Registre somente após devolver o dinheiro pelo meio de pagamento. Taxas e frete não são
            estornados automaticamente.
          </p>
          <Field label="Motivo">
            <input name="reason" required maxLength={300} />
          </Field>
          <label className="admin-checkbox">
            <input type="checkbox" name="restock" /> Mercadoria recebida: repor todo o pedido no
            estoque
          </label>
          <Save />
        </form>
      )}
      <h3>Histórico do pedido</h3>
      <ol className="admin-timeline">
        {order.history.map((event, i) => (
          <li key={i}>
            <small>{date(event.at)}</small>
            <p>{event.message}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
