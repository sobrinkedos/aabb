import React from 'react';
import { motion } from 'framer-motion';
import { Edit, Mail, Phone, Calendar } from 'lucide-react';
import { Member } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MemberCardProps {
  member: Member;
  onEdit: (member: Member) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onEdit }) => {
  
  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  const statusText = {
    active: 'Ativo',
    inactive: 'Inativo',
    pending: 'Pendente',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-xl transition-shadow flex flex-col"
    >
      <div className="relative self-center">
        <img src={member.avatar} alt={member.name} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
        <span className={`absolute bottom-1 right-1 block h-4 w-4 rounded-full border-2 border-white ${
          member.status === 'active' ? 'bg-green-500' : member.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
        }`}></span>
      </div>
      
      <h3 className="font-bold text-lg text-gray-800">{member.name}</h3>
      <p className={`text-xs font-medium px-2 py-0.5 rounded-full self-center my-2 ${statusStyles[member.status]}`}>
        {statusText[member.status]}
      </p>
      
      <div className="text-sm text-gray-600 capitalize mb-4">{member.membershipType}</div>
      
      <div className="text-left space-y-2 text-xs text-gray-500 border-t pt-3 mt-auto">
        <div className="flex items-center space-x-2">
          <Mail size={14} />
          <span>{member.email}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Phone size={14} />
          <span>{member.phone}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar size={14} />
          <span>Membro desde {format(member.joinDate, 'MMM yyyy', { locale: ptBR })}</span>
        </div>
      </div>

      <button 
        onClick={() => onEdit(member)} 
        className="mt-4 w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
      >
        <Edit size={14} />
        <span>Editar Perfil</span>
      </button>
    </motion.div>
  );
};

export default MemberCard;
