# Evolução da loja e painel administrativo local

## Objetivo
Transformar a experiência atual em uma loja mais rica, editorial e envolvente, com excelente uso no celular, além de criar um painel administrativo funcional sem banco de dados nesta etapa.

## Loja
- Reestruturar a página inicial com mais profundidade visual: destaques editoriais, categorias, benefícios, coleção em evidência, manifesto e newsletter com confirmação visível.
- Refinar cabeçalho, navegação móvel, busca e rodapé para facilitar compras em telas pequenas.
- Melhorar vitrines e cartões de produto com etiquetas, estoque, ações rápidas e estados mais claros.
- Preservar exatamente a paleta e os logotipos fornecidos, usando creme, branco e marrom como base e turquesa como destaque.
- Revisar produto, sacola e checkout para uma jornada móvel mais confortável e consistente.

## Painel administrativo
- Criar uma área `/admin` com visão geral de produtos, categorias, estoque baixo e valor do catálogo.
- Permitir adicionar, editar, duplicar e excluir produtos.
- Permitir alterar nome, preço, descrição, categoria, cor, tamanhos, estoque, destaque e imagem por URL.
- Permitir criar, renomear e excluir categorias, com proteção para categorias ainda usadas por produtos.
- Incluir busca, filtros, confirmação de exclusão, mensagens de sucesso e visualização do estoque.
- Persistir todas as alterações no próprio navegador e refletir as mudanças imediatamente na loja.
- Incluir exportação e importação em JSON para facilitar a futura migração ao banco de dados.

## Base técnica
- Centralizar catálogo, categorias e estoque em um provedor local reutilizável, mantendo a sacola existente.
- Não adicionar login, banco de dados, pagamentos reais ou serviços externos agora.
- Deixar a estrutura organizada para que a persistência local seja substituída posteriormente pelo banco.
- Adicionar metadados próprios à nova página administrativa.

## Validação
- Conferir a loja e o painel em desktop e celular.
- Testar criação, edição, exclusão, categorias, estoque, busca, newsletter, sacola e avanço do checkout.
- Verificar ausência de sobreposições, textos cortados e controles difíceis de tocar.
