# ÁGUA LIMPA BEACHWEAR — front-end da loja

## Objetivo

Criar uma loja de beachwear feminina completa, responsiva e navegável, fiel aos logotipos anexados e à paleta informada. Toda a experiência será visual e local, preparada para futura integração, sem pagamentos, login ou banco de dados reais.

## Identidade visual

- Aplicar exatamente: areia creme `#F5EEE5`, areia rosada `#E8CBBB`, turquesa `#8FD7D4`, turquesa claro `#C9EFEB`, turquesa profundo `#4CA7A7`, marrom elegante `#7A553F`, marrom suave `#AA866F` e branco espuma `#FFFDF9`.
- Usar creme como fundo, branco espuma nas áreas claras, marrom nos textos e turquesa profundo nas ações.
- Reaproveitar os logotipos, monograma e selo anexados, sem redesenhá-los.
- Tipografia serifada sofisticada nos títulos, tipografia limpa nos textos, espaços amplos e transições discretas.
- Evitar roxo, azul escuro, preto dominante, neon, saturação excessiva, gradientes fortes e sombras pesadas.

## Páginas e navegação

1. **Início**
   - Cabeçalho fixo, menu completo, busca, conta, sacola e menu móvel.
   - Imagem principal praiana, categorias, destaques, faixa promocional, manifesto “SOL • MAR • LIBERDADE”, newsletter e rodapé.
2. **Coleção e categorias**
   - Páginas separadas para coleção, biquínis, maiôs, saídas e acessórios.
   - Breadcrumb, filtros locais por tamanho/cor/preço, ordenação e grade responsiva.
3. **Produto**
   - Galeria, descrição, preço, parcelamento, seletores de tamanho/cor, quantidade, compra e informações de troca, entrega e cuidados.
4. **Sacola**
   - Itens, variações, quantidades, remoção, cupom, simulação visual de frete, subtotal e avanço ao checkout.
5. **Checkout visual**
   - Etapas de identificação, endereço, entrega e pagamento, com resumo do pedido e sem cobrança real.
6. **Nossa história**
   - História da marca, conceito, imagem de praia, selo e monograma.

## Interações

- Busca funcional sobre o catálogo fictício.
- Filtros e ordenação funcionando no navegador.
- Sacola persistente durante a navegação, com estados vazio e preenchido.
- Menu móvel, seletores, quantidade, cupom e frete com retornos visuais.
- Estados de carregamento, vazio e erro nos pontos adequados.
- Navegação por teclado, foco visível, textos alternativos e contraste acessível.

## Conteúdo e imagens

- Usar dados fictícios coerentes para produtos, preços, cores e descrições.
- Criar uma pequena coleção coesa de imagens de moda praia e litoral, evitando aparência genérica de banco de imagens.
- Preservar os arquivos de marca anexados como elementos centrais da interface.

## Estrutura técnica

- Criar componentes reutilizáveis para cabeçalho, rodapé, produto, filtros, busca e sacola.
- Manter cada tela em sua própria página.
- Centralizar os tokens visuais no CSS e aplicar nomes semânticos em toda a interface.
- Adicionar títulos e descrições próprios para compartilhamento e busca em cada página.
- Validar em desktop e celular, incluindo navegação, filtros, busca e fluxo da sacola ao checkout.

## Fora do escopo

- Banco de dados, autenticação, painel administrativo, estoque real, pedidos reais e integração de pagamento.
