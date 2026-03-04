import { useState, useEffect } from 'react';
import { Card, Button, Input, message as antdMessage } from 'antd';

const GuessThenum = () => {
  const [targetNumber, setTargetNumber] = useState<number>(0);
  const [guess, setGuess] = useState<string>('');
  const [attempts, setAttempts] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [gameOver, setGameOver] = useState<boolean>(false);

  // Khởi tạo game
  const initGame = () => {
    const randomNum = Math.floor(Math.random() * 100) + 1;
    setTargetNumber(randomNum);
    setAttempts(0);
    setMessage('');
    setGameOver(false);
    setGuess('');
  };

  // Chạy khi component mount
  useEffect(() => {
    initGame();
  }, []);

  // Xử lý đoán số
  const handleGuess = () => {
    const guessNum = parseInt(guess);
    
    // Validate input
    if (isNaN(guessNum) || guessNum < 1 || guessNum > 100) {
      antdMessage.error('Vui lòng nhập số từ 1 đến 100!');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    // Kiểm tra đoán
    if (guessNum === targetNumber) {
      setMessage(`Chúc mừng! Bạn đã đoán đúng!`);
      setGameOver(true);
    } else if (newAttempts >= 10) {
      setMessage(`Bạn đã hết lượt! Số đúng là ${targetNumber}`);
      setGameOver(true);
    } else if (guessNum < targetNumber) {
      setMessage('Bạn đoán quá thấp!');
    } else {
      setMessage('Bạn đoán quá cao!');
    }

    setGuess('');
  };

  return (
    <Card title="Game Đoán Số" style={{ maxWidth: 500, margin: '20px auto' }}>
      <div>
        <p>Đoán một số từ 1 đến 100</p>
        <p>Số lần đã đoán: {attempts}/10</p>
        
        <Input
          type="number"
          placeholder="Nhập số"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onPressEnter={handleGuess}
          disabled={gameOver}
          style={{ marginBottom: 10 }}
        />
        
        <div>
          <Button type="primary" onClick={handleGuess} disabled={gameOver}>
            Đoán
          </Button>
          <Button onClick={initGame} style={{ marginLeft: 10 }}>
            Chơi lại
          </Button>
        </div>

        {message && (
          <p style={{ marginTop: 20, fontSize: 16, fontWeight: 'bold' }}>
            {message}
          </p>
        )}
      </div>
    </Card>
  );
};

export default GuessThenum;