/**
 * Componente de Aviso de Configuração
 * Exibe instruções quando as configurações do Supabase não estão definidas
 */

import React, { useState } from 'react';
import { AlertTriangle, Database, Eye, EyeOff, Copy, Check } from 'lucide-react';

interface ConfigurationWarningProps {
  environment: 'development' | 'production';
  onDismiss?: () => void;
}

export const ConfigurationWarning: React.FC<ConfigurationWarningProps> = ({ 
  environment, 
  onDismiss 
}) => {
  const [showInstructions, setShowInstructions] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const envFile = environment === 'development' ? '.env.local' : '.env.production';
  
  const exampleConfig = `# Configurações do Supabase para ${environment}
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui`;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="text-yellow-800 font-medium mb-2">
            Configuração do Supabase Necessária
          </h3>
          <p className="text-yellow-700 text-sm mb-3">
            As configurações do Supabase não estão definidas para o ambiente <strong>{environment}</strong>. 
            O sistema está funcionando em modo mock.
          </p>
          
          <div className="flex items-center space-x-2 mb-3">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="flex items-center space-x-2 text-yellow-700 hover:text-yellow-800 text-sm font-medium"
            >
              {showInstructions ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showInstructions ? 'Ocultar' : 'Ver'} instruções</span>
            </button>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-yellow-600 hover:text-yellow-800 text-sm"
              >
                Dispensar
              </button>
            )}
          </div>

          {showInstructions && (
            <div className="bg-yellow-100 rounded p-3 text-sm">
              <h4 className="font-medium text-yellow-800 mb-2">
                Como configurar:
              </h4>
              
              <ol className="list-decimal list-inside space-y-2 text-yellow-700 mb-4">
                <li>Acesse o <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Dashboard do Supabase</a></li>
                <li>Crie ou selecione seu projeto</li>
                <li>Vá em Settings → API</li>
                <li>Copie a URL e as chaves</li>
                <li>Configure o arquivo <code className="bg-yellow-200 px-1 rounded">{envFile}</code></li>
              </ol>

              <div className="bg-gray-800 text-green-400 p-3 rounded font-mono text-xs mb-3 relative">
                <button
                  onClick={() => copyToClipboard(exampleConfig, 'config')}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white"
                  title="Copiar configuração"
                >
                  {copiedField === 'config' ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <pre>{exampleConfig}</pre>
              </div>

              <div className="flex items-center space-x-2 text-xs text-yellow-600">
                <Database size={14} />
                <span>Após configurar, recarregue a página para aplicar as mudanças</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigurationWarning;