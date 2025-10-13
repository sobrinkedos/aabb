import React, { useState } from 'react';

interface SuperAdminOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userName: string;
  companyName: string;
}

export function SuperAdminOnboarding({ 
  isOpen, 
  onClose, 
  onComplete, 
  userName, 
  companyName 
}: SuperAdminOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Bem-vindo, Administrador Principal!',
      content: (
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👑</span>
          </div>
          <p className="text-lg text-gray-700 mb-4">
            Olá <strong>{userName}</strong>! Você foi registrado como <strong>Administrador Principal</strong> da empresa <strong>{companyName}</strong>.
          </p>
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">🎯 Seus Privilégios Especiais</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-yellow-700">
              <div>✅ Acesso total ao sistema</div>
              <div>✅ Configurações críticas</div>
              <div>✅ Gerenciar administradores</div>
              <div>✅ Integrações e backup</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{steps[currentStep].title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          {steps[currentStep].content}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Começar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}