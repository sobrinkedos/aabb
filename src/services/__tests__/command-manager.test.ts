/**
 * Testes unitários para CommandManager
 */

import { CommandManager } from '../command-manager';
import { ComandaStatus, ItemStatus } from '../../types/sales-management';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { expect } from 'vitest';
import { it } from 'vitest';
import { describe } from 'vitest';
import { beforeEach } from 'vitest';
import { describe } from 'vitest';

describe('CommandManager', () => {
  let commandManager: CommandManager;

  beforeEach(() => {
    commandManager = new CommandManager();
  });

  describe('criarComanda', () => {
    it('deve criar uma nova comanda com dados básicos', async () => {
      const dadosComanda = {
        funcionario_id: 'func-123',
        quantidade_pessoas: 4,
        observacoes: 'Mesa próxima à janela'
      };

      const comanda = await commandManager.criarComanda(dadosComanda);

      expect(comanda.id).toBeDefined();
      expect(comanda.funcionario_id).toBe('func-123');
      expect(comanda.quantidade_pessoas).toBe(4);
      expect(comanda.status).toBe(ComandaStatus.ABERTA);
      expect(comanda.total).toBe(0);
      expect(comanda.observacoes).toBe('Mesa próxima à janela');
      expect(comanda.aberta_em).toBeDefined();
      expect(comanda.itens).toEqual([]);
    });

    it('deve criar comanda com mesa e cliente', async () => {
      const dadosComanda = {
        mesa_id: 'mesa-05',
        cliente_id: 'cliente-789',
        nome_cliente: 'João Silva',
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      };

      const comanda = await commandManager.criarComanda(dadosComanda);

      expect(comanda.mesa_id).toBe('mesa-05');
      expect(comanda.cliente_id).toBe('cliente-789');
      expect(comanda.nome_cliente).toBe('João Silva');
    });
  });

  describe('buscarComanda', () => {
    it('deve encontrar comanda existente', async () => {
      const dadosComanda = {
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      };

      const comandaCriada = await commandManager.criarComanda(dadosComanda);
      const comandaEncontrada = await commandManager.buscarComanda(comandaCriada.id);

      expect(comandaEncontrada).toBeDefined();
      expect(comandaEncontrada!.id).toBe(comandaCriada.id);
    });

    it('deve retornar undefined para comanda inexistente', async () => {
      const comandaEncontrada = await commandManager.buscarComanda('comanda-inexistente');
      expect(comandaEncontrada).toBeUndefined();
    });
  });

  describe('listarComandasAbertas', () => {
    it('deve listar apenas comandas abertas', async () => {
      // Criar comandas
      const comanda1 = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      const comanda2 = await commandManager.criarComanda({
        funcionario_id: 'func-456',
        quantidade_pessoas: 4
      });

      // Fechar uma comanda
      await commandManager.atualizarComanda(comanda2.id, {
        status: ComandaStatus.FECHADA
      });

      const comandasAbertas = await commandManager.listarComandasAbertas();

      expect(comandasAbertas).toHaveLength(1);
      expect(comandasAbertas[0].id).toBe(comanda1.id);
      expect(comandasAbertas[0].status).toBe(ComandaStatus.ABERTA);
    });

    it('deve retornar array vazio quando não há comandas abertas', async () => {
      const comandasAbertas = await commandManager.listarComandasAbertas();
      expect(comandasAbertas).toEqual([]);
    });
  });

  describe('atualizarComanda', () => {
    it('deve atualizar dados da comanda', async () => {
      const comanda = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      // Pequeno delay para garantir timestamp diferente
      await new Promise(resolve => setTimeout(resolve, 1));

      const comandaAtualizada = await commandManager.atualizarComanda(comanda.id, {
        quantidade_pessoas: 4,
        observacoes: 'Observação atualizada'
      });

      expect(comandaAtualizada.quantidade_pessoas).toBe(4);
      expect(comandaAtualizada.observacoes).toBe('Observação atualizada');
      expect(comandaAtualizada.updated_at).not.toBe(comanda.updated_at);
    });

    it('deve lançar erro para comanda inexistente', async () => {
      await expect(
        commandManager.atualizarComanda('comanda-inexistente', { quantidade_pessoas: 4 })
      ).rejects.toThrow('Comanda comanda-inexistente não encontrada');
    });

    it('deve lançar erro ao tentar atualizar comanda fechada', async () => {
      const comanda = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      // Fechar comanda
      await commandManager.atualizarComanda(comanda.id, {
        status: ComandaStatus.FECHADA
      });

      await expect(
        commandManager.atualizarComanda(comanda.id, { quantidade_pessoas: 4 })
      ).rejects.toThrow('Não é possível atualizar uma comanda fechada');
    });
  });

  describe('adicionarItem', () => {
    let comanda: any;

    beforeEach(async () => {
      comanda = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });
    });

    it('deve adicionar item à comanda', async () => {
      const dadosItem = {
        produto_id: 'prod-123',
        nome_produto: 'Hambúrguer Clássico',
        quantidade: 2,
        preco_unitario: 25.90,
        observacoes: 'Sem cebola'
      };

      const item = await commandManager.adicionarItem(comanda.id, dadosItem);

      expect(item.id).toBeDefined();
      expect(item.comanda_id).toBe(comanda.id);
      expect(item.produto_id).toBe('prod-123');
      expect(item.nome_produto).toBe('Hambúrguer Clássico');
      expect(item.quantidade).toBe(2);
      expect(item.preco_unitario).toBe(25.90);
      expect(item.preco_total).toBe(51.80);
      expect(item.status).toBe(ItemStatus.PENDENTE);
      expect(item.observacoes).toBe('Sem cebola');

      // Verificar se o item foi adicionado à comanda
      const comandaAtualizada = await commandManager.buscarComanda(comanda.id);
      expect(comandaAtualizada!.itens).toHaveLength(1);
      expect(comandaAtualizada!.total).toBe(51.80);
    });

    it('deve lançar erro para comanda inexistente', async () => {
      const dadosItem = {
        produto_id: 'prod-123',
        nome_produto: 'Produto',
        quantidade: 1,
        preco_unitario: 10.00
      };

      await expect(
        commandManager.adicionarItem('comanda-inexistente', dadosItem)
      ).rejects.toThrow('Comanda comanda-inexistente não encontrada');
    });

    it('deve lançar erro ao adicionar item em comanda não aberta', async () => {
      await commandManager.atualizarComanda(comanda.id, {
        status: ComandaStatus.FECHADA
      });

      const dadosItem = {
        produto_id: 'prod-123',
        nome_produto: 'Produto',
        quantidade: 1,
        preco_unitario: 10.00
      };

      await expect(
        commandManager.adicionarItem(comanda.id, dadosItem)
      ).rejects.toThrow('Só é possível adicionar itens em comandas abertas');
    });
  });

  describe('removerItem', () => {
    let comanda: any;
    let item: any;

    beforeEach(async () => {
      comanda = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      item = await commandManager.adicionarItem(comanda.id, {
        produto_id: 'prod-123',
        nome_produto: 'Produto',
        quantidade: 1,
        preco_unitario: 20.00
      });
    });

    it('deve remover item da comanda', async () => {
      const resultado = await commandManager.removerItem(comanda.id, item.id);

      expect(resultado).toBe(true);

      const comandaAtualizada = await commandManager.buscarComanda(comanda.id);
      expect(comandaAtualizada!.itens).toHaveLength(0);
      expect(comandaAtualizada!.total).toBe(0);
    });

    it('deve lançar erro ao tentar remover item em preparo', async () => {
      await commandManager.atualizarStatusItem(comanda.id, item.id, ItemStatus.PREPARANDO);

      await expect(
        commandManager.removerItem(comanda.id, item.id)
      ).rejects.toThrow('Não é possível remover itens que já estão sendo preparados');
    });

    it('deve lançar erro para item inexistente', async () => {
      await expect(
        commandManager.removerItem(comanda.id, 'item-inexistente')
      ).rejects.toThrow('Item item-inexistente não encontrado na comanda');
    });
  });

  describe('atualizarStatusItem', () => {
    let comanda: any;
    let item: any;

    beforeEach(async () => {
      comanda = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      item = await commandManager.adicionarItem(comanda.id, {
        produto_id: 'prod-123',
        nome_produto: 'Produto',
        quantidade: 1,
        preco_unitario: 20.00
      });
    });

    it('deve atualizar status do item corretamente', async () => {
      const itemAtualizado = await commandManager.atualizarStatusItem(
        comanda.id, 
        item.id, 
        ItemStatus.PREPARANDO
      );

      expect(itemAtualizado.status).toBe(ItemStatus.PREPARANDO);
    });

    it('deve atualizar timestamp ao marcar como pronto', async () => {
      await commandManager.atualizarStatusItem(comanda.id, item.id, ItemStatus.PREPARANDO);
      
      const itemPronto = await commandManager.atualizarStatusItem(
        comanda.id, 
        item.id, 
        ItemStatus.PRONTO
      );

      expect(itemPronto.status).toBe(ItemStatus.PRONTO);
      expect(itemPronto.preparado_em).toBeDefined();
    });

    it('deve atualizar timestamp ao marcar como entregue', async () => {
      await commandManager.atualizarStatusItem(comanda.id, item.id, ItemStatus.PREPARANDO);
      await commandManager.atualizarStatusItem(comanda.id, item.id, ItemStatus.PRONTO);
      
      const itemEntregue = await commandManager.atualizarStatusItem(
        comanda.id, 
        item.id, 
        ItemStatus.ENTREGUE
      );

      expect(itemEntregue.status).toBe(ItemStatus.ENTREGUE);
      expect(itemEntregue.entregue_em).toBeDefined();
    });

    it('deve lançar erro para transição inválida', async () => {
      await expect(
        commandManager.atualizarStatusItem(comanda.id, item.id, ItemStatus.ENTREGUE)
      ).rejects.toThrow('Transição de status inválida');
    });
  });

  describe('associarMesa', () => {
    it('deve associar mesa à comanda', async () => {
      const comanda = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      const comandaAtualizada = await commandManager.associarMesa(comanda.id, 'mesa-10');

      expect(comandaAtualizada.mesa_id).toBe('mesa-10');
    });
  });

  describe('associarCliente', () => {
    it('deve associar cliente à comanda', async () => {
      const comanda = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      const comandaAtualizada = await commandManager.associarCliente(
        comanda.id, 
        'cliente-456', 
        'Maria Santos'
      );

      expect(comandaAtualizada.cliente_id).toBe('cliente-456');
      expect(comandaAtualizada.nome_cliente).toBe('Maria Santos');
    });
  });

  describe('fecharComanda', () => {
    it('deve fechar comanda sem itens pendentes', async () => {
      const comanda = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      const comandaFechada = await commandManager.fecharComanda(comanda.id);

      expect(comandaFechada.status).toBe(ComandaStatus.PENDENTE_PAGAMENTO);
      expect(comandaFechada.fechada_em).toBeDefined();
    });

    it('deve lançar erro ao fechar comanda com itens pendentes', async () => {
      const comanda = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      await commandManager.adicionarItem(comanda.id, {
        produto_id: 'prod-123',
        nome_produto: 'Produto',
        quantidade: 1,
        preco_unitario: 20.00
      });

      await expect(
        commandManager.fecharComanda(comanda.id)
      ).rejects.toThrow('Não é possível fechar comanda com itens pendentes ou em preparo');
    });
  });

  describe('cancelarComanda', () => {
    it('deve cancelar comanda e seus itens', async () => {
      const comanda = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      const item = await commandManager.adicionarItem(comanda.id, {
        produto_id: 'prod-123',
        nome_produto: 'Produto',
        quantidade: 1,
        preco_unitario: 20.00
      });

      const comandaCancelada = await commandManager.cancelarComanda(
        comanda.id, 
        'Cliente desistiu'
      );

      expect(comandaCancelada.status).toBe(ComandaStatus.CANCELADA);
      expect(comandaCancelada.observacoes).toContain('Cancelada: Cliente desistiu');
      
      const comandaAtualizada = await commandManager.buscarComanda(comanda.id);
      expect(comandaAtualizada!.itens![0].status).toBe(ItemStatus.CANCELADO);
    });
  });

  describe('obterEstatisticas', () => {
    it('deve retornar estatísticas corretas', async () => {
      // Criar comandas
      const comanda1 = await commandManager.criarComanda({
        funcionario_id: 'func-123',
        quantidade_pessoas: 2
      });

      const comanda2 = await commandManager.criarComanda({
        funcionario_id: 'func-456',
        quantidade_pessoas: 4
      });

      // Adicionar itens
      await commandManager.adicionarItem(comanda1.id, {
        produto_id: 'prod-123',
        nome_produto: 'Produto 1',
        quantidade: 1,
        preco_unitario: 25.00
      });

      await commandManager.adicionarItem(comanda2.id, {
        produto_id: 'prod-456',
        nome_produto: 'Produto 2',
        quantidade: 2,
        preco_unitario: 15.00
      });

      const estatisticas = await commandManager.obterEstatisticas();

      expect(estatisticas.total_comandas_abertas).toBe(2);
      expect(estatisticas.total_itens_pendentes).toBe(2);
      expect(estatisticas.valor_total_comandas_abertas).toBe(55.00);
    });
  });

  describe('converterItensCarrinho', () => {
    it('deve converter itens do carrinho corretamente', () => {
      const itensCarrinho = [
        {
          produto_id: 'prod-123',
          nome_produto: 'Hambúrguer',
          quantidade: 2,
          preco_unitario: 25.90,
          preco_total: 51.80,
          categoria: 'Lanches',
          observacoes: 'Sem cebola'
        }
      ];

      const itensConvertidos = CommandManager.converterItensCarrinho(itensCarrinho);

      expect(itensConvertidos).toHaveLength(1);
      expect(itensConvertidos[0]).toEqual({
        produto_id: 'prod-123',
        nome_produto: 'Hambúrguer',
        quantidade: 2,
        preco_unitario: 25.90,
        observacoes: 'Sem cebola'
      });
    });
  });
});