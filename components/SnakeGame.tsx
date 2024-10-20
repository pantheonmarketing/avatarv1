import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from 'framer-motion'

const GRID_SIZE = 20
const CELL_SIZE = 20
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
  { x: 7, y: 10 },
  { x: 6, y: 10 }
]
const INITIAL_FOOD = { x: 15, y: 15 }
const INITIAL_DIRECTION = { x: 1, y: 0 }

interface SnakeGameProps {
  onClose: () => void;
}

export function SnakeGame({ onClose }: SnakeGameProps) {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [food, setFood] = useState(INITIAL_FOOD)
  const [direction, setDirection] = useState(INITIAL_DIRECTION)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [timeSurvived, setTimeSurvived] = useState(0)
  const [longestTime, setLongestTime] = useState(0)

  const gameLoopRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const newSnake = [...prevSnake]
      const head = { ...newSnake[0] }

      head.x += direction.x
      head.y += direction.y

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        endGame()
        return prevSnake
      }

      if (newSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        endGame()
        return prevSnake
      }

      newSnake.unshift(head)

      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 1)
        setFood({
          x: Math.floor(Math.random() * GRID_SIZE),
          y: Math.floor(Math.random() * GRID_SIZE)
        })
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [direction, food])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameStarted) return;
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 })
          break
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 })
          break
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 })
          break
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 })
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameStarted, direction])

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const moveSnakeAndUpdateTime = () => {
        moveSnake();
        setTimeSurvived(prev => prev + 1);
      };

      gameLoopRef.current = window.setInterval(moveSnakeAndUpdateTime, 100);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
  }, [gameStarted, gameOver, moveSnake]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE)
        
        // Draw snake
        ctx.fillStyle = '#2ecc71'
        snake.forEach((segment, index) => {
          if (index === 0) {
            // Draw snake head
            ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
            // Draw eyes
            ctx.fillStyle = '#000'
            ctx.fillRect((segment.x * CELL_SIZE) + 3, (segment.y * CELL_SIZE) + 3, 2, 2)
            ctx.fillRect((segment.x * CELL_SIZE) + 15, (segment.y * CELL_SIZE) + 3, 2, 2)
          } else {
            // Draw snake body
            ctx.fillStyle = index % 2 === 0 ? '#2ecc71' : '#27ae60'
            ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
          }
        })
        
        // Draw apple
        const appleImg = new Image()
        appleImg.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2U3NDA0MCIgZD0iTTIwLjcxIDcuMDRjLjM5LS4zOS4zOS0xLjAyIDAtMS40MWwtMi4zNC0yLjM0Yy0uMzktLjM5LTEuMDItLjM5LTEuNDEgMGwtMS44NCAxLjgzYy0uOTItLjU2LTIuMDMtLjg4LTMuMjEtLjg4LTMuMzEgMC02IDIuNjktNiA2IDAgMS42NS42NyAzLjE1IDEuNzYgNC4yNEw0LjEzIDE4Yy0uMzkuMzktLjM5IDEuMDIgMCAxLjQxbDIuMzQgMi4zNGMuMzkuMzkgMS4wMi4zOSAxLjQxIDBsMS44My0xLjgzYy45Mi41NiAyLjAzLjg4IDMuMjEuODggMy4zMSAwIDYtMi42OSA2LTYgMC0xLjY1LS42Ny0zLjE1LTEuNzYtNC4yNGwzLjU1LTMuNTV6TTE1IDE1YzAgMS42NS0xLjM1IDMtMyAzcy0zLTEuMzUtMy0zIDEuMzUtMyAzLTMgMyAxLjM1IDMgM3oiLz48L3N2Zz4='
        appleImg.onload = () => {
          ctx.drawImage(appleImg, food.x * CELL_SIZE, food.y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        }
      }
    }
  }, [snake, food])

  const startGame = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    setFood(INITIAL_FOOD)
    setGameOver(false)
    setGameStarted(true)
    setScore(0)
    setTimeSurvived(0)
  }

  const endGame = () => {
    setGameOver(true)
    setGameStarted(false)
    if (score > highScore) setHighScore(score)
    if (timeSurvived > longestTime) setLongestTime(timeSurvived)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-[440px] bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            Nokia Snake
          </CardTitle>
          <CardDescription className="text-center">
            Play while waiting for your avatar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * CELL_SIZE}
              height={GRID_SIZE * CELL_SIZE}
              className="border-2 border-gray-300 dark:border-gray-700 rounded-lg shadow-lg"
            />
            <AnimatePresence>
              {!gameStarted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg"
                >
                  <Button onClick={startGame} size="lg" className="text-lg">
                    {gameOver ? 'Play Again' : 'Start Game'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-4 flex justify-between">
            <Badge variant="secondary" className="text-lg">Score: {score}</Badge>
            <Badge variant="secondary" className="text-lg">Time: {timeSurvived}s</Badge>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <div className="flex justify-between w-full mb-2">
            <Badge variant="outline" className="text-sm">High Score: {highScore}</Badge>
            <Badge variant="outline" className="text-sm">Longest Time: {longestTime}s</Badge>
          </div>
          <Button variant="ghost" onClick={onClose} className="mt-2">
            Close
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
