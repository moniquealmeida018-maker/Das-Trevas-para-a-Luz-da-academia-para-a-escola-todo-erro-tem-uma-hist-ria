# Publicação gratuita — GitHub + Cloudflare

Este pacote foi preparado para funcionar fora da hospedagem do ChatGPT. Ele usa:

- GitHub para guardar o código;
- Cloudflare Workers para publicar o site;
- Cloudflare D1 para registrar estudantes, tentativas e respostas;
- senha administrativa e cookie seguro para proteger o painel do professor.

Não é necessário comprar domínio nem assinar plano pago.

## 1. Contas

Crie contas gratuitas em:

- https://github.com/signup
- https://dash.cloudflare.com/sign-up

## 2. Repositório no GitHub

1. No GitHub, selecione **New repository**.
2. Use o nome `das-trevas-para-a-luz`.
3. Marque **Private**.
4. Crie o repositório sem README.
5. Extraia este ZIP no computador.
6. Na página do repositório, escolha **Add file > Upload files**.
7. Envie o conteúdo da pasta extraída, não o ZIP fechado.
8. Confirme em **Commit changes**.

Não envie `node_modules`, `dist`, `.next`, `.wrangler` ou `.dev.vars`.

## 3. Banco D1

1. No painel da Cloudflare, abra **Storage & databases > D1 SQL Database**.
2. Selecione **Create database**.
3. Use exatamente `das-trevas-para-a-luz-db`.
4. Copie o **Database ID** exibido pela Cloudflare.

## 4. Criar as tabelas do banco

Esta etapa pode ser realizada no terminal depois de instalar Node.js 22 ou superior:

```bash
npm install
npx wrangler login
npm run db:migrate:remote
```

O navegador pedirá autorização da conta Cloudflare. A migração cria as tabelas `students`, `attempts`, `answers` e `settings`.

## 5. Conectar o GitHub à Cloudflare

1. Abra **Workers & Pages** na Cloudflare.
2. Selecione **Create application** e a opção de importar um repositório Git.
3. Autorize o GitHub e selecione `das-trevas-para-a-luz`.
4. Defina os comandos:

   - Build command: `npm run build:cloudflare`
   - Deploy command: `npx wrangler deploy --config dist/server/wrangler.json`

5. Nas variáveis de compilação, crie:

   - `D1_DATABASE_ID`: cole o Database ID do passo 3;
   - `CLOUDFLARE_WORKER_NAME`: use `das-trevas-para-a-luz`.

6. Use Node.js 22 ou superior.
7. Inicie a implantação.

## 6. Segredos do painel do professor

Depois que o Worker aparecer no painel:

1. Abra o Worker `das-trevas-para-a-luz`.
2. Entre em **Settings > Variables and Secrets**.
3. Adicione como valores criptografados/secretos:

   - `TEACHER_PASSWORD`: uma senha forte que somente os responsáveis conhecerão;
   - `SESSION_SECRET`: uma sequência aleatória diferente, com pelo menos 40 caracteres.

4. Salve e implante novamente se a Cloudflare solicitar.

Nunca coloque esses valores no GitHub ou em `.dev.vars.example`.

## 7. Ligação do banco ao Worker

Se a implantação não associar o banco automaticamente:

1. Abra **Settings > Bindings** do Worker.
2. Adicione um binding do tipo **D1 database**.
3. Em **Variable name**, use exatamente `DB`.
4. Selecione `das-trevas-para-a-luz-db`.
5. Salve e faça nova implantação.

## 8. Testes obrigatórios

1. Abra o endereço `workers.dev` fornecido pela Cloudflare.
2. Cadastre um aluno de teste.
3. Inicie, responda e conclua um jogo.
4. Feche e reabra o navegador para conferir o progresso.
5. Abra **Sou professor > Abrir painel de progresso**.
6. Entre com `TEACHER_PASSWORD`.
7. Confira tentativas, acertos, erros e filtros.
8. Teste PDF e versão para impressão.
9. Clique em **Sair do painel** e confirme que a senha volta a ser solicitada.

## 9. Atualizações futuras

Edite os arquivos no repositório e confirme um novo commit. A integração da Cloudflare recompilará e publicará a nova versão no mesmo endereço. As atualizações do código não apagam o banco D1.

## 10. Desenvolvimento local opcional

Copie `.dev.vars.example` para `.dev.vars`, preencha valores apenas no computador e execute:

```bash
npm install
npm run build
npm start
```

Para testar o D1 localmente, aplique a migração conforme as orientações técnicas presentes no README do projeto.

## Solução de problemas

- **Erro sobre D1_DATABASE_ID:** confira a variável de compilação na Cloudflare.
- **Painel informa que a senha não foi configurada:** confira `TEACHER_PASSWORD` e `SESSION_SECRET` nos segredos do Worker.
- **Erro de tabela inexistente:** execute `npm run db:migrate:remote`.
- **Jogos abrem, mas o progresso não aparece:** confira se o binding do D1 se chama exatamente `DB`.
- **GitHub recusou algum arquivo:** confirme que `node_modules` e `dist` não foram selecionados.
