import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getCurrentUserEmpresaId } from '../../utils/auth-helper';
import { Plus, Edit2, Trash2, Save, X, Briefcase, Users } from 'lucide-react';

interface Position {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export const ConfiguracaoCargos: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'positions' | 'departments'>('positions');

  // Estados para edição
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newPosition, setNewPosition] = useState({ name: '', description: '' });
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
  const [showNewPositionForm, setShowNewPositionForm] = useState(false);
  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const empresaId = await getCurrentUserEmpresaId();
      if (!empresaId) {
        throw new Error('Empresa não encontrada');
      }

      // Carregar cargos
      const { data: positionsData, error: positionsError } = await supabase
        .from('positions')
        .select('*')
        .order('name');

      if (positionsError) throw positionsError;

      // Carregar departamentos
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (departmentsError) throw departmentsError;

      setPositions(positionsData || []);
      setDepartments(departmentsData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePosition = async () => {
    if (!newPosition.name.trim()) {
      setError('Nome do cargo é obrigatório');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: insertError } = await supabase
        .from('positions')
        .insert({
          name: newPosition.name.trim(),
          description: newPosition.description.trim() || null,
          is_active: true
        });

      if (insertError) throw insertError;

      setSuccess('Cargo criado com sucesso!');
      setNewPosition({ name: '', description: '' });
      setShowNewPositionForm(false);
      await loadData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao criar cargo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar cargo');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartment.name.trim()) {
      setError('Nome do departamento é obrigatório');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error: insertError } = await supabase
        .from('departments')
        .insert({
          name: newDepartment.name.trim(),
          description: newDepartment.description.trim() || null,
          is_active: true
        });

      if (insertError) throw insertError;

      setSuccess('Departamento criado com sucesso!');
      setNewDepartment({ name: '', description: '' });
      setShowNewDepartmentForm(false);
      await loadData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao criar departamento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar departamento');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePosition = async (position: Position) => {
    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('positions')
        .update({
          name: position.name,
          description: position.description,
          is_active: position.is_active
        })
        .eq('id', position.id);

      if (updateError) throw updateError;

      setSuccess('Cargo atualizado com sucesso!');
      setEditingPosition(null);
      await loadData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar cargo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cargo');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDepartment = async (department: Department) => {
    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('departments')
        .update({
          name: department.name,
          description: department.description,
          is_active: department.is_active
        })
        .eq('id', department.id);

      if (updateError) throw updateError;

      setSuccess('Departamento atualizado com sucesso!');
      setEditingDepartment(null);
      await loadData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao atualizar departamento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar departamento');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePositionStatus = async (position: Position) => {
    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('positions')
        .update({ is_active: !position.is_active })
        .eq('id', position.id);

      if (updateError) throw updateError;

      setSuccess(`Cargo ${!position.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      await loadData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      setError(err instanceof Error ? err.message : 'Erro ao alterar status');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDepartmentStatus = async (department: Department) => {
    try {
      setSaving(true);
      setError('');

      const { error: updateError } = await supabase
        .from('departments')
        .update({ is_active: !department.is_active })
        .eq('id', department.id);

      if (updateError) throw updateError;

      setSuccess(`Departamento ${!department.is_active ? 'ativado' : 'desativado'} com sucesso!`);
      await loadData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      setError(err instanceof Error ? err.message : 'Erro ao alterar status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cargos e Departamentos</h3>
        <p className="text-sm text-gray-600">
          Configure os cargos e departamentos disponíveis para os funcionários da empresa.
        </p>
      </div>

      {/* Messages */}
      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('positions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'positions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Cargos ({positions.length})
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'departments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Departamentos ({departments.length})
          </button>
        </nav>
      </div>

      {/* Positions Tab */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          {/* Add Button */}
          {!showNewPositionForm && (
            <button
              onClick={() => setShowNewPositionForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cargo
            </button>
          )}

          {/* New Position Form */}
          {showNewPositionForm && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Novo Cargo</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Cargo *
                  </label>
                  <input
                    type="text"
                    value={newPosition.name}
                    onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Gerente, Atendente, Cozinheiro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newPosition.description}
                    onChange={(e) => setNewPosition({ ...newPosition, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Descrição opcional do cargo"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreatePosition}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setShowNewPositionForm(false);
                      setNewPosition({ name: '', description: '' });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Positions List */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum cargo cadastrado
                    </td>
                  </tr>
                ) : (
                  positions.map((position) => (
                    <tr key={position.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingPosition?.id === position.id ? (
                          <input
                            type="text"
                            value={editingPosition.name}
                            onChange={(e) => setEditingPosition({ ...editingPosition, name: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{position.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingPosition?.id === position.id ? (
                          <input
                            type="text"
                            value={editingPosition.description || ''}
                            onChange={(e) => setEditingPosition({ ...editingPosition, description: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">{position.description || '-'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          position.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {position.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingPosition?.id === position.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdatePosition(editingPosition)}
                              disabled={saving}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingPosition(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingPosition(position)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleTogglePositionStatus(position)}
                              disabled={saving}
                              className={position.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                            >
                              {position.is_active ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          {/* Add Button */}
          {!showNewDepartmentForm && (
            <button
              onClick={() => setShowNewDepartmentForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Departamento
            </button>
          )}

          {/* New Department Form */}
          {showNewDepartmentForm && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Novo Departamento</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Departamento *
                  </label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Atendimento, Cozinha, Administração"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Descrição opcional do departamento"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateDepartment}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setShowNewDepartmentForm(false);
                      setNewDepartment({ name: '', description: '' });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Departments List */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum departamento cadastrado
                    </td>
                  </tr>
                ) : (
                  departments.map((department) => (
                    <tr key={department.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingDepartment?.id === department.id ? (
                          <input
                            type="text"
                            value={editingDepartment.name}
                            onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                          />
                        ) : (
                          <div className="text-sm font-medium text-gray-900">{department.name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingDepartment?.id === department.id ? (
                          <input
                            type="text"
                            value={editingDepartment.description || ''}
                            onChange={(e) => setEditingDepartment({ ...editingDepartment, description: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">{department.description || '-'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          department.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {department.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {editingDepartment?.id === department.id ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateDepartment(editingDepartment)}
                              disabled={saving}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingDepartment(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingDepartment(department)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleDepartmentStatus(department)}
                              disabled={saving}
                              className={department.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                            >
                              {department.is_active ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
