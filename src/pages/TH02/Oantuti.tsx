import React, { useState } from 'react';

const Oantuti: React.FC = () => {
  const [history, setHistory] = useState<string[]>([]);
  const choices = ['Kéo', 'Búa', 'Bao'];

  const playGame = (playerChoice: string) => {
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    let result = '';

    if (playerChoice === computerChoice) {
      result = 'Hòa';
    } else if (
      (playerChoice === 'Kéo' && computerChoice === 'Bao') ||
      (playerChoice === 'Búa' && computerChoice === 'Kéo') ||
      (playerChoice === 'Bao' && computerChoice === 'Búa')
    ) {
      result = 'Thắng';
    } else {
      result = 'Thua';
    }

    const gameResult = `Bạn: ${playerChoice} | Máy: ${computerChoice} | Kết quả: ${result}`;
    setHistory([gameResult, ...history]);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Trò Chơi Oán Tuti</h1>
      <div style={{ marginBottom: '20px' }}>
        {choices.map((choice) => (
          <button key={choice} onClick={() => playGame(choice)} style={{ marginRight: '10px', padding: '10px 20px' }}>
            {choice}
          </button>
        ))}
      </div>
      <h2>Lịch Sử Kết Quả</h2>
      <ul>
        {history.map((result, index) => (
          <li key={index}>{result}</li>
        ))}
      </ul>
    </div>
  );
};

export default Oantuti;