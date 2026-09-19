# Painel administrativo

## O que funciona

- /admin separado da vitrine, com visão geral, pedidos, produtos, estoque, financeiro, clientes e configurações.
- Autenticação no servidor; cookie HttpOnly e SameSite=Strict, duração de 8 horas, Secure em HTTPS.
- Pedidos manuais com cliente, tamanhos, quantidades, frete, desconto, observações/endereço e histórico.
- Confirmação manual do recebimento gera baixa de estoque e lançamentos de venda, taxa e frete na mesma transação.
- Envio com rastreio, cancelamento de pendentes e registro de reembolso total com reposição opcional.
- Compras de estoque, ajustes com motivo, despesas e estornos sem apagar o histórico.
- Custo capturado na confirmação do pagamento. Vendas sem custo deixam o resultado como "Custos pendentes".
- Relatórios por data de São Paulo, exportação CSV e backups JSON.
- Catálogo público sincronizado a partir do servidor, sem expor custos, pedidos ou dados pessoais.

O painel NÃO cobra nem reembolsa dinheiro. As confirmações são registros de operações verificadas fora do site.
O checkout público continua desabilitado, sem criar pedidos fictícios.

## Desenvolvimento local

Use Node 22.18+ (ou Node 24) e execute pnpm dev. Ao acessar /admin, o servidor cria:

- .data/admin-credentials.json: senha local aleatória e segredo de sessão, com permissão 0600.
- .data/store.json: catálogo, pedidos e movimentações, após a primeira alteração.

Esses arquivos estão fora do Git. Não os publique nem os envie a terceiros.
A senha antiga que ficava no JavaScript do navegador deixou de ser usada.
Somente o servidor de desenvolvimento permite persistência em arquivo.
Uma instalação de produção sem configuração bloqueia a administração com HTTP 503.

O catálogo antigo de localStorage pode ser migrado explicitamente em Configurações, antes da primeira
movimentação. O sistema não importa dados automaticamente nem substitui uma operação já iniciada.
O carrinho continua local ao navegador.

## Conectar Supabase na hospedagem

1. Criar ou selecionar o projeto Supabase.
2. Executar supabase/migrations/202609190001_management.sql no SQL Editor.
3. Cadastrar somente no ambiente do servidor:
   - SUPABASE_URL: URL HTTPS do projeto.
   - SUPABASE_SERVICE_ROLE_KEY: chave secreta service_role; nunca usar no frontend.
   - ADMIN_PASSWORD: senha forte e exclusiva com pelo menos 14 caracteres.
   - ADMIN_SESSION_SECRET: segredo aleatório com pelo menos 32 caracteres.
4. Publicar/reiniciar a aplicação com suporte ao servidor TanStack Start/Nitro.
5. Abrir /admin e conferir "Supabase conectado" em Configurações.
6. Confirmar em uma janela anônima que /api/admin/state retorna 401 e que /api/catalog não expõe custos.
7. Configurar limite de tentativas na borda da hospedagem para /api/admin/login.

Não prefixar nenhuma chave com VITE_. Em desenvolvimento, exporte as variáveis no processo
que executa Vite; copiar .env.example sozinho não garante que o runtime carregue segredos.

A migração usa RLS e não concede acesso a anon ou authenticated. Apenas service_role pode ler
ou confirmar a gestão. O controle de revisão na função SQL evita sobrescrever alterações concorrentes.
A confirmação grava estoque, pedido, caixa e identificador idempotente no mesmo documento/transação.

Documentação oficial:

- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Funções de banco](https://supabase.com/docs/guides/database/functions)
- [Proteção da API](https://supabase.com/docs/guides/api/securing-your-api)

Sem as credenciais do projeto, a migração e o acesso remoto ainda não foram executados/validados.
Sincronizar o GitHub não substitui configurar segredos e publicar na hospedagem.

## Operação e limites

- Estoque é agregado por produto e compartilhado entre tamanhos; não é um estoque por SKU.
- Pedidos pendentes não reservam unidades. A confirmação revalida disponibilidade.
- Reembolso é total; taxas e frete pagos não são devolvidos automaticamente.
- Custo desconhecido no momento da venda não é preenchido retroativamente ao editar o produto.
- Receita líquida aqui significa vendas menos reembolsos; impostos devem ser registrados como despesas.
- Resultado é uma estimativa gerencial após CMV, taxas, frete e despesas. Não substitui contabilidade.
- Compra de estoque afeta caixa; CMV afeta resultado, evitando dupla dedução.
- Variação de caixa não é saldo bancário: não inclui saldos iniciais, recebíveis ou conciliação.
- Clientes são agrupados por e-mail ou telefone; sem contato, pedidos ficam separados.
- Uma única conta administrativa. Para equipe, adotar Supabase Auth com usuários, perfis e auditoria por pessoa.
- O limitador de login embutido é por instância. A proteção distribuída deve ser configurada na hospedagem.
- Banco em documento único atende uma operação pequena. Para grande volume, migrar a tabelas relacionais,
  paginação e agregações SQL; não carregar todo o histórico no navegador.
- Backup completo é exportado; restauração integral deve ser administrada no banco, não pela importação de catálogo.
- Testes financeiros são isolados em .data/verification; não aparecem na loja local principal.

## Próxima integração: Stripe

Antes de liberar pagamentos reais:

- Criar sessão/intenção no servidor com preços recalculados, disponibilidade e referência do pedido.
- Usar Stripe Elements/Payment Element na página interna, com a chave pública apenas no frontend.
- Validar assinatura do webhook com o SDK oficial, usando o corpo bruto e o segredo do endpoint.
- Aplicar confirmação uma única vez por evento/pagamento, usando a transação e a idempotência existentes.
- Tratar pagamentos assíncronos, cancelamentos, disputas, reembolsos parciais, taxas e conciliação.
- Não marcar pedido como pago por redirecionamento ou resposta do navegador.
- Revisar frete real, políticas da loja, LGPD e testes em modo sandbox antes de produção.

Nenhuma chave Stripe, webhook ou cobrança está ativa nesta entrega.

## Verificação

pnpm test executa os testes de domínio: idempotência, baixa atômica, estoque insuficiente,
transições, devoluções, despesas, custos, importação e datas no fuso da loja.
Também executar pnpm lint, pnpm exec tsc --noEmit e pnpm build.

Foram exercitados no Chromium: autenticação/API, CSRF, pedidos, confirmação, envio, persistência,
revisão concorrente, catálogo sem dados privados, logout e sete abas de 320 a 1440 px.
Regressão da vitrine: busca, filtros, tamanhos, carrinho, checkout, zoom e menu mobile.
Ajustes para iPhone: inputs de 16 px em telas de toque, alvos de 44 px no painel, safe areas,
diálogos limitados por 100dvh e rolagem horizontal restrita às tabelas e navegação.
WebKit foi baixado, mas não executou por ausência de bibliotecas de sistema.
A validação em Safari/iPhone físico ainda é necessária.
