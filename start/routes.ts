import Route from '@ioc:Adonis/Core/Route'

// ------------------- Mostra que site tá funcionando. -------------------
Route.get('/', 'LinkController.index');

// ------------------- Criação de um novo link pelo método POST. -------------------
Route.post('/new', 'LinkController.postNew').middleware('auth');

// ------------------- Deleta um link pelo método POST. -------------------
Route.post('/del', 'LinkController.postDel').middleware('auth');

// ------------------- Get todos os links. -------------------
Route.get('/all', 'LinkController.getAll').middleware('auth');

// ------------------- Pega o link pelo código e se achar, redireciona para a URL do link. -------------------
Route.get('/:codigo', 'LinkController.redirectToLink');

// ------------------- Pega o token pelo método post, precisando de uma authorization valida. -------------------
Route.post('/login', 'LinkController.getToken');