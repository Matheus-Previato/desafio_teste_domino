import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, play, draw, passTurn } from '../src/game.js';

// Fixtures declarativas para testar situações específicas da partida.
const deck = Array.from({length:7}, (_, a) =>
    Array.from({length:7-a}, (_, offset) => [a,a+offset])).flat();

function scenario({ hands, stock = [], board = [], turn = 0, consecutivePasses = 0 }) {
    return { ...createGame({deck}), hands: structuredClone(hands), stock: structuredClone(stock),
        board: structuredClone(board), turn, consecutivePasses, status:'playing', winner:null };
}

test('DO01: distribui sete peças a cada jogador e deixa 14 no monte', () => {
    const game = createGame({deck});
    assert.deepEqual(game.hands[0], deck.slice(0,7));
    assert.deepEqual(game.hands[1], deck.slice(7,14));
    assert.deepEqual(game.stock, deck.slice(14));
    assert.deepEqual(game.board, []);
    assert.equal(game.turn, 0);
    assert.equal(game.status, 'playing');
    assert.equal(game.winner, null);
    assert.equal(game.consecutivePasses, 0);
});

test('DO02: as 28 peças são únicas, com valores de zero a seis', () => {
    const game = createGame({deck});
    const all = [...game.hands.flat(), ...game.stock];
    assert.equal(all.length, 28);
    assert.equal(new Set(all.map(tile => tile.join('-'))).size, 28);
    assert.ok(all.every(([a,b]) => a >= 0 && b <= 6 && a <= b));
});

test('DO03: rejeita baralho incompleto, repetido e com peça inválida', () => {
    const duplicate = structuredClone(deck);
    duplicate[27] = duplicate[0];
    const invalid = structuredClone(deck);
    invalid[27] = [6,7];
    for (const badDeck of [deck.slice(1), duplicate, invalid]) {
        assert.throws(() => createGame({deck:badDeck}));
    }
});

test('DO04: jogador zero pode abrir com qualquer peça de sua mão', () => {
    const game = play(createGame({deck}), 3, 'right');
    assert.deepEqual(game.board, [deck[3]]);
    assert.equal(game.hands[0].length, 6);
    assert.equal(game.turn, 1);
});

test('DO05: encaixe à direita conserva a orientação quando já compatível', () => {
    const game = scenario({board:[[2,3]],hands:[[[3,5],[0,0]],[[1,1]]]});
    const next = play(game, 0, 'right');
    assert.deepEqual(next.board, [[2,3],[3,5]]);
    assert.deepEqual(next.hands[0], [[0,0]]);
});

test('DO06: encaixe à direita inverte a peça quando necessário', () => {
    const game = scenario({board:[[2,3]],hands:[[[5,3],[0,0]],[[1,1]]]});
    assert.deepEqual(play(game, 0, 'right').board, [[2,3],[3,5]]);
});

test('DO07: encaixe à esquerda conserva a orientação compatível', () => {
    const game = scenario({board:[[2,3]],hands:[[[5,2],[0,0]],[[1,1]]]});
    assert.deepEqual(play(game, 0, 'left').board, [[5,2],[2,3]]);
});

test('DO08: encaixe à esquerda inverte a peça quando necessário', () => {
    const game = scenario({board:[[2,3]],hands:[[[2,5],[0,0]],[[1,1]]]});
    assert.deepEqual(play(game, 0, 'left').board, [[5,2],[2,3]]);
});

test('DO09: zero e peças duplas participam normalmente dos encaixes', () => {
    const game = scenario({board:[[2,0]],hands:[[[0,0],[1,1]],[[3,3]]]});
    assert.deepEqual(play(game, 0, 'right').board, [[2,0],[0,0]]);
});

test('DO10: peça incompatível é rejeitada e não consome turno', () => {
    const game = scenario({board:[[2,3]],hands:[[[4,5]],[[1,1]]]});
    const before = structuredClone(game);
    assert.throws(() => play(game, 0, 'right'));
    assert.deepEqual(game, before);
});

test('DO11: índice e lado inválidos são rejeitados', () => {
    const game = createGame({deck});
    for (const index of [-1,7,0.5]) assert.throws(() => play(game, index, 'right'));
    assert.throws(() => play(game, 0, 'middle'));
});

test('DO12: sem encaixe compra a primeira peça do monte e mantém o turno', () => {
    const game = scenario({board:[[2,3]],hands:[[[0,0]],[[1,1]]],stock:[[3,6],[4,4]]});
    const next = draw(game);
    assert.deepEqual(next.hands[0], [[0,0],[3,6]]);
    assert.deepEqual(next.stock, [[4,4]]);
    assert.equal(next.turn, 0);
});

test('DO13: proíbe compra quando existe qualquer encaixe na mão', () => {
    const game = scenario({board:[[2,3]],hands:[[[2,6]],[[1,1]]],stock:[[0,0]]});
    assert.throws(() => draw(game));
});

test('DO14: sem encaixe pode comprar sucessivamente até obter peça jogável', () => {
    let game = scenario({board:[[2,3]],hands:[[[0,0]],[[1,1]]],stock:[[4,4],[3,6]]});
    game = draw(game);
    game = draw(game);
    assert.equal(game.hands[0].length, 3);
    assert.equal(game.stock.length, 0);
    assert.deepEqual(play(game, 2, 'right').board, [[2,3],[3,6]]);
});

test('DO15: monte vazio impede compra', () => {
    assert.throws(() => draw(scenario({board:[[2,3]],hands:[[[0,0]],[[1,1]]]})));
});

test('DO16: proíbe passar com peça jogável ou com monte disponível', () => {
    assert.throws(() => passTurn(scenario({board:[[2,3]],hands:[[[2,6]],[[1,1]]]})));
    assert.throws(() => passTurn(scenario({board:[[2,3]],hands:[[[0,0]],[[1,1]]],stock:[[4,4]]})));
});

test('DO17: passar sem encaixe e sem monte alterna o turno', () => {
    const game = passTurn(scenario({board:[[2,3]],hands:[[[0,0]],[[1,1]]]}));
    assert.equal(game.turn, 1);
    assert.equal(game.consecutivePasses, 1);
    assert.equal(game.status, 'playing');
});

test('DO18: jogar uma peça zera a sequência de passes', () => {
    const game = scenario({board:[[2,3]],hands:[[[3,6],[0,0]],[[1,1]]],consecutivePasses:1});
    assert.equal(play(game, 0, 'right').consecutivePasses, 0);
});

test('DO19: esvaziar a mão vence imediatamente', () => {
    const game = play(scenario({board:[[2,3]],hands:[[[3,6]],[[1,1]]]}), 0, 'right');
    assert.equal(game.status, 'won');
    assert.equal(game.winner, 0);
    assert.equal(game.hands[0].length, 0);
});

test('DO20: duas passagens consecutivas encerram com vitória de quem soma menos pontos', () => {
    let game = scenario({board:[[2,3]],hands:[[[0,0]],[[1,1]]]});
    game = passTurn(passTurn(game));
    assert.equal(game.status, 'won');
    assert.equal(game.winner, 0);
});

test('DO21: bloqueio usa soma das pontas, inclusive com quantidades diferentes de peças', () => {
    const game = scenario({board:[[2,3]],hands:[[[0,0],[0,1]],[[4,4]]]});
    assert.equal(passTurn(passTurn(game)).winner, 0);
});

test('DO22: bloqueio empatado termina sem vencedor', () => {
    const game = scenario({board:[[2,3]],hands:[[[1,5]],[[0,6]]]});
    const ended = passTurn(passTurn(game));
    assert.equal(ended.status, 'draw');
    assert.equal(ended.winner, null);
});

test('DO23: ações após encerramento são rejeitadas', () => {
    const game = play(scenario({hands:[[[0,0]],[[1,1]]]}), 0, 'right');
    assert.throws(() => play(game, 0, 'right'));
    assert.throws(() => draw(game));
    assert.throws(() => passTurn(game));
});

test('DO24: baralho e estado recebidos são preservados pelas operações', () => {
    const input = structuredClone(deck);
    const game = createGame({deck:input});
    input[0][0] = 6;
    assert.deepEqual(game.hands[0][0], [0,0]);
    const before = structuredClone(game);
    play(game, 0, 'right');
    assert.deepEqual(game, before);
    const blocked = scenario({board:[[2,3]],hands:[[[0,0]],[[1,1]]],stock:[[4,4]]});
    const snapshot = structuredClone(blocked);
    draw(blocked);
    assert.deepEqual(blocked, snapshot);
});

test('DO25: construtor padrão fornece o conjunto completo duplo-seis', () => {
    const game = createGame();
    assert.deepEqual(game.hands.map(hand => hand.length), [7,7]);
    assert.equal(game.stock.length, 14);
    const all = [...game.hands.flat(), ...game.stock];
    assert.equal(new Set(all.map(([a,b]) => [Math.min(a,b),Math.max(a,b)].join('-'))).size, 28);
});

test('DO26: peça repetida com pontas invertidas também é duplicata', () => {
    const input = structuredClone(deck);
    input[27] = [1,0]; // [0,1] já pertence ao conjunto.
    assert.throws(() => createGame({deck:input}));
});

test('DO27: jogador um pode vencer por esvaziamento e por bloqueio', () => {
    const open = scenario({board:[[2,3]],hands:[[[0,0]],[[3,6]]],turn:1});
    assert.equal(play(open, 0, 'right').winner, 1);
    const blocked = scenario({board:[[2,3]],hands:[[[4,4]],[[0,0]]]});
    assert.equal(passTurn(passTurn(blocked)).winner, 1);
});

test('DO28: passar a vez não altera o estado recebido', () => {
    const game = scenario({board:[[2,3]],hands:[[[0,0]],[[1,1]]]});
    const before = structuredClone(game);
    passTurn(game);
    assert.deepEqual(game, before);
});
