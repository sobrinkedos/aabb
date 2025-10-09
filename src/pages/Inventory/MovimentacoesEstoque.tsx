import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Filter,
    Package,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

interface Movement {
    id: string;
    movement_type: string;
    quantity: number;
    stock_before: number;
    stock_after: number;
    notes: string | null;
    reference_document: string | null;
    created_at: string;
    inventory_item?: {
        name: string;
        unit: string;
    };
}

const movementTypeLabels: Record<string, string> = {
    'entrada_compra': 'Compra',
    'entrada_ajuste': 'Ajuste de Entrada',
    'entrada_devolucao': 'Devolução',
    'saida_venda': 'Venda',
    'saida_perda': 'Perda/Quebra',
    'saida_ajuste': 'Ajuste de Saída',
    'saida_transferencia': 'Transferência'
};

export default function MovimentacoesEstoque() {
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');
    const [filterItem, setFilterItem] = useState<string>('');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    useEffect(() => {
        loadMovements();
    }, [filterType, filterItem, dateFrom, dateTo]);

    const loadMovements = async () => {
        setLoading(true);
        try {
            console.log('🔍 Carregando movimentações...');

            let query = supabase
                .from('inventory_movements')
                .select(`
          *,
          inventory_item:inventory_items(name, unit)
        `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (filterType !== 'all') {
                if (filterType === 'entrada') {
                    query = query.like('movement_type', 'entrada_%');
                } else if (filterType === 'saida') {
                    query = query.like('movement_type', 'saida_%');
                }
            }

            if (dateFrom) {
                query = query.gte('created_at', new Date(dateFrom).toISOString());
            }

            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59);
                query = query.lte('created_at', endDate.toISOString());
            }

            const { data, error } = await query;

            console.log('📊 Resultado da query:', { data, error, count: data?.length });

            if (error) {
                console.error('❌ Erro na query:', error);
                throw error;
            }

            setMovements(data || []);
            console.log('✅ Movimentações carregadas:', data?.length || 0);
        } catch (error) {
            console.error('❌ Erro ao carregar movimentações:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        totalEntradas: movements.filter(m => m.movement_type.startsWith('entrada_')).length,
        totalSaidas: movements.filter(m => m.movement_type.startsWith('saida_')).length,
        quantidadeEntrada: movements
            .filter(m => m.movement_type.startsWith('entrada_'))
            .reduce((sum, m) => sum + Number(m.quantity), 0),
        quantidadeSaida: movements
            .filter(m => m.movement_type.startsWith('saida_'))
            .reduce((sum, m) => sum + Number(m.quantity), 0),
    };

    const isEntrada = (type: string) => type.startsWith('entrada_');

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Movimentações de Estoque</h1>
                    <p className="text-gray-600 mt-1">Histórico completo de entradas e saídas</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Entradas</p>
                                <p className="text-2xl font-bold text-green-600">{stats.totalEntradas}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Saídas</p>
                                <p className="text-2xl font-bold text-red-600">{stats.totalSaidas}</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-red-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Qtd. Entrada</p>
                                <p className="text-2xl font-bold text-green-600">{stats.quantidadeEntrada.toFixed(2)}</p>
                            </div>
                            <ArrowUpCircle className="h-8 w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Qtd. Saída</p>
                                <p className="text-2xl font-bold text-red-600">{stats.quantidadeSaida.toFixed(2)}</p>
                            </div>
                            <ArrowDownCircle className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-5 w-5 text-gray-500" />
                        <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Todos</option>
                                <option value="entrada">Entradas</option>
                                <option value="saida">Saídas</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data Inicial
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data Final
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilterType('all');
                                    setFilterItem('');
                                    setDateFrom('');
                                    setDateTo('');
                                }}
                                className="w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Limpar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* Movements List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Movimentações ({movements.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : movements.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma movimentação encontrada</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {movements.map((movement) => {
                                const isEntry = isEntrada(movement.movement_type);
                                return (
                                    <div
                                        key={movement.id}
                                        className="p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className="flex-shrink-0 mt-1">
                                                {isEntry ? (
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <ArrowUpCircle className="h-6 w-6 text-green-600" />
                                                    </div>
                                                ) : (
                                                    <div className="p-2 bg-red-100 rounded-lg">
                                                        <ArrowDownCircle className="h-6 w-6 text-red-600" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span
                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isEntry
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                    }`}
                                                            >
                                                                {movementTypeLabels[movement.movement_type] || movement.movement_type}
                                                            </span>
                                                            <span className="text-lg font-semibold text-gray-900">
                                                                {movement.inventory_item?.name || 'Item não encontrado'}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2 text-sm">
                                                            <div>
                                                                <span className="text-gray-500">Quantidade:</span>
                                                                <span className="ml-2 font-medium text-gray-900">
                                                                    {movement.quantity} {movement.inventory_item?.unit || ''}
                                                                </span>
                                                            </div>

                                                            <div>
                                                                <span className="text-gray-500">Estoque:</span>
                                                                <span className="ml-2 font-medium text-gray-900">
                                                                    {movement.stock_before} → {movement.stock_after}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {(movement.reference_document || movement.notes) && (
                                                            <div className="mt-2 text-sm text-gray-600 space-y-1">
                                                                {movement.reference_document && (
                                                                    <div>
                                                                        <span className="font-medium">Referência:</span> {movement.reference_document}
                                                                    </div>
                                                                )}
                                                                {movement.notes && (
                                                                    <div>
                                                                        <span className="font-medium">Obs:</span> {movement.notes}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Date */}
                                                    <div className="flex-shrink-0 text-right">
                                                        <div className="text-sm text-gray-500">
                                                            {format(new Date(movement.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {format(new Date(movement.created_at), 'HH:mm', { locale: ptBR })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
