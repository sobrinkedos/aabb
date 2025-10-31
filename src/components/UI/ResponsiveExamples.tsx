import React, { useState } from 'react';
import { ResponsiveModal } from './ResponsiveModal';
import { ResponsiveTable } from './ResponsiveTable';
import { ResponsiveCard } from './ResponsiveCard';
import { User, Mail, Phone } from 'lucide-react';

/**
 * Componente de exemplo mostrando como usar os componentes responsivos
 * Este arquivo serve como referência para desenvolvedores
 */

interface ExampleUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

export const ResponsiveExamples: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  // Dados de exemplo
  const users: ExampleUser[] = [
    { id: 1, name: 'João Silva', email: 'joao@email.com', phone: '(11) 99999-9999', status: 'active' },
    { id: 2, name: 'Maria Santos', email: 'maria@email.com', phone: '(11) 98888-8888', status: 'active' },
    { id: 3, name: 'Pedro Costa', email: 'pedro@email.com', phone: '(11) 97777-7777', status: 'inactive' },
  ];

  // Configuração das colunas da tabela
  const columns = [
    {
      key: 'name',
      label: 'Nome',
      mobileLabel: 'Nome',
    },
    {
      key: 'email',
      label: 'E-mail',
      mobileLabel: 'E-mail',
    },
    {
      key: 'phone',
      label: 'Telefone',
      mobileLabel: 'Tel',
      hideOnMobile: false,
    },
    {
      key: 'status',
      label: 'Status',
      mobileLabel: 'Status',
      render: (user: ExampleUser) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {user.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <h1 className="text-responsive-xl font-bold text-gray-900">
        Exemplos de Componentes Responsivos
      </h1>

      {/* Exemplo 1: Cards Responsivos */}
      <section>
        <h2 className="text-responsive-lg font-semibold text-gray-800 mb-4">
          1. Cards Responsivos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ResponsiveCard hover padding="md">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-responsive-sm text-gray-600">Total Usuários</p>
                <p className="text-responsive-lg font-bold text-gray-900">1,234</p>
              </div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard hover padding="md">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Mail className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-responsive-sm text-gray-600">E-mails Enviados</p>
                <p className="text-responsive-lg font-bold text-gray-900">5,678</p>
              </div>
            </div>
          </ResponsiveCard>

          <ResponsiveCard hover padding="md">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Phone className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-responsive-sm text-gray-600">Chamadas</p>
                <p className="text-responsive-lg font-bold text-gray-900">890</p>
              </div>
            </div>
          </ResponsiveCard>
        </div>
      </section>

      {/* Exemplo 2: Tabela Responsiva */}
      <section>
        <h2 className="text-responsive-lg font-semibold text-gray-800 mb-4">
          2. Tabela Responsiva
        </h2>
        <ResponsiveCard padding="md">
          <ResponsiveTable
            data={users}
            columns={columns}
            keyExtractor={(user) => user.id}
            onRowClick={(user) => console.log('Clicou em:', user.name)}
            emptyMessage="Nenhum usuário encontrado"
          />
        </ResponsiveCard>
      </section>

      {/* Exemplo 3: Modal Responsivo */}
      <section>
        <h2 className="text-responsive-lg font-semibold text-gray-800 mb-4">
          3. Modal Responsivo
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          Abrir Modal
        </button>

        <ResponsiveModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Exemplo de Modal Responsivo"
          size="md"
          footer={
            <>
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1 sm:flex-none"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  console.log('Salvando...');
                  setShowModal(false);
                }}
                className="btn-primary flex-1 sm:flex-none"
              >
                Salvar
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Digite seu nome"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem
              </label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Digite sua mensagem"
              />
            </div>
          </div>
        </ResponsiveModal>
      </section>

      {/* Exemplo 4: Grid Responsivo */}
      <section>
        <h2 className="text-responsive-lg font-semibold text-gray-800 mb-4">
          4. Grid Responsivo
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <ResponsiveCard key={item} padding="sm" hover>
              <div className="text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mx-auto mb-2 sm:mb-3" />
                <p className="text-responsive-base font-medium text-gray-900">
                  Item {item}
                </p>
                <p className="text-responsive-sm text-gray-600">
                  Descrição do item
                </p>
              </div>
            </ResponsiveCard>
          ))}
        </div>
      </section>

      {/* Exemplo 5: Formulário Responsivo */}
      <section>
        <h2 className="text-responsive-lg font-semibold text-gray-800 mb-4">
          5. Formulário Responsivo
        </h2>
        <ResponsiveCard padding="md">
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input type="text" className="form-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sobrenome
                </label>
                <input type="text" className="form-input" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-mail
              </label>
              <input type="email" className="form-input" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select className="form-select">
                <option>Selecione uma opção</option>
                <option>Opção 1</option>
                <option>Opção 2</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button type="button" className="btn-secondary flex-1 sm:flex-none">
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1 sm:flex-none">
                Enviar
              </button>
            </div>
          </form>
        </ResponsiveCard>
      </section>
    </div>
  );
};
