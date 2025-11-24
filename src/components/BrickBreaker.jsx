import { useState, useEffect, useCallback, useRef } from 'react';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 400;
const PADDLE_WIDTH = 75;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 55;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 5;
const BRICK_OFFSET_TOP = 30;
const BRICK_OFFSET_LEFT = 15;

function BrickBreaker() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const gameState = useRef({
    paddle: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, dx: 0 },
    ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, dx: 2, dy: -2 },
    bricks: [],
    keys: { left: false, right: false }
  });

  const initBricks = useCallback(() => {
    const bricks = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      bricks[r] = [];
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks[r][c] = { x: 0, y: 0, status: 1 };
      }
    }
    return bricks;
  }, []);

  const resetGame = () => {
    gameState.current = {
      paddle: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, dx: 0 },
      ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 30, dx: 2, dy: -2 },
      bricks: initBricks(),
      keys: { left: false, right: false }
    };
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setGameStarted(true);
  };

  useEffect(() => {
    gameState.current.bricks = initBricks();
  }, [initBricks]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        resetGame();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        gameState.current.keys.left = true;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        gameState.current.keys.right = true;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft') {
        gameState.current.keys.left = false;
      } else if (e.key === 'ArrowRight') {
        gameState.current.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted || gameOver || gameWon) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawBall = () => {
      ctx.beginPath();
      ctx.arc(gameState.current.ball.x, gameState.current.ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0f0';
      ctx.fill();
      ctx.closePath();
    };

    const drawPaddle = () => {
      ctx.beginPath();
      ctx.rect(gameState.current.paddle.x, CANVAS_HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillStyle = '#f0f000';
      ctx.fill();
      ctx.closePath();
    };

    const drawBricks = () => {
      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          if (gameState.current.bricks[r][c].status === 1) {
            const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
            const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
            gameState.current.bricks[r][c].x = brickX;
            gameState.current.bricks[r][c].y = brickY;
            ctx.beginPath();
            ctx.rect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT);
            ctx.fillStyle = `hsl(${r * 40}, 70%, 50%)`;
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    };

    const collisionDetection = () => {
      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          const b = gameState.current.bricks[r][c];
          if (b.status === 1) {
            if (
              gameState.current.ball.x > b.x &&
              gameState.current.ball.x < b.x + BRICK_WIDTH &&
              gameState.current.ball.y > b.y &&
              gameState.current.ball.y < b.y + BRICK_HEIGHT
            ) {
              gameState.current.ball.dy = -gameState.current.ball.dy;
              b.status = 0;
              setScore(s => s + 10);
              
              if (gameState.current.bricks.flat().every(brick => brick.status === 0)) {
                setGameWon(true);
              }
            }
          }
        }
      }
    };

    const update = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      drawBricks();
      drawBall();
      drawPaddle();
      collisionDetection();

      // Ball movement
      gameState.current.ball.x += gameState.current.ball.dx;
      gameState.current.ball.y += gameState.current.ball.dy;

      // Ball collision with walls
      if (gameState.current.ball.x + BALL_RADIUS > CANVAS_WIDTH || gameState.current.ball.x - BALL_RADIUS < 0) {
        gameState.current.ball.dx = -gameState.current.ball.dx;
      }
      if (gameState.current.ball.y - BALL_RADIUS < 0) {
        gameState.current.ball.dy = -gameState.current.ball.dy;
      }

      // Ball collision with paddle
      if (
        gameState.current.ball.y + BALL_RADIUS > CANVAS_HEIGHT - PADDLE_HEIGHT - 10 &&
        gameState.current.ball.x > gameState.current.paddle.x &&
        gameState.current.ball.x < gameState.current.paddle.x + PADDLE_WIDTH
      ) {
        gameState.current.ball.dy = -gameState.current.ball.dy;
      }

      // Ball falls below paddle
      if (gameState.current.ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
        setGameOver(true);
      }

      // Paddle movement
      if (gameState.current.keys.right && gameState.current.paddle.x < CANVAS_WIDTH - PADDLE_WIDTH) {
        gameState.current.paddle.x += 5;
      } else if (gameState.current.keys.left && gameState.current.paddle.x > 0) {
        gameState.current.paddle.x -= 5;
      }
    };

    const gameLoop = setInterval(update, 1000 / 60);
    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, gameWon]);

  return (
    <div className="game-content">
      <h1>Brick Breaker</h1>
      <p className="score">Score: {score}</p>
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas"
        />
        {!gameStarted && !gameOver && !gameWon && (
          <div className="game-message">
            <p>Press ← or → to start</p>
            <p style={{ fontSize: '0.8em' }}>Use arrow keys to move paddle</p>
          </div>
        )}
        {gameOver && (
          <div className="game-message">
            <p>Game Over!</p>
            <button onClick={resetGame}>Play Again</button>
          </div>
        )}
        {gameWon && (
          <div className="game-message">
            <p>You Win!</p>
            <button onClick={resetGame}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrickBreaker;
