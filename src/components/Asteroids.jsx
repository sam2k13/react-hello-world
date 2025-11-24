import { useState, useEffect, useRef } from 'react';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const SHIP_SIZE = 15;
const ROTATION_SPEED = 0.1;
const THRUST = 0.15;
const FRICTION = 0.99;

function Asteroids() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const gameState = useRef({
    ship: {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      angle: 0,
      vx: 0,
      vy: 0
    },
    asteroids: [],
    bullets: [],
    keys: { left: false, right: false, up: false, down: false }
  });

  const createAsteroid = (x, y, size) => ({
    x: x || Math.random() * CANVAS_WIDTH,
    y: y || Math.random() * CANVAS_HEIGHT,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    size: size || 40,
    angle: Math.random() * Math.PI * 2
  });

  const resetGame = () => {
    gameState.current = {
      ship: {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        angle: 0,
        vx: 0,
        vy: 0
      },
      asteroids: Array(5).fill().map(() => createAsteroid()),
      bullets: [],
      keys: { left: false, right: false, up: false, down: false }
    };
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  useEffect(() => {
    gameState.current.asteroids = Array(5).fill().map(() => createAsteroid());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted && e.key.startsWith('Arrow')) {
        resetGame();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        gameState.current.keys.left = true;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        gameState.current.keys.right = true;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        gameState.current.keys.up = true;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Shoot bullet
        if (gameStarted && !gameOver) {
          gameState.current.bullets.push({
            x: gameState.current.ship.x,
            y: gameState.current.ship.y,
            vx: Math.cos(gameState.current.ship.angle) * 5,
            vy: Math.sin(gameState.current.ship.angle) * 5,
            life: 60
          });
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowLeft') {
        gameState.current.keys.left = false;
      } else if (e.key === 'ArrowRight') {
        gameState.current.keys.right = false;
      } else if (e.key === 'ArrowUp') {
        gameState.current.keys.up = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawShip = () => {
      const { x, y, angle } = gameState.current.ship;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(SHIP_SIZE, 0);
      ctx.lineTo(-SHIP_SIZE, -SHIP_SIZE / 2);
      ctx.lineTo(-SHIP_SIZE / 2, 0);
      ctx.lineTo(-SHIP_SIZE, SHIP_SIZE / 2);
      ctx.closePath();
      ctx.strokeStyle = '#00f0f0';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };

    const drawAsteroid = (asteroid) => {
      ctx.beginPath();
      ctx.arc(asteroid.x, asteroid.y, asteroid.size, 0, Math.PI * 2);
      ctx.strokeStyle = '#f0f000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
    };

    const drawBullet = (bullet) => {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0000';
      ctx.fill();
      ctx.closePath();
    };

    const checkCollision = (x1, y1, r1, x2, y2, r2) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < r1 + r2;
    };

    const wrapPosition = (obj) => {
      if (obj.x > CANVAS_WIDTH) obj.x = 0;
      if (obj.x < 0) obj.x = CANVAS_WIDTH;
      if (obj.y > CANVAS_HEIGHT) obj.y = 0;
      if (obj.y < 0) obj.y = CANVAS_HEIGHT;
    };

    const update = () => {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Update ship
      if (gameState.current.keys.left) {
        gameState.current.ship.angle -= ROTATION_SPEED;
      }
      if (gameState.current.keys.right) {
        gameState.current.ship.angle += ROTATION_SPEED;
      }
      if (gameState.current.keys.up) {
        gameState.current.ship.vx += Math.cos(gameState.current.ship.angle) * THRUST;
        gameState.current.ship.vy += Math.sin(gameState.current.ship.angle) * THRUST;
      }

      gameState.current.ship.vx *= FRICTION;
      gameState.current.ship.vy *= FRICTION;
      gameState.current.ship.x += gameState.current.ship.vx;
      gameState.current.ship.y += gameState.current.ship.vy;
      wrapPosition(gameState.current.ship);

      // Update asteroids
      gameState.current.asteroids.forEach(asteroid => {
        asteroid.x += asteroid.vx;
        asteroid.y += asteroid.vy;
        wrapPosition(asteroid);
        drawAsteroid(asteroid);

        // Check collision with ship
        if (checkCollision(
          gameState.current.ship.x,
          gameState.current.ship.y,
          SHIP_SIZE,
          asteroid.x,
          asteroid.y,
          asteroid.size
        )) {
          setGameOver(true);
        }
      });

      // Update bullets
      gameState.current.bullets = gameState.current.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        bullet.life--;
        
        if (bullet.life <= 0) return false;

        // Check collision with asteroids
        let hit = false;
        gameState.current.asteroids = gameState.current.asteroids.filter(asteroid => {
          if (checkCollision(bullet.x, bullet.y, 3, asteroid.x, asteroid.y, asteroid.size)) {
            hit = true;
            setScore(s => s + 10);
            
            // Split asteroid if large enough
            if (asteroid.size > 15) {
              gameState.current.asteroids.push(
                createAsteroid(asteroid.x, asteroid.y, asteroid.size / 2),
                createAsteroid(asteroid.x, asteroid.y, asteroid.size / 2)
              );
            }
            return false;
          }
          return true;
        });

        if (hit) return false;

        drawBullet(bullet);
        return true;
      });

      // Add more asteroids if all destroyed
      if (gameState.current.asteroids.length === 0) {
        gameState.current.asteroids = Array(5).fill().map(() => createAsteroid());
      }

      drawShip();
    };

    const gameLoop = setInterval(update, 1000 / 60);
    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver]);

  return (
    <div className="game-content">
      <h1>Asteroids</h1>
      <p className="score">Score: {score}</p>
      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas"
        />
        {!gameStarted && !gameOver && (
          <div className="game-message">
            <p>Press any arrow key to start</p>
            <p style={{ fontSize: '0.8em' }}>↑ Thrust | ← → Rotate | ↓ Shoot</p>
          </div>
        )}
        {gameOver && (
          <div className="game-message">
            <p>Game Over!</p>
            <button onClick={resetGame}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Asteroids;
