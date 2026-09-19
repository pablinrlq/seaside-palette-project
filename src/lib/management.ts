import { z } from "zod";
import type { Product } from "./catalog";

const text = z.string().trim().min(1).max(300);
const cents = z.number().int().min(0).max(100_000_000);
const quantity = z.number().int().min(1).max(10000);
export const productSchema = z.object({
  id: text,
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(150),
  name: text,
  category: text,
  price: z.number().positive().max(1_000_000),
  image: z
    .string()
    .max(2000)
    .refine((s) => /^https:\/\/|^\/(?!\/)/.test(s), "Imagem deve usar HTTPS ou caminho local."),
  color: text,
  sizes: z.array(text).min(1).max(30),
  description: z.string().max(5000),
  stock: z.number().int().min(0).max(100000),
  featured: z.boolean(),
  badge: z.string().max(100).optional(),
});
const lineSchema = z.object({ productId: text, size: text, quantity });
export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("product"), product: productSchema, cost: cents.nullable() }),
  z.object({ type: z.literal("archive"), productId: text }),
  z.object({
    type: z.literal("inventory"),
    productId: text,
    delta: z
      .number()
      .int()
      .min(-100000)
      .max(100000)
      .refine((n) => n !== 0),
    reason: text,
    purchase: z.boolean(),
    unitCost: cents.nullable(),
  }),
  z.object({
    type: z.literal("order"),
    customer: z.object({
      name: text,
      email: z.union([z.literal(""), z.string().email().max(254)]),
      phone: z.string().max(40),
    }),
    lines: z.array(lineSchema).min(1).max(50),
    shipping: cents,
    discount: cents,
    note: z.string().max(2000),
  }),
  z.object({ type: z.literal("payment"), orderId: text, fees: cents, shippingCost: cents }),
  z.object({ type: z.literal("fulfill"), orderId: text, tracking: text }),
  z.object({ type: z.literal("cancel"), orderId: text }),
  z.object({ type: z.literal("refund"), orderId: text, restock: z.boolean(), reason: text }),
  z.object({
    type: z.literal("expense"),
    amount: cents.refine((n) => n > 0),
    category: z.enum(["Operação", "Marketing", "Impostos", "Outros"]),
    description: text,
  }),
  z.object({ type: z.literal("reverseExpense"), entryId: text, reason: text }),
  z.object({
    type: z.literal("importCatalog"),
    products: z.array(productSchema).min(1).max(1000),
    categories: z.array(text).min(1).max(100),
  }),
]);
export type Command = z.infer<typeof commandSchema>;
export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "refunded";
export type Order = {
  id: string;
  number: number;
  createdAt: string;
  paidAt?: string;
  customer: { name: string; email: string; phone: string };
  lines: {
    productId: string;
    name: string;
    size: string;
    quantity: number;
    unitPrice: number;
    unitCost: number | null;
  }[];
  shipping: number;
  discount: number;
  total: number;
  fees: number;
  shippingCost: number;
  status: OrderStatus;
  note: string;
  tracking?: string;
  history: { at: string; message: string }[];
};
export type LedgerEntry = {
  id: string;
  at: string;
  amount: number;
  description: string;
  kind: "sale" | "refund" | "fee" | "shipping" | "purchase" | "expense" | "reversal";
  orderId?: string;
  category?: string;
  reverses?: string;
};
export type Movement = {
  id: string;
  at: string;
  productId: string;
  name: string;
  delta: number;
  balance: number;
  reason: string;
  orderId?: string;
};
export type ManagementState = {
  version: 1;
  revision: number;
  products: Product[];
  categories: string[];
  costs: Record<string, number | null>;
  orders: Order[];
  ledger: LedgerEntry[];
  movements: Movement[];
  processed: string[];
};
export function initialState(products: Product[], categories: string[]): ManagementState {
  return {
    version: 1,
    revision: 0,
    products,
    categories,
    costs: {},
    orders: [],
    ledger: [],
    movements: [],
    processed: [],
  };
}
function requireCondition(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function applyCommand(
  source: ManagementState,
  input: unknown,
  operationId: string,
  at = new Date().toISOString(),
): ManagementState {
  requireCondition(/^[a-zA-Z0-9-]{16,80}$/.test(operationId), "Identificador inválido.");
  if (source.processed.includes(operationId)) return source;
  const command = commandSchema.parse(input);
  const state = structuredClone(source);
  let sequence = 0;
  const id = () => operationId + "-" + ++sequence;
  const product = (productId: string) => {
    const result = state.products.find((p) => p.id === productId);
    requireCondition(result, "Produto não encontrado.");
    return result;
  };
  const move = (productId: string, delta: number, reason: string, orderId?: string) => {
    const p = product(productId);
    requireCondition(p.stock + delta >= 0, "Estoque insuficiente: " + p.name);
    requireCondition(p.stock + delta <= 100000, "Limite de estoque excedido.");
    p.stock += delta;
    state.movements.unshift({
      id: id(),
      at,
      productId,
      name: p.name,
      delta,
      balance: p.stock,
      reason,
      ...(orderId ? { orderId } : {}),
    });
  };
  const ledger = (
    amount: number,
    kind: LedgerEntry["kind"],
    description: string,
    extra: Partial<LedgerEntry> = {},
  ) => {
    if (amount) state.ledger.unshift({ id: id(), at, amount, kind, description, ...extra });
  };
  if (command.type === "product") {
    const p = command.product as Product;
    const existing = state.products.find((item) => item.id === p.id);
    requireCondition(
      !state.products.some((item) => item.slug === p.slug && item.id !== p.id),
      "Slug já utilizado.",
    );
    requireCondition(!existing || p.stock === existing.stock, "Ajuste o estoque pela aba Estoque.");
    state.products = existing
      ? state.products.map((item) => (item.id === p.id ? p : item))
      : [p, ...state.products];
    state.costs[p.id] = command.cost;
    if (!state.categories.includes(p.category)) state.categories.push(p.category);
    if (!existing && p.stock)
      state.movements.unshift({
        id: id(),
        at,
        productId: p.id,
        name: p.name,
        delta: p.stock,
        balance: p.stock,
        reason: "Saldo inicial",
      });
  } else if (command.type === "archive") {
    requireCondition(
      !state.orders.some(
        (o) =>
          ["pending", "paid"].includes(o.status) &&
          o.lines.some((l) => l.productId === command.productId),
      ),
      "Há pedidos em aberto para esse produto.",
    );
    requireCondition(
      product(command.productId).stock === 0,
      "Zere o estoque com um ajuste antes de remover.",
    );
    state.products = state.products.filter((p) => p.id !== command.productId);
  } else if (command.type === "inventory") {
    requireCondition(
      !command.purchase || (command.delta > 0 && command.unitCost !== null),
      "Informe quantidade positiva e custo da compra.",
    );
    move(command.productId, command.delta, command.reason);
    if (command.unitCost !== null) state.costs[command.productId] = command.unitCost;
    if (command.purchase) ledger(-command.delta * command.unitCost!, "purchase", command.reason);
  } else if (command.type === "order") {
    const totals = new Map<string, number>();
    const lines = command.lines.map((line) => {
      const p = product(line.productId);
      requireCondition(p.sizes.includes(line.size), "Tamanho indisponível.");
      totals.set(p.id, (totals.get(p.id) ?? 0) + line.quantity);
      return {
        ...line,
        name: p.name,
        unitPrice: Math.round(p.price * 100),
        unitCost: state.costs[p.id] ?? null,
      };
    });
    for (const [p, count] of totals)
      requireCondition(product(p).stock >= count, "Estoque insuficiente: " + product(p).name);
    const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    requireCondition(command.discount <= subtotal, "Desconto maior que o valor dos produtos.");
    state.orders.unshift({
      id: operationId,
      number: Math.max(1000, ...state.orders.map((o) => o.number)) + 1,
      createdAt: at,
      customer: command.customer,
      lines,
      shipping: command.shipping,
      discount: command.discount,
      total: subtotal + command.shipping - command.discount,
      fees: 0,
      shippingCost: 0,
      status: "pending",
      note: command.note,
      history: [{ at, message: "Pedido manual criado; aguardando pagamento." }],
    });
  } else if (command.type === "expense") {
    ledger(-command.amount, "expense", command.description, { category: command.category });
  } else if (command.type === "reverseExpense") {
    const entry = state.ledger.find((e) => e.id === command.entryId && e.kind === "expense");
    requireCondition(entry, "Despesa não encontrada.");
    requireCondition(!state.ledger.some((e) => e.reverses === entry.id), "Despesa já estornada.");
    ledger(-entry.amount, "reversal", command.reason, { reverses: entry.id });
  } else if (command.type === "importCatalog") {
    requireCondition(
      !state.orders.length && !state.movements.length && !state.ledger.length,
      "Importação permitida apenas antes da primeira movimentação.",
    );
    requireCondition(
      new Set(command.products.map((p) => p.id)).size === command.products.length &&
        new Set(command.products.map((p) => p.slug)).size === command.products.length,
      "IDs ou slugs duplicados.",
    );
    requireCondition(
      command.products.every((p) => command.categories.includes(p.category)),
      "Categoria ausente no arquivo.",
    );
    state.products = command.products as Product[];
    state.categories = command.categories;
    state.costs = {};
  } else {
    const order = state.orders.find((o) => o.id === command.orderId);
    requireCondition(order, "Pedido não encontrado.");
    if (command.type === "payment") {
      requireCondition(order.status === "pending", "Este pedido não aguarda pagamento.");
      for (const line of order.lines) {
        line.unitCost = state.costs[line.productId] ?? null;
        move(line.productId, -line.quantity, "Venda #" + order.number, order.id);
      }
      order.status = "paid";
      order.paidAt = at;
      order.fees = command.fees;
      order.shippingCost = command.shippingCost;
      ledger(order.total, "sale", "Pagamento #" + order.number, { orderId: order.id });
      ledger(-command.fees, "fee", "Taxas #" + order.number, { orderId: order.id });
      ledger(-command.shippingCost, "shipping", "Frete #" + order.number, { orderId: order.id });
      order.history.push({
        at,
        message: "Pagamento confirmado manualmente. Estoque e caixa atualizados.",
      });
    } else if (command.type === "fulfill") {
      requireCondition(order.status === "paid", "Confirme o pagamento antes do envio.");
      order.status = "fulfilled";
      order.tracking = command.tracking;
      order.history.push({ at, message: "Enviado. Rastreio: " + command.tracking });
    } else if (command.type === "cancel") {
      requireCondition(
        order.status === "pending",
        "Somente pedidos pendentes podem ser cancelados.",
      );
      order.status = "cancelled";
      order.history.push({ at, message: "Pedido cancelado sem movimentação financeira." });
    } else if (command.type === "refund") {
      requireCondition(
        ["paid", "fulfilled"].includes(order.status),
        "Pedido não pode ser reembolsado.",
      );
      if (command.restock)
        for (const line of order.lines)
          move(line.productId, line.quantity, "Devolução #" + order.number, order.id);
      order.status = "refunded";
      ledger(-order.total, "refund", "Reembolso #" + order.number + ": " + command.reason, {
        orderId: order.id,
      });
      order.history.push({
        at,
        message:
          "Reembolso registrado" +
          (command.restock ? " com reposição" : " sem reposição") +
          ": " +
          command.reason,
      });
    }
  }
  state.revision++;
  state.processed.push(operationId);
  return state;
}
export function businessDate(at: string) {
  return new Date(at).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}
export function metrics(state: ManagementState, from = "", to = "\uffff") {
  const within = (at: string) => businessDate(at) >= from && businessDate(at) <= to;
  const entries = state.ledger.filter((e) => within(e.at));
  const revenue = entries
    .filter((e) => e.kind === "sale" || e.kind === "refund")
    .reduce((s, e) => s + e.amount, 0);
  let cost = 0,
    missingCosts = 0;
  for (const e of entries.filter((e) => e.kind === "sale")) {
    const order = state.orders.find((o) => o.id === e.orderId)!;
    for (const line of order.lines) {
      if (line.unitCost === null) missingCosts++;
      else cost += line.unitCost * line.quantity;
    }
  }
  // COGS is restored only when returned merchandise actually re-enters inventory.
  for (const e of entries.filter((e) => e.kind === "refund")) {
    const order = state.orders.find((o) => o.id === e.orderId)!;
    if (state.movements.some((m) => m.orderId === order.id && m.delta > 0)) {
      for (const line of order.lines) {
        if (line.unitCost === null) missingCosts++;
        else cost -= line.unitCost * line.quantity;
      }
    }
  }
  const operating = entries
    .filter((e) => ["fee", "shipping", "expense", "reversal"].includes(e.kind))
    .reduce((s, e) => s + e.amount, 0);
  const incoming = entries.reduce((s, e) => s + Math.max(0, e.amount), 0);
  const outgoing = entries.reduce((s, e) => s - Math.min(0, e.amount), 0);
  return {
    revenue,
    incoming,
    outgoing,
    cash: incoming - outgoing,
    cost,
    missingCosts,
    profit: missingCosts ? null : revenue - cost + operating,
    sales: entries.filter((e) => e.kind === "sale").length,
  };
}
