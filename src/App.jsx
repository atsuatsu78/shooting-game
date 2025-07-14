import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const PLAYER_SIZE = 40
const ENEMY_SIZE = 30
const BULLET_SIZE = 4
const PARTICLE_SIZE = 2

function App() {
  const canvasRef = useRef(null)
  const animationRef = useRef()
  const keysRef = useRef({})
  
  const [gameState, setGameState] = useState({
    player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, health: 100 },
    enemies: [],
    playerBullets: [],
    enemyBullets: [],
    particles: [],
    score: 0,
    gameRunning: true
  })

  const handleKeyDown = useCallback((event) => {
    keysRef.current[event.key] = true
  }, [])

  const handleKeyUp = useCallback((event) => {
    keysRef.current[event.key] = false
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  const updateGame = useCallback(() => {
    if (!gameState.gameRunning) return

    setGameState(prevState => {
      const newState = { ...prevState }
      
      if (keysRef.current['ArrowLeft'] && newState.player.x > PLAYER_SIZE/2) {
        newState.player.x -= 5
      }
      if (keysRef.current['ArrowRight'] && newState.player.x < CANVAS_WIDTH - PLAYER_SIZE/2) {
        newState.player.x += 5
      }
      if (keysRef.current['ArrowUp'] && newState.player.y > PLAYER_SIZE/2) {
        newState.player.y -= 5
      }
      if (keysRef.current['ArrowDown'] && newState.player.y < CANVAS_HEIGHT - PLAYER_SIZE/2) {
        newState.player.y += 5
      }
      
      if (keysRef.current[' ']) {
        if (Math.random() < 0.3) {
          newState.playerBullets.push({
            x: newState.player.x,
            y: newState.player.y - PLAYER_SIZE/2,
            id: Date.now() + Math.random()
          })
        }
      }

      newState.playerBullets = newState.playerBullets
        .map(bullet => ({ ...bullet, y: bullet.y - 8 }))
        .filter(bullet => bullet.y > -BULLET_SIZE)

      if (Math.random() < 0.02) {
        newState.enemies.push({
          x: Math.random() * (CANVAS_WIDTH - ENEMY_SIZE),
          y: -ENEMY_SIZE,
          id: Date.now() + Math.random()
        })
      }

      newState.enemies = newState.enemies
        .map(enemy => ({ ...enemy, y: enemy.y + 3 }))
        .filter(enemy => enemy.y < CANVAS_HEIGHT + ENEMY_SIZE)

      const hitEnemies = new Set()
      const hitBullets = new Set()
      
      newState.playerBullets.forEach(bullet => {
        newState.enemies.forEach(enemy => {
          if (!hitEnemies.has(enemy.id) && !hitBullets.has(bullet.id)) {
            const dx = bullet.x - enemy.x
            const dy = bullet.y - enemy.y
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < (BULLET_SIZE + ENEMY_SIZE) / 2) {
              hitEnemies.add(enemy.id)
              hitBullets.add(bullet.id)
              newState.score += 10
              
              for (let i = 0; i < 10; i++) {
                newState.particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  life: 30,
                  id: Date.now() + Math.random() + i
                })
              }
            }
          }
        })
      })

      newState.enemies = newState.enemies.filter(enemy => !hitEnemies.has(enemy.id))
      newState.playerBullets = newState.playerBullets.filter(bullet => !hitBullets.has(bullet.id))

      newState.particles = newState.particles
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          life: particle.life - 1
        }))
        .filter(particle => particle.life > 0)

      newState.enemies.forEach(enemy => {
        const dx = enemy.x - newState.player.x
        const dy = enemy.y - newState.player.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < (ENEMY_SIZE + PLAYER_SIZE) / 2) {
          newState.player.health -= 1
          if (newState.player.health <= 0) {
            newState.gameRunning = false
          }
        }
      })

      return newState
    })
  }, [gameState.gameRunning])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    
    ctx.fillStyle = '#000011'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    for (let i = 0; i < 100; i++) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(
        Math.random() * CANVAS_WIDTH,
        Math.random() * CANVAS_HEIGHT,
        1,
        1
      )
    }
    
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(
      gameState.player.x - PLAYER_SIZE/2,
      gameState.player.y - PLAYER_SIZE/2,
      PLAYER_SIZE,
      PLAYER_SIZE
    )
    
    ctx.fillStyle = '#ff0000'
    gameState.enemies.forEach(enemy => {
      ctx.fillRect(
        enemy.x - ENEMY_SIZE/2,
        enemy.y - ENEMY_SIZE/2,
        ENEMY_SIZE,
        ENEMY_SIZE
      )
    })
    
    ctx.fillStyle = '#ffff00'
    gameState.playerBullets.forEach(bullet => {
      ctx.fillRect(
        bullet.x - BULLET_SIZE/2,
        bullet.y - BULLET_SIZE/2,
        BULLET_SIZE,
        BULLET_SIZE
      )
    })
    
    gameState.particles.forEach(particle => {
      const alpha = particle.life / 30
      ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`
      ctx.fillRect(
        particle.x - PARTICLE_SIZE/2,
        particle.y - PARTICLE_SIZE/2,
        PARTICLE_SIZE,
        PARTICLE_SIZE
      )
    })
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px monospace'
    ctx.fillText(`Score: ${gameState.score}`, 10, 30)
    ctx.fillText(`Health: ${gameState.player.health}`, 10, 60)
    
    if (!gameState.gameRunning) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.fillStyle = '#ffffff'
      ctx.font = '40px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('GAME OVER', CANVAS_WIDTH/2, CANVAS_HEIGHT/2)
      ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60)
    }
  }, [gameState])

  const gameLoop = useCallback(() => {
    updateGame()
    draw()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [updateGame, draw])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(gameLoop)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  const restartGame = () => {
    setGameState({
      player: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60, health: 100 },
      enemies: [],
      playerBullets: [],
      enemyBullets: [],
      particles: [],
      score: 0,
      gameRunning: true
    })
  }

  return (
    <div className="game-container">
      <div className="game-info">
        <h1>宇宙シューティングゲーム</h1>
        <p>矢印キー: 移動 | スペース: 射撃</p>
        {!gameState.gameRunning && (
          <button onClick={restartGame} className="restart-btn">
            リスタート
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
      />
    </div>
  )
}

export default App