import { useState } from 'react'
import './App.css'
import Snake from './components/Snake'
import Tetris from './components/Tetris'
import BrickBreaker from './components/BrickBreaker'
import Asteroids from './components/Asteroids'

function App() {
  const [selectedGame, setSelectedGame] = useState('snake');

  const games = [
    { id: 'snake', name: 'Snake', icon: '🐍' },
    { id: 'tetris', name: 'Tetris', icon: '🟦' },
    { id: 'breakout', name: 'Brick Breaker', icon: '🧱' },
    { id: 'asteroids', name: 'Asteroids', icon: '🚀' }
  ];

  const renderGame = () => {
    switch (selectedGame) {
      case 'snake':
        return <Snake />;
      case 'tetris':
        return <Tetris />;
      case 'breakout':
        return <BrickBreaker />;
      case 'asteroids':
        return <Asteroids />;
      default:
        return <Snake />;
    }
  };

  return (
    <div className="App">
      <nav className="navbar">
        <h1>CloudFit Software</h1>
      </nav>
      <div className="main-container">
        <aside className="sidebar">
          <h2>🎮 Arcade</h2>
          <ul className="game-menu">
            {games.map(game => (
              <li
                key={game.id}
                className={selectedGame === game.id ? 'active' : ''}
                onClick={() => setSelectedGame(game.id)}
              >
                <span className="game-icon">{game.icon}</span>
                <span className="game-name">{game.name}</span>
              </li>
            ))}
          </ul>
        </aside>
        <main className="game-area">
          {renderGame()}
        </main>
      </div>
    </div>
  )
}

export default App
