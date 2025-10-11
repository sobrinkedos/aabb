import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { ValidatedForm, ValidatedInput, ValidatedSelect } from '../ValidatedForm';

// Schema de teste
const TestSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  age: z.number().min(18, 'Idade deve ser pelo menos 18 anos')
});

describe('ValidatedForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('deve renderizar o formulário corretamente', () => {
    render(
      <ValidatedForm schema={TestSchema} onSubmit={mockOnSubmit}>
        {({ data, updateField, getFieldError, handleSubmit }) => (
          <>
            <ValidatedInput
              label="Nome"
              value={data.name}
              onChange={(value) => updateField('name', value)}
              error={getFieldError('name')}
            />
            <button type="submit" onClick={handleSubmit}>
              Enviar
            </button>
          </>
        )}
      </ValidatedForm>
    );

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
  });

  it('deve validar campos obrigatórios', async () => {
    render(
      <ValidatedForm schema={TestSchema} onSubmit={mockOnSubmit}>
        {({ data, updateField, getFieldError, handleSubmit }) => (
          <>
            <ValidatedInput
              label="Nome"
              value={data.name}
              onChange={(value) => updateField('name', value)}
              error={getFieldError('name')}
            />
            <ValidatedInput
              label="Email"
              type="email"
              value={data.email}
              onChange={(value) => updateField('email', value)}
              error={getFieldError('email')}
            />
            <button type="submit" onClick={handleSubmit}>
              Enviar
            </button>
          </>
        )}
      </ValidatedForm>
    );

    // Tentar submeter formulário vazio
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('deve validar formato de email', async () => {
    render(
      <ValidatedForm schema={TestSchema} onSubmit={mockOnSubmit}>
        {({ data, updateField, getFieldError, handleSubmit }) => (
          <>
            <ValidatedInput
              label="Email"
              type="email"
              value={data.email}
              onChange={(value) => updateField('email', value)}
              error={getFieldError('email')}
            />
            <button type="submit" onClick={handleSubmit}>
              Enviar
            </button>
          </>
        )}
      </ValidatedForm>
    );

    const emailInput = screen.getByLabelText('Email');
    
    // Inserir email inválido
    fireEvent.change(emailInput, { target: { value: 'email-invalido' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('deve submeter dados válidos', async () => {
    render(
      <ValidatedForm schema={TestSchema} onSubmit={mockOnSubmit}>
        {({ data, updateField, getFieldError, handleSubmit }) => (
          <>
            <ValidatedInput
              label="Nome"
              value={data.name}
              onChange={(value) => updateField('name', value)}
              error={getFieldError('name')}
            />
            <ValidatedInput
              label="Email"
              type="email"
              value={data.email}
              onChange={(value) => updateField('email', value)}
              error={getFieldError('email')}
            />
            <ValidatedInput
              label="Idade"
              type="number"
              value={data.age}
              onChange={(value) => updateField('age', parseInt(value))}
              error={getFieldError('age')}
            />
            <button type="submit" onClick={handleSubmit}>
              Enviar
            </button>
          </>
        )}
      </ValidatedForm>
    );

    // Preencher dados válidos
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'João Silva' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'joao@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Idade'), { target: { value: '25' } });

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'João Silva',
        email: 'joao@exemplo.com',
        age: 25
      });
    });
  });

  it('deve limpar erros quando o usuário começar a digitar', async () => {
    render(
      <ValidatedForm schema={TestSchema} onSubmit={mockOnSubmit}>
        {({ data, updateField, getFieldError, handleSubmit }) => (
          <>
            <ValidatedInput
              label="Nome"
              value={data.name}
              onChange={(value) => updateField('name', value)}
              error={getFieldError('name')}
            />
            <button type="submit" onClick={handleSubmit}>
              Enviar
            </button>
          </>
        )}
      </ValidatedForm>
    );

    // Submeter formulário para gerar erro
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => {
      expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
    });

    // Começar a digitar deve limpar o erro
    const nameInput = screen.getByLabelText('Nome');
    fireEvent.change(nameInput, { target: { value: 'J' } });

    await waitFor(() => {
      expect(screen.queryByText('Nome deve ter pelo menos 2 caracteres')).not.toBeInTheDocument();
    });
  });
});

describe('ValidatedInput', () => {
  it('deve exibir erro quando fornecido', () => {
    render(
      <ValidatedInput
        label="Nome"
        value=""
        onChange={() => {}}
        error="Campo obrigatório"
      />
    );

    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
    expect(screen.getByLabelText('Nome')).toHaveClass('border-red-300');
  });

  it('deve exibir asterisco para campos obrigatórios', () => {
    render(
      <ValidatedInput
        label="Nome"
        required
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('deve estar desabilitado quando disabled=true', () => {
    render(
      <ValidatedInput
        label="Nome"
        disabled
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText('Nome')).toBeDisabled();
    expect(screen.getByLabelText('Nome')).toHaveClass('bg-gray-100');
  });
});

describe('ValidatedSelect', () => {
  const options = [
    { value: 'option1', label: 'Opção 1' },
    { value: 'option2', label: 'Opção 2' }
  ];

  it('deve renderizar opções corretamente', () => {
    render(
      <ValidatedSelect
        label="Selecione"
        options={options}
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Opção 1')).toBeInTheDocument();
    expect(screen.getByText('Opção 2')).toBeInTheDocument();
  });

  it('deve exibir placeholder', () => {
    render(
      <ValidatedSelect
        label="Selecione"
        options={options}
        placeholder="Escolha uma opção"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Escolha uma opção')).toBeInTheDocument();
  });

  it('deve chamar onChange quando selecionado', () => {
    const mockOnChange = jest.fn();
    
    render(
      <ValidatedSelect
        label="Selecione"
        options={options}
        value=""
        onChange={mockOnChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Selecione'), { target: { value: 'option1' } });
    expect(mockOnChange).toHaveBeenCalledWith('option1');
  });
});