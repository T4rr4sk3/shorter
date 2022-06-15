# shorter
API em node que cria links curtos para redirecionamento de sites por código da URL.

### motivo:
Feito como back-end para uma ferramenta customizada a fim de criar e gerenciar links de redirecionamento (conhecidos como links curtos).

#### dados
Funciona com dois tipos de banco de dados: SQLServer e MySQL, ambos configuráveis pelo arquivo *.env*. Comandos sql são feitos em mysql e adaptados para o sqlserver (quando possível) ou apenas mudam de acordo com o tipo de sql. Feito de forma básica, sem muito aprofundamento. É necessário possuir a tabela disponível de antemão para o funcionamento da API, no caso do MySQL, a tabela se chama ***link***, já no SQLServer, foi posto como ***dbo.link***. No futuro isso também será customizável (talvez pelo *.env*).

#### segurança
Conta com método de autenticação utilizando um token JWT para fazer as operações de CRUD. Talvez mude no futuro a forma de pegar o token para a comunicação entre o cliente e o servidor, mas por enquanto apenas um usuário e senha é permitido junto a um *salt* secreto, que só deve ser passado para os sistemas que precisam usar esta API. Configurado no próprio *.env*.

#### coisas a fazer:
- [ ] Rota para apagar um link da lista (com autorização)
- [x] Paralelização com mysql (muitas requisições ao mesmo tempo não devem gerar nenhum erro)
- [x] Customizar nome da tabela (para não ficar algo estático)
- [x] Opção de criar a tabela no banco no início da aplicação, caso a mesma não exista
- [ ] Deixar configurações do banco opcionais e validar de acordo com o tipo de sql escolhido (assim não será necessário ter configuração para os dois tipos de sql, apenas para aquele escolhido no *.env*)
- [ ] Criar logs de acordo com a data atual, para que possa ser separado logs novos dos antigos (e melhorar a gestão de espaço por permitir apagar logs que não serão mais úteis)

#### Notas
Quando a variável de ambiente **CREATE** for *true*, o app tentará acessar o arquivo definido no *.env* (dependendo do tipo de sql) e ler ele em forma de texto e executar o script direto no banco. Guarde este arquivo em um lugar secreto e, espero que seu .env esteja num lugar seguro, porque se não... Variáveis de script para criar o banco são opcionais, podendo estar em branco, desde que **CREATE** seja *false*.