import React, { useState, useEffect } from 'react';
import servicoService, { type Servico } from '../services/servicoService';

const GerenciarServicos = () => {
    const [servicos, setServicos] = useState<Servico[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [novoServico, setNovoServico] = useState({
        nome: '',
        descricao: '',
        preco: '',
        duracao: '',
        ativo: true,
    });

    const [servicoEditando, setServicoEditando] = useState<string | null>(null);

    useEffect(() => {
        carregarServicos();
    }, []);

    const carregarServicos = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await servicoService.getAllServicos();
            setServicos(data);
        } catch (err: any) {
            console.error('Erro ao carregar serviços:', err);
            setError(err.message || 'Erro ao carregar serviços');
            setServicos([]); // Define array vazio em caso de erro
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setNovoServico(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!novoServico.nome || !novoServico.preco || !novoServico.duracao) {
            setError('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const servicoData = {
                nome: novoServico.nome,
                descricao: novoServico.descricao || null,
                preco: parseFloat(novoServico.preco),
                duracao: parseInt(novoServico.duracao),
                ativo: novoServico.ativo,
            };

            if (servicoEditando) {
                await servicoService.updateServico(servicoEditando, servicoData);
                setMessage('Serviço atualizado com sucesso!');
                setServicoEditando(null);
            } else {
                await servicoService.createServico(servicoData);
                setMessage('Serviço cadastrado com sucesso!');
            }

            setNovoServico({ nome: '', descricao: '', preco: '', duracao: '', ativo: true });
            carregarServicos();
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar serviço');
        }
    };

    const handleEditar = (servico: Servico) => {
        setServicoEditando(servico.id);
        setNovoServico({
            nome: servico.nome,
            descricao: servico.descricao || '',
            preco: servico.preco.toString(),
            duracao: servico.duracao.toString(),
            ativo: servico.ativo,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelarEdicao = () => {
        setServicoEditando(null);
        setNovoServico({ nome: '', descricao: '', preco: '', duracao: '', ativo: true });
    };

    const handleDeletar = async (id: string, nome: string) => {
        if (!window.confirm(`Tem certeza que deseja deletar o serviço "${nome}"?`)) {
            return;
        }

        try {
            await servicoService.deleteServico(id);
            setMessage('Serviço deletado com sucesso!');
            carregarServicos();
        } catch (err: any) {
            setError(err.message || 'Erro ao deletar serviço');
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await servicoService.toggleServico(id);
            setMessage('Status do serviço alterado!');
            carregarServicos();
        } catch (err: any) {
            setError(err.message || 'Erro ao alternar status');
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Gerenciar Serviços</h2>

            {/* Formulário */}
            <div style={styles.formSection}>
                <h3 style={styles.subtitle}>
                    {servicoEditando ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}
                </h3>

                {message && <div style={styles.successMessage}>{message}</div>}
                {error && <div style={styles.errorMessage}>{error}</div>}

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Nome *</label>
                            <input
                                type="text"
                                name="nome"
                                value={novoServico.nome}
                                onChange={handleInputChange}
                                style={styles.input}
                                placeholder="Ex: Corte de Cabelo"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Preço (R$) *</label>
                            <input
                                type="number"
                                name="preco"
                                value={novoServico.preco}
                                onChange={handleInputChange}
                                style={styles.input}
                                placeholder="50.00"
                                step="0.01"
                                min="0"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Duração (min) *</label>
                            <input
                                type="number"
                                name="duracao"
                                value={novoServico.duracao}
                                onChange={handleInputChange}
                                style={styles.input}
                                placeholder="60"
                                min="1"
                            />
                        </div>
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Descrição</label>
                        <textarea
                            name="descricao"
                            value={novoServico.descricao}
                            onChange={handleInputChange}
                            style={styles.textarea}
                            placeholder="Descrição do serviço (opcional)"
                            rows={3}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="ativo"
                                checked={novoServico.ativo}
                                onChange={handleInputChange}
                                style={styles.checkbox}
                            />
                            Serviço ativo (visível no bot)
                        </label>
                    </div>

                    <div style={styles.buttonGroup}>
                        <button type="submit" style={styles.submitButton}>
                            {servicoEditando ? 'Atualizar Serviço' : 'Cadastrar Serviço'}
                        </button>
                        {servicoEditando && (
                            <button
                                type="button"
                                onClick={handleCancelarEdicao}
                                style={styles.cancelButton}
                            >
                                Cancelar Edição
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Lista de Serviços */}
            <div style={styles.listSection}>
                <h3 style={styles.subtitle}>Serviços Cadastrados</h3>

                {loading ? (
                    <p>Carregando serviços...</p>
                ) : servicos.length === 0 ? (
                    <p>Nenhum serviço cadastrado ainda.</p>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Nome</th>
                                <th style={styles.th}>Descrição</th>
                                <th style={styles.th}>Preço</th>
                                <th style={styles.th}>Duração</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {servicos.map(servico => (
                                <tr key={servico.id} style={styles.tr}>
                                    <td style={styles.td}>{servico.nome}</td>
                                    <td style={styles.td}>{servico.descricao || '-'}</td>
                                    <td style={styles.td}>R$ {servico.preco.toFixed(2)}</td>
                                    <td style={styles.td}>{servico.duracao} min</td>
                                    <td style={styles.td}>
                                        <span style={servico.ativo ? styles.statusAtivo : styles.statusInativo}>
                                            {servico.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.actionButtons}>
                                            <button
                                                onClick={() => handleToggle(servico.id)}
                                                style={styles.toggleButton}
                                                title={servico.ativo ? 'Desativar' : 'Ativar'}
                                            >
                                                {servico.ativo ? '👁️' : '🚫'}
                                            </button>
                                            <button
                                                onClick={() => handleEditar(servico)}
                                                style={styles.editButton}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeletar(servico.id, servico.nome)}
                                                style={styles.deleteButton}
                                                title="Deletar"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '20px',
    },
    title: {
        color: '#333',
        marginBottom: '30px',
    },
    subtitle: {
        color: '#555',
        marginBottom: '15px',
        fontSize: '18px',
    },
    formSection: {
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as 'column',
        gap: '15px',
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '15px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column' as 'column',
    },
    label: {
        marginBottom: '5px',
        fontWeight: 'bold' as 'bold',
        color: '#333',
    },
    input: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
    },
    textarea: {
        padding: '10px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
        resize: 'vertical' as 'vertical',
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
    },
    checkbox: {
        width: '18px',
        height: '18px',
        cursor: 'pointer',
    },
    buttonGroup: {
        display: 'flex',
        gap: '10px',
    },
    submitButton: {
        padding: '12px 24px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold' as 'bold',
    },
    cancelButton: {
        padding: '12px 24px',
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    successMessage: {
        padding: '10px',
        backgroundColor: '#d4edda',
        color: '#155724',
        borderRadius: '4px',
        marginBottom: '15px',
    },
    errorMessage: {
        padding: '10px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '4px',
        marginBottom: '15px',
    },
    listSection: {
        backgroundColor: '#fff',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse' as 'collapse',
        marginTop: '15px',
    },
    th: {
        backgroundColor: '#f1f3f5',
        padding: '12px',
        textAlign: 'left' as 'left',
        borderBottom: '2px solid #dee2e6',
        fontWeight: 'bold' as 'bold',
    },
    tr: {
        borderBottom: '1px solid #dee2e6',
    },
    td: {
        padding: '12px',
    },
    statusAtivo: {
        padding: '4px 8px',
        backgroundColor: '#d4edda',
        color: '#155724',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold' as 'bold',
    },
    statusInativo: {
        padding: '4px 8px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold' as 'bold',
    },
    actionButtons: {
        display: 'flex',
        gap: '8px',
    },
    toggleButton: {
        padding: '6px 10px',
        backgroundColor: '#17a2b8',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    editButton: {
        padding: '6px 10px',
        backgroundColor: '#ffc107',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
    },
    deleteButton: {
        padding: '6px 10px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '16px',
    },
};

export default GerenciarServicos;
