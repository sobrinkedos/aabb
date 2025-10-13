import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { getUserRole, addUserRoleMapping, baseUserRoleMapping } from '../../config/userRoleMapping';

interface UserRoleEntry {
  email: string;
  role: string;
  createdAt: string;
  createdBy?: string;
}

export const UserRoleMappingManager: React.FC = () => {
  const [mappings, setMappings] = useState<UserRoleEntry[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [newMapping, setNewMapping] = useState({ email: '', role: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  const availableRoles = [
    'administrador',
    'gerente', 
    'atendente',
    'atendente_caixa',
    'operador_caixa',
    'garcom',
    'cozinheiro',
    'funcionario'
  ];

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = () => {
    const allMappings: UserRoleEntry[] = [];
    
    // Carregar mapeamentos base
    Object.entries(baseUserRoleMapping).forEach(([email, role]) => {
      allMappings.push({
        email,
        role,
        createdAt: 'Base mapping',
        createdBy: 'system'
      });
    });

    // Carregar mapeamentos do localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('userRole_')) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry: UserRoleEntry = JSON.parse(stored);
            allMappings.push(entry);
          }
        } catch (error) {
          console.warn('Erro ao carregar mapeamento:', error);
        }
      }
    }

    setMappings(allMappings);
  };

  const handleAddMapping = () => {
    if (newMapping.email && newMapping.role) {
      addUserRoleMapping(newMapping.email, newMapping.role, 'admin');
      setNewMapping({ email: '', role: '' });
      setShowAddForm(false);
      loadMappings();
    }
  };

  const handleDeleteMapping = (email: string) => {
    localStorage.removeItem(`userRole_${email}`);
    loadMappings();
  };

  const handleEditMapping = (email: string, newRole: string) => {
    addUserRoleMapping(email, newRole, 'admin');
    setIsEditing(null);
    loadMappings();
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      administrador: 'bg-red-100 text-red-800',
      gerente: 'bg-purple-100 text-purple-800',
      atendente: 'bg-blue-100 text-blue-800',
      atendente_caixa: 'bg-cyan-100 text-cyan-800',
      operador_caixa: 'bg-green-100 text-green-800',
      garcom: 'bg-yellow-100 text-yellow-800',
      cozinheiro: 'bg-orange-100 text-orange-800',
      funcionario: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Gerenciar Mapeamento de Usuários
          </h2>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar Mapeamento</span>
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Novo Mapeamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email do Usuário
              </label>
              <input
                type="email"
                value={newMapping.email}
                onChange={(e) => setNewMapping({ ...newMapping, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={newMapping.role}
                onChange={(e) => setNewMapping({ ...newMapping, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um role</option>
                {availableRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddMapping}
              disabled={!newMapping.email || !newMapping.role}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-900">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Criado em</th>
              <th className="text-left py-3 px-4 font-medium text-gray-900">Criado por</th>
              <th className="text-right py-3 px-4 font-medium text-gray-900">Ações</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping, index) => (
              <tr key={`${mapping.email}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900">{mapping.email}</td>
                <td className="py-3 px-4">
                  {isEditing === mapping.email ? (
                    <select
                      defaultValue={mapping.role}
                      onChange={(e) => handleEditMapping(mapping.email, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {availableRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(mapping.role)}`}>
                      {mapping.role}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">
                  {mapping.createdAt === 'Base mapping' ? 'Configuração base' : 
                   new Date(mapping.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 px-4 text-gray-600 text-sm">{mapping.createdBy || 'N/A'}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {isEditing === mapping.email ? (
                      <button
                        onClick={() => setIsEditing(null)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(mapping.email)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {mapping.createdAt !== 'Base mapping' && (
                          <button
                            onClick={() => handleDeleteMapping(mapping.email)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mappings.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum mapeamento de usuário encontrado.
        </div>
      )}
    </div>
  );
};