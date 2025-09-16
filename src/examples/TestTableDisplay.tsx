import React from 'react';
import { formatTableDisplay } from '../utils/comanda-formatter';

const TestTableDisplay: React.FC = () => {
  const testCases = [
    { tableNumber: 5, expected: 'Mesa 5' },
    { tableNumber: '10', expected: 'Mesa 10' },
    { tableNumber: null, expected: 'Balcão' },
    { tableNumber: undefined, expected: 'Balcão' },
    { tableNumber: '', expected: 'Balcão' },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-semibold mb-4">Teste de Formatação Mesa/Balcão</h2>
      
      <div className="space-y-3">
        {testCases.map((testCase, index) => {
          const result = formatTableDisplay(testCase.tableNumber);
          const isCorrect = result === testCase.expected;
          
          return (
            <div 
              key={index}
              className={`p-3 rounded border ${
                isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Input:</span> {JSON.stringify(testCase.tableNumber)}
                </div>
                <div>
                  <span className="font-medium">Resultado:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Esperado:</span> {testCase.expected}
                </div>
                <div>
                  {isCorrect ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold">✗</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">Exemplos de Uso:</h3>
        <div className="space-y-2 text-sm">
          <div><code>formatTableDisplay(5)</code> → <strong>Mesa 5</strong></div>
          <div><code>formatTableDisplay('10')</code> → <strong>Mesa 10</strong></div>
          <div><code>formatTableDisplay(null)</code> → <strong>Balcão</strong></div>
          <div><code>formatTableDisplay(undefined)</code> → <strong>Balcão</strong></div>
        </div>
      </div>
    </div>
  );
};

export default TestTableDisplay;