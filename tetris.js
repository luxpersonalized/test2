const scale = 30;
const columns = 10;
const rows = 20;

const colors = [
  null,
  '#ff595e',
  '#ffca3a',
  '#8ac926',
  '#1982c4',
  '#6a4c93',
  '#ff924c',
  '#00c49a',
];

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  switch (type) {
    case 'T':
      return [
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ];
    case 'O':
      return [
        [2, 2],
        [2, 2],
      ];
    case 'L':
      return [
        [0, 3, 0],
        [0, 3, 0],
        [0, 3, 3],
      ];
    case 'J':
      return [
        [0, 4, 0],
        [0, 4, 0],
        [4, 4, 0],
      ];
    case 'I':
      return [
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
        [0, 5, 0, 0],
      ];
    case 'S':
      return [
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0],
      ];
    case 'Z':
      return [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
      ];
    default:
      return [
        [1, 1, 1],
        [0, 1, 0],
        [0, 0, 0],
      ];
  }
}

function init() {
  const canvas = document.getElementById('tetris');
  const scoreElement = document.getElementById('score');
  const linesElement = document.getElementById('lines');
  const levelElement = document.getElementById('level');
  const restartButton = document.getElementById('restart');

  if (!canvas || !scoreElement || !linesElement || !levelElement || !restartButton) {
    console.error(
      'Impossibile inizializzare il gioco: alcuni elementi dell\'interfaccia non sono stati trovati. '
        + 'Assicurati che l\'HTML contenga canvas e pannello con gli id previsti.'
    );
    return;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    console.error('Impossibile ottenere il contesto 2D del canvas.');
    return;
  }

  context.scale(scale, scale);

  const arena = createMatrix(columns, rows);
  const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
    lines: 0,
    level: 0,
    dropInterval: 1000,
    dropCounter: 0,
    queue: [],
  };

  let animationFrameId = null;
  let lastTime = 0;

  function arenaSweep() {
    outer: for (let y = arena.length - 1; y >= 0; y--) {
      for (let x = 0; x < arena[y].length; x++) {
        if (arena[y][x] === 0) {
          continue outer;
        }
      }

      const row = arena.splice(y, 1)[0].fill(0);
      arena.unshift(row);
      y++;

      player.lines++;
      player.score += (player.level + 1) * 100;

      if (player.lines % 10 === 0) {
        player.level++;
        player.dropInterval = Math.max(150, player.dropInterval - 100);
      }
    }
  }

  function collide(arenaMatrix, currentPlayer) {
    const { matrix, pos } = currentPlayer;
    for (let y = 0; y < matrix.length; ++y) {
      for (let x = 0; x < matrix[y].length; ++x) {
        if (
          matrix[y][x] !== 0 &&
          (arenaMatrix[y + pos.y] && arenaMatrix[y + pos.y][x + pos.x]) !== 0
        ) {
          return true;
        }
      }
    }
    return false;
  }

  function merge(arenaMatrix, currentPlayer) {
    currentPlayer.matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          arenaMatrix[y + currentPlayer.pos.y][x + currentPlayer.pos.x] = value;
        }
      });
    });
  }

  function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
      }
    }

    if (dir > 0) {
      matrix.forEach((row) => row.reverse());
    } else {
      matrix.reverse();
    }
  }

  function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
      player.pos.y--;
      merge(arena, player);
      playerReset();
      arenaSweep();
      updateScore();
    }
    player.dropCounter = 0;
  }

  function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
      player.pos.x -= offset;
    }
  }

  function refillQueue() {
    const types = 'ILJOTSZ'.split('');
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    player.queue.push(...types);
  }

  function playerReset() {
    if (player.queue.length < 7) {
      refillQueue();
    }
    player.matrix = createPiece(player.queue.shift());
    player.pos.y = 0;
    player.pos.x = ((columns / 2) | 0) - ((player.matrix[0].length / 2) | 0);
    player.dropCounter = 0;

    if (collide(arena, player)) {
      arena.forEach((row) => row.fill(0));
      player.score = 0;
      player.lines = 0;
      player.level = 0;
      player.dropInterval = 1000;
      player.queue = [];
      refillQueue();
      updateScore();
    }
  }

  function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
      player.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > player.matrix[0].length) {
        rotate(player.matrix, -dir);
        player.pos.x = pos;
        return;
      }
    }
  }

  function hardDrop() {
    while (!collide(arena, player)) {
      player.pos.y++;
    }
    player.pos.y--;
    playerDrop();
  }

  function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          context.fillStyle = colors[value];
          context.fillRect(x + offset.x, y + offset.y, 1, 1);
          context.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          context.strokeRect(x + offset.x, y + offset.y, 1, 1);
        }
      });
    });
  }

  function draw() {
    context.fillStyle = '#111';
    context.fillRect(0, 0, columns, rows);

    drawMatrix(arena, { x: 0, y: 0 });
    if (player.matrix) {
      drawMatrix(player.matrix, player.pos);
    }
  }

  function update(time = 0) {
    const delta = time - lastTime;
    lastTime = time;
    player.dropCounter += delta;
    if (player.dropCounter > player.dropInterval) {
      playerDrop();
    }
    draw();
    animationFrameId = requestAnimationFrame(update);
  }

  function updateScore() {
    scoreElement.textContent = player.score;
    linesElement.textContent = player.lines;
    levelElement.textContent = player.level;
  }

  function startGame() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    arena.forEach((row) => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 0;
    player.dropInterval = 1000;
    player.queue = [];
    player.dropCounter = 0;
    lastTime = 0;
    playerReset();
    updateScore();
    animationFrameId = requestAnimationFrame(update);
  }

  function handleKeyDown(event) {
    switch (event.code) {
      case 'ArrowLeft':
        event.preventDefault();
        playerMove(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        playerMove(1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        playerDrop();
        break;
      case 'ArrowUp':
      case 'KeyX':
        event.preventDefault();
        playerRotate(1);
        break;
      case 'KeyZ':
        event.preventDefault();
        playerRotate(-1);
        break;
      case 'Space':
        event.preventDefault();
        hardDrop();
        break;
      default:
        break;
    }
  }

  restartButton.addEventListener('click', startGame);
  document.addEventListener('keydown', handleKeyDown);

  startGame();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
