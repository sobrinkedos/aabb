import React, { useState } from 'react';

interface ConfigurationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ConfigurationWizard({ isOpen, onClose, onComplete }: ConfigurationWizardProps) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    empresa: {
      nome: '',
      logo: ''
    },
    seguranca: {
      tempo_sessao: 480,
      exigir_2fa: false
    },
    notificacoes: {
      email_novos_usuarios: true,
      email_tentativas_login: true
    }
  });

  if (!isOpen) return null;

  const steps = [
    {
      title: 'Informações da Empresa',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Empresa
            </label>
            <input
              type="text"
              value={config.empresa.nome}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                empresa: { ...prev.empresa, nome: e.target.value }
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Digite o nome da empresa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Logo da Empresa (URL)
            </label>
            <input
              type="url"
              value={config.empresa.logo}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                empresa: { ...prev.empresa, logo: e.target.value }
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="https://exemplo.com/logo.png"
            />
          </div>
        </div>
      )
    },
    {
      title: 'Configurações de Segurança',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tempo de Sessão (minutos)
            </label>
            <select
              value={config.seguranca.tempo_sessao}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                seguranca: { ...prev.seguranca, tempo_sessao: Number(e.target.value) }
              }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={60}>1 hora</option>
              <option value={240}>4 horas</option>
              <option value={480}>8 horas</option>
              <option value={720}>12 horas</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="exigir_2fa"
              checked={config.seguranca.exigir_2fa}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                seguranca: { ...prev.seguranca, exigir_2fa: e.target.checked }
              }))}
              className="mr-2"
            />
            <label htmlFor="exigir_2fa" className="text-sm text-gray-700">
              Exigir autenticação de dois fatores (2FA)
            </label>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Salvar configurações e finalizar
      onComplete();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold">{steps[step].title}</h2>
              <p className="text-sm text-gray-500">Passo {step + 1} de {steps.length}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
          
          {steps[step].content}
          
          <div className="mt-6 flex justify-between">
            <button
              onClick={prevStep}
              disabled={step === 0}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {step === steps.length - 1 ? 'Finalizar' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}