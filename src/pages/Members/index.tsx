import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Users, UserCheck, UserPlus } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import MemberModal from './MemberModal';
import MemberCard from './MemberCard';
import { Member } from '../../types';
import { subMonths, isAfter } from 'date-fns';

const MembersModule: React.FC = () => {
  const { members } = useApp();
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleAddNew = () => {
    setSelectedMember(null);
    setShowMemberModal(true);
  };

  const handleCloseModal = () => {
    setShowMemberModal(false);
    setSelectedMember(null);
  };

  const filteredMembers = useMemo(() => 
    members.filter(member => {
      const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      return matchesSearch && matchesStatus;
    }), [members, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const oneMonthAgo = subMonths(new Date(), 1);
    return {
      total: members.length,
      active: members.filter(m => m.status === 'active').length,
      newThisMonth: members.filter(m => isAfter(m.joinDate, oneMonthAgo)).length,
    };
  }, [members]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Módulo Membros</h1>
          <p className="text-gray-600">Gestão completa de sócios do clube</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddNew}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus size={20} />
          <span>Novo Membro</span>
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={Users} title="Total de Membros" value={stats.total} color="blue" />
        <StatCard icon={UserCheck} title="Membros Ativos" value={stats.active} color="green" />
        <StatCard icon={UserPlus} title="Novos (Último Mês)" value={stats.newThisMonth} color="purple" />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Lista de Membros</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar membros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMembers.map((member) => (
            <MemberCard 
              key={member.id} 
              member={member} 
              onEdit={handleEdit}
            />
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum membro encontrado</p>
          </div>
        )}
      </div>

      {showMemberModal && (
        <MemberModal
          isOpen={showMemberModal}
          onClose={handleCloseModal}
          member={selectedMember}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color }: { icon: React.ElementType, title: string, value: string | number, color: string }) => {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
          <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default MembersModule;
