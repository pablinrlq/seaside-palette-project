import test from "node:test";
import assert from "node:assert/strict";
import { initialState, applyCommand, metrics, businessDate } from "../src/lib/management.ts";
const p = {
  id: "p1",
  slug: "teste",
  name: "Produto de teste",
  category: "Maiôs",
  price: 100,
  image: "/test.jpg",
  color: "Verde",
  sizes: ["P", "M"],
  description: "",
  stock: 5,
  featured: false,
};
const seed = () => initialState([structuredClone(p)], ["Maiôs"]);
const op = (state, command, id = crypto.randomUUID(), at = "2026-09-19T15:00:00.000Z") =>
  applyCommand(state, command, id, at);
const order = (state, quantity = 2) =>
  op(state, {
    type: "order",
    customer: { name: "Teste", email: "teste@example.com", phone: "" },
    lines: [{ productId: "p1", size: "M", quantity }],
    shipping: 1000,
    discount: 0,
    note: "",
  });
test("payment is atomic, stock moves once and duplicate request is idempotent", () => {
  let s = order(seed());
  const original = structuredClone(s);
  const id = crypto.randomUUID();
  s = op(s, { type: "payment", orderId: s.orders[0].id, fees: 500, shippingCost: 1000 }, id);
  assert.equal(s.products[0].stock, 3);
  assert.equal(s.ledger.length, 3);
  assert.equal(
    op(s, { type: "payment", orderId: s.orders[0].id, fees: 500, shippingCost: 1000 }, id),
    s,
  );
  assert.throws(
    () => op(s, { type: "payment", orderId: s.orders[0].id, fees: 0, shippingCost: 0 }),
    /aguarda/,
  );
  assert.deepEqual(original.products[0].stock, 5);
});
test("stock failure rolls back all lines and financial entries", () => {
  let s = order(seed(), 5);
  s = op(s, {
    type: "inventory",
    productId: "p1",
    delta: -1,
    reason: "Avaria",
    purchase: false,
    unitCost: null,
  });
  const before = structuredClone(s);
  assert.throws(
    () => op(s, { type: "payment", orderId: s.orders[0].id, fees: 0, shippingCost: 0 }),
    /insuficiente/,
  );
  assert.deepEqual(s, before);
});
test("pending orders do not affect revenue; unknown costs do not invent profit", () => {
  let s = order(seed());
  assert.equal(metrics(s).revenue, 0);
  s = op(s, { type: "payment", orderId: s.orders[0].id, fees: 0, shippingCost: 0 });
  assert.equal(metrics(s).profit, null);
  assert.equal(metrics(s).missingCosts, 1);
});
test("stock purchases affect cash, not profit twice; refund restores COGS only with restock", () => {
  let s = op(seed(), {
    type: "inventory",
    productId: "p1",
    delta: 1,
    reason: "Compra",
    purchase: true,
    unitCost: 4000,
  });
  s = order(s);
  const id = s.orders[0].id;
  s = op(s, { type: "payment", orderId: id, fees: 500, shippingCost: 1000 });
  s = op(s, { type: "expense", amount: 2000, category: "Marketing", description: "Campanha" });
  assert.equal(metrics(s).profit, 9500);
  assert.equal(metrics(s).cash, 13500);
  const returned = op(s, { type: "refund", orderId: id, restock: true, reason: "Devolvido" });
  assert.equal(returned.products[0].stock, 6);
  assert.equal(metrics(returned).profit, -3500);
  assert.throws(
    () => op(returned, { type: "refund", orderId: id, restock: true, reason: "Duplicado" }),
    /reembolsado/,
  );
  const notReturned = op(s, { type: "refund", orderId: id, restock: false, reason: "Extravio" });
  assert.equal(metrics(notReturned).profit, -11500);
});
test("expenses are corrected with an audit entry, never deleted", () => {
  let s = op(seed(), { type: "expense", amount: 1000, category: "Outros", description: "Despesa" });
  const id = s.ledger[0].id;
  s = op(s, { type: "reverseExpense", entryId: id, reason: "Lançamento incorreto" });
  assert.equal(s.ledger.length, 2);
  assert.equal(metrics(s).cash, 0);
  assert.throws(
    () => op(s, { type: "reverseExpense", entryId: id, reason: "Outra" }),
    /já estornada/,
  );
});
test("invalid transitions and malformed amounts fail", () => {
  let s = order(seed());
  assert.throws(
    () => op(s, { type: "fulfill", orderId: s.orders[0].id, tracking: "123" }),
    /pagamento/,
  );
  assert.throws(() =>
    op(s, { type: "expense", amount: -1, category: "Outros", description: "Teste" }),
  );
  assert.throws(() => order(seed(), 6), /insuficiente/);
  s = op(s, { type: "cancel", orderId: s.orders[0].id });
  assert.equal(s.products[0].stock, 5);
  assert.equal(s.ledger.length, 0);
  assert.throws(() =>
    op(s, { type: "payment", orderId: s.orders[0].id, fees: 0, shippingCost: 0 }),
  );
});
test("catalog validation protects images, duplicates and stock edits", () => {
  assert.throws(() =>
    op(seed(), { type: "product", product: { ...p, image: "javascript:alert(1)" }, cost: null }),
  );
  assert.throws(
    () => op(seed(), { type: "product", product: { ...p, stock: 50 }, cost: null }),
    /aba Estoque/,
  );
  assert.throws(
    () => op(seed(), { type: "product", product: { ...p, id: "p2" }, cost: null }),
    /Slug/,
  );
  assert.throws(() => op(seed(), { type: "archive", productId: "p1" }), /Zere/);
  const s = order(seed());
  assert.throws(
    () => op(s, { type: "importCatalog", products: [p], categories: ["Maiôs"] }),
    /primeira/,
  );
});
test("daily reports use Sao Paulo date and preserve original cost snapshots", () => {
  assert.equal(businessDate("2026-09-20T01:00:00Z"), "2026-09-19");
  let s = op(seed(), { type: "product", product: p, cost: 4000 });
  s = order(s);
  s = op(
    s,
    { type: "payment", orderId: s.orders[0].id, fees: 0, shippingCost: 0 },
    crypto.randomUUID(),
    "2026-09-20T01:00:00Z",
  );
  assert.equal(metrics(s, "2026-09-19", "2026-09-19").revenue, 21000);
  assert.equal(metrics(s, "2026-09-20", "2026-09-20").revenue, 0);
  s = op(s, { type: "product", product: s.products[0], cost: 6000 });
  assert.equal(s.orders[0].lines[0].unitCost, 4000);
});
