import React from 'react';
import { Shield, Lock, AlertTriangle, Info, Users, Settings } from 'lucide-react';
import { PapelUsuario } from '../../types/multitenant';
import { ConfigurationService } from '../../services/configurationService';
import { PrivilegeUtils } from '../../utils/privilegeUtils';

interface ConfigurationAccessInfoProps {
  categoria: string;
  showDetails?: boolean;
  className?: string;
}

export function ConfigurationAccessInfo({ 
  categoria, 
  showDetails = false, 
  className = '' 
}: ConfigurationAccessInfoProps) {
  const info = ConfigurationService.getInfoRestricaoCategoria(categoria);
  
  const getIconeNivel = (nivel: string) => {
    switch (nivel) {
      case 'critico':
        return <Lock className="w-4 h-4 text-red-500" />;
      case 'alto':
        return <Shield className="w-4 h-4 text-orange-500" />;
      case 'medio':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'baixo':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCorNivel = (nivel: string) => {
    switch (nivel) {
      case 'critico':
        return 'border-red-200 bg-red-50';
      case 'alto':
        return 'border-orange-200 bg-orange-50';
      case 'medio':
        return 'border-yellow-200 bg-yellow-50';
      case 'baixo':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getTextoNivel = (nivel: string) => {
    switch (nivel) {
      case 'critico':
        return 'Crítico';
      case 'alto':
        return 'Alto';
      case 'medio':
        return 'Médio';
      case 'baixo':
        return 'Baixo';
      default:
        return 'Desconhecido';
    }
  };

  if (!showDetails) {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        {getIconeNivel(info.nivel_criticidade)}
        <span className="text-xs text-gray-600">
          {getTextoNivel(info.nivel_criticidade)}
        </span>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${getCorNivel(info.nivel_criticidade)} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIconeNivel(info.nivel_criticidade)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-medium text-gray-900 capitalize">
              {categoria}
            </h4>
            <span className={`
              inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
              ${info.nivel_criticidade === 'critico' ? 'bg-red-100 text-red-800' : ''}
              ${info.nivel_criticidade === 'alto' ? 'bg-orange-100 text-orange-800' : ''}
              ${info.nivel_criticidade === 'medio' ? 'bg-yellow-100 text-yellow-800' : ''}
              ${info.nivel_criticidade === 'baixo' ? 'bg-blue-100 text-blue-800' : ''}
            `}>
              Nível {getTextoNivel(info.nivel_criticidade)}
            </span>
          </div>
          
          <p className="text-sm text-gray-700 mb-3">
            {info.descricao}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Papéis com acesso:
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1 ml-6">
              {info.papeis_permitidos.map((papel) => (
                <span
                  key={papel}
                  className={`
                    inline-flex items-center px-2 py-1 rounded-md text-xs font-medium
                    ${PrivilegeUtils.getCorPapel(papel) === 'red' ? 'bg-red-100 text-red-800' : ''}
                    ${PrivilegeUtils.getCorPapel(papel) === 'orange' ? 'bg-orange-100 text-orange-800' : ''}
                    ${PrivilegeUtils.getCorPapel(papel) === 'blue' ? 'bg-blue-100 text-blue-800' : ''}
                    ${PrivilegeUtils.getCorPapel(papel) === 'gray' ? 'bg-gray-100 text-gray-800' : ''}
                  `}
                >
                  {PrivilegeUtils.getDescricaoPapel(papel)}
                </span>
              ))}
            </div>
            
            {info.nivel_criticidade === 'critico' && (
              <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-red-700">
                    <strong>Atenção:</strong> Configurações críticas que afetam a segurança 
                    de toda a empresa. Apenas o Administrador Principal pode alterá-las.
                  </div>
                </div>
              </div>
            )}
            
            {info.nivel_criticidade === 'alto' && (
              <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded-md">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-orange-700">
                    <strong>Importante:</strong> Configurações que podem impactar 
                    o funcionamento do sistema. Acesso restrito.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar resumo de todas as categorias
export function ConfigurationCategoriesOverview({ className = '' }: { className?: string }) {
  const categorias = ['geral', 'seguranca', 'sistema', 'notificacoes', 'integracao'];
  
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Categorias de Configuração
      </h3>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categorias.map((categoria) => (
          <ConfigurationAccessInfo
            key={categoria}
            categoria={categoria}
            showDetails={true}
          />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <h4 className="font-medium mb-1">Sobre o Controle de Acesso</h4>
            <p className="mb-2">
              O sistema utiliza uma hierarquia de papéis para controlar o acesso às configurações:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Administrador Principal:</strong> Acesso total a todas as configurações</li>
              <li><strong>Administrador:</strong> Acesso limitado (sem configurações críticas)</li>
              <li><strong>Gerente:</strong> Acesso apenas a configurações básicas</li>
              <li><strong>Usuário:</strong> Sem acesso a configurações administrativas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}