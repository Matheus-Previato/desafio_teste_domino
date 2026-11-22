# Dominó — testes como especificação

Repositório de entrega: **`desafio_teste_domino`**.

Total de casos: **28**.

## Colaborador

Matheus Previato Hermenegildo — GitHub [Matheus-Previato](https://github.com/Matheus-Previato). Entrega organizada como trabalho individual. Em uma entrega em dupla, os dois integrantes devem ser identificados e suas contribuições devem existir no histórico do próprio repositório.

## Objetivo da entrega

Este repositório fornece especificação e testes de comportamento em **JavaScript**, para que a implementação também seja produzida em JavaScript a partir deles. O conjunto usa o executor nativo `node:test` e as asserções `node:assert/strict`, com módulos ES.

Os arquivos fornecidos são testes, documentação e configuração de execução. A implementação deverá ser criada em **`src/game.js`**, exportando as funções descritas abaixo. A primeira execução de `npm test` registra `ERR_MODULE_NOT_FOUND` enquanto esse arquivo estiver ausente. Depois de criado o módulo, as asserções especificam os comportamentos que precisam passar.

## Execução

Requer Node.js 22 ou superior. Na raiz do repositório:

```bash
npm run check
npm test
```

`npm run check` valida a sintaxe do arquivo de testes. `npm test` executa os casos, após a implementação existir. As ferramentas usadas pertencem ao próprio Node.js e dispensam dependências de teste externas.

## Convenções do contrato

Os estados são objetos de dados serializáveis, com arrays comuns. As funções que realizam ações recebem o estado e retornam o próximo estado. Devem preservar o objeto recebido e seus arrays internos. Em ações inválidas, devem lançar uma exceção sem modificar o estado. Os testes aceitam qualquer classe de exceção quando usam `assert.throws`.

As funções e os campos abaixo formam a interface observável exigida pelos testes. Campos adicionais podem existir. As fixtures dos testes compõem situações específicas a partir do construtor e substituem campos públicos. A implementação deve tomar decisões com base nesses campos, de forma que as fixtures sejam utilizáveis. Helpers e geradores presentes no arquivo de testes servem à preparação dos cenários e às asserções.

## Especificação do desafio

Partida para **dois jogadores** com conjunto duplo-seis, formado pelas 28 combinações únicas de valores de zero a seis, incluindo duplas. Cada jogador recebe sete peças e as 14 restantes formam o monte.

- O jogador zero abre com qualquer peça de sua mão. Essa convenção fixa quem começa para permitir cenários reproduzíveis.
- Uma peça pode ser encaixada à esquerda ou à direita se uma ponta coincidir com a extremidade correspondente da mesa. A orientação deve ser ajustada automaticamente.
- Após jogar uma peça, a vez passa ao adversário e o contador de passes consecutivos volta a zero.
- Quando não possui nenhuma peça jogável, o jogador compra a primeira peça do monte. A compra mantém a vez e pode ser repetida até obter encaixe ou esgotar o monte.
- Com monte vazio e sem encaixe, é permitido passar. Dois passes consecutivos encerram por bloqueio.
- Esvaziar a mão vence imediatamente. No bloqueio, vence quem possui a menor soma de pontos nas pontas das peças restantes. Somatórios iguais resultam em empate.
- A partida é uma rodada única. Não há pontuação acumulada de rodadas.

### Interface exigida

| Exportação | Contrato |
|---|---|
| `createGame(options = {})` | Usa o conjunto duplo-seis. Aceita `deck` para ordem explícita das 28 peças. Os índices 0..6 vão ao jogador zero, 7..13 ao jogador um e 14..27 ao monte. Na ausência de `deck`, pode embaralhar o conjunto. |
| `play(game, handIndex, side)` | Joga peça da mão do jogador da vez. `side` é `left` ou `right`. Na mesa vazia, preserva a orientação da peça escolhida. |
| `draw(game)` | Compra a primeira peça do monte somente quando não existe encaixe na mão. |
| `passTurn(game)` | Passa apenas com monte vazio e sem encaixe. Avalia o bloqueio após o segundo passe. |

O estado contém `hands`, array com as duas mãos, `stock`, `board`, `turn`, `consecutivePasses`, `status` (`playing`, `won`, `draw`) e `winner` (`null`, `0` ou `1`). Uma peça é `[a,b]`. Na mesa, peças sucessivas devem ter as pontas adjacentes iguais. A esquerda da mesa é `board[0][0]` e a direita é o segundo valor da última peça.

Peças com pontas invertidas representam a mesma peça para validar a unicidade do baralho. O construtor copia o baralho recebido. As fixtures representam trechos de partidas e podem omitir peças já irrelevantes ao cenário. Ações devem operar sobre os campos públicos da fixture, sem exigir a reconstrução de todo o histórico.

## Funcionamento dos casos de teste

Cada caso usa `test(...)` para preparar um estado, realizar uma ação e comparar o resultado esperado com `assert`. Os identificadores abaixo correspondem aos nomes executados pelo Node.js.

| Caso | Comportamento verificado |
|---|---|
| DO01 | Distribui sete peças a cada jogador e deixa 14 no monte |
| DO02 | As 28 peças são únicas, com valores de zero a seis |
| DO03 | Rejeita baralho incompleto, repetido e com peça inválida |
| DO04 | Jogador zero pode abrir com qualquer peça de sua mão |
| DO05 | Encaixe à direita conserva a orientação quando já compatível |
| DO06 | Encaixe à direita inverte a peça quando necessário |
| DO07 | Encaixe à esquerda conserva a orientação compatível |
| DO08 | Encaixe à esquerda inverte a peça quando necessário |
| DO09 | Zero e peças duplas participam normalmente dos encaixes |
| DO10 | Peça incompatível é rejeitada e não consome turno |
| DO11 | Índice e lado inválidos são rejeitados |
| DO12 | Sem encaixe compra a primeira peça do monte e mantém o turno |
| DO13 | Proíbe compra quando existe qualquer encaixe na mão |
| DO14 | Sem encaixe pode comprar sucessivamente até obter peça jogável |
| DO15 | Monte vazio impede compra |
| DO16 | Proíbe passar com peça jogável ou com monte disponível |
| DO17 | Passar sem encaixe e sem monte alterna o turno |
| DO18 | Jogar uma peça zera a sequência de passes |
| DO19 | Esvaziar a mão vence imediatamente |
| DO20 | Duas passagens consecutivas encerram com vitória de quem soma menos pontos |
| DO21 | Bloqueio usa soma das pontas, inclusive com quantidades diferentes de peças |
| DO22 | Bloqueio empatado termina sem vencedor |
| DO23 | Ações após encerramento são rejeitadas |
| DO24 | Baralho e estado recebidos são preservados pelas operações |
| DO25 | Construtor padrão fornece o conjunto completo duplo-seis |
| DO26 | Peça repetida com pontas invertidas também é duplicata |
| DO27 | Jogador um pode vencer por esvaziamento e por bloqueio |
| DO28 | Passar a vez não altera o estado recebido |

## Orientação para implementar a partir dos testes

1. Leia as regras, o contrato e todos os casos em `tests/game.test.js`.
2. Crie `src/game.js` como módulo ES e exporte a interface exigida.
3. Execute `npm test`, implemente cada comportamento e repita até todos os casos passarem.
4. Preserve os testes, os resultados esperados e as regras declaradas. Testes adicionais podem ser acrescentados para comportamentos novos compatíveis.
5. Uma interface visual pode usar as funções do módulo depois que as regras estiverem corretas.

## Estado da verificação desta entrega

A sintaxe dos testes foi verificada com Node.js. A execução na ausência de `src/game.js` foi conferida e apresenta a falha de importação esperada. A aprovação dos casos depende da implementação futura. A contagem de casos descreve o conjunto de especificações entregue.

## Entrega no GitHub

Crie um repositório público com o nome exato **`desafio_teste_domino`**. Extraia o pacote e envie o conteúdo desta pasta para a raiz do repositório. O `README.md`, o `package.json` e a pasta `tests` devem aparecer diretamente nessa raiz.

O código dos testes fica em `tests/game.test.js`. O módulo futuro esperado fica em `src/game.js`.

Para uma dupla, cada integrante deve enviar suas próprias contribuições pelo GitHub e constar na seção de colaboradores. O histórico de alterações é o registro das contribuições.
