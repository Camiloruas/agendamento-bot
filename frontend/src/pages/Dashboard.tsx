import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import agendamentoService from '../services/agendamentoService';
import clienteService from '../services/clienteService';
import profissionalService from '../services/profissionalService'; // Importa o serviço de profissional
import servicoService, { type Servico } from '../services/servicoService'; // Importa o serviço de serviços

interface Agendamento {
  id: string;
  profissionalId: string;
  clienteId: string;
  dataHora: string; // Formato ISO string, e.g., "2025-11-28T10:00:00.000Z"
  servico: string;
  status: string;
  cliente?: {
    nome: string;
    telefone: string;
  };
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

interface ProfissionalProfile {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard = () => {
  const [activeSection, setActiveSection] = useState('visaoGeral');
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]); // Para Visão Geral
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  // Estados para a seção de Agenda Diária  
  const todayISO = new Date().toISOString().split('T')[0];
  const [agendaDate, setAgendaDate] = useState<string>(todayISO);
  const [agendaAgendamentos, setAgendaAgendamentos] = useState<Agendamento[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaError, setAgendaError] = useState('');

  // Estados para a seção de Cadastrar Agendamento Manual
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clientesError, setClientesError] = useState('');
  const [newAppointmentData, setNewAppointmentData] = useState({
    data: todayISO,
    hora: '09:00',
    clienteId: '',
    servico: '',
    descricao: '',
  });
  const [newAppointmentLoading, setNewAppointmentLoading] = useState(false);
  const [newAppointmentMessage, setNewAppointmentMessage] = useState('');

  // Estados para Serviços Dinâmicos
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [servicosLoading, setServicosLoading] = useState(false);
  const [servicosError, setServicosError] = useState('');

  // Estados para Gerenciamento de Serviços
  const [todosServicos, setTodosServicos] = useState<Servico[]>([]);
  const [servicosGerenciarLoading, setServicosGerenciarLoading] = useState(false);
  const [servicosGerenciarError, setServicosGerenciarError] = useState('');
  const [novoServico, setNovoServico] = useState({
    nome: '',
    descricao: '',
    preco: '',
    duracao: '',
    ativo: true,
  });
  const [servicoEditando, setServicoEditando] = useState<string | null>(null);
  const [servicoMessage, setServicoMessage] = useState('');

  // Estados para a seção de Configurações da Conta
  const [profileData, setProfileData] = useState<ProfissionalProfile | null>(null);
  const [profileEditData, setProfileEditData] = useState({ nome: '', email: '', telefone: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  const [passwordChangeData, setPasswordChangeData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');


  // Efeito para buscar todos os agendamentos (Visão Geral)
  useEffect(() => {
    const fetchAllAgendamentos = async () => {
      try {
        const data = await agendamentoService.getAllAgendamentos();
        setAgendamentos(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar agendamentos.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllAgendamentos();
  }, []);

  // Efeito para buscar agendamentos por data (Agenda Diária)
  useEffect(() => {
    const fetchAgendamentosBySelectedDate = async () => {
      if (activeSection === 'agenda' && agendaDate) {
        setAgendaLoading(true);
        setAgendaError('');
        try {
          const data = await agendamentoService.getAgendamentosByDate(agendaDate);
          setAgendaAgendamentos(data);
        } catch (err: any) {
          setAgendaError(err.message || `Erro ao carregar agendamentos para a data ${agendaDate}.`);
        } finally {
          setAgendaLoading(false);
        }
      }
    };

    fetchAgendamentosBySelectedDate();
  }, [activeSection, agendaDate]);

  // Efeito para buscar clientes quando a seção de cadastro de agendamento manual está ativa
  useEffect(() => {
    const fetchClientes = async () => {
      if (activeSection === 'cadastrarAgendamento') {
        setClientesLoading(true);
        setClientesError('');
        try {
          const data = await clienteService.getAllClientes();
          setClientes(data);
          if (data.length > 0) {
            setNewAppointmentData(prev => ({ ...prev, clienteId: data[0].id })); // Seleciona o primeiro cliente por padrão
          }
        } catch (err: any) {
          setClientesError(err.message || 'Erro ao carregar lista de clientes.');
        } finally {
          setClientesLoading(false);
        }
      }
    };

    fetchClientes();
    fetchClientes();
  }, [activeSection]);

  // Efeito para buscar serviços quando a seção de cadastro de agendamento manual está ativa
  useEffect(() => {
    const fetchServicos = async () => {
      if (activeSection === 'cadastrarAgendamento') {
        setServicosLoading(true);
        setServicosError('');
        try {
          const data = await servicoService.getAllServices();
          setServicos(data);
          if (data.length > 0) {
            // Opcional: selecionar o primeiro serviço por padrão
            // setNewAppointmentData(prev => ({ ...prev, servico: data[0].nome }));
          }
        } catch (err: any) {
          setServicosError(err.message || 'Erro ao carregar lista de serviços.');
        } finally {
          setServicosLoading(false);
        }
      }
    };

    fetchServicos();
  }, [activeSection]);

  // Efeito para buscar perfil do profissional quando a seção de Configurações da Conta está ativa
  useEffect(() => {
    const fetchProfile = async () => {
      if (activeSection === 'configuracoesConta') {
        setProfileLoading(true);
        setProfileError('');
        try {
          const data = await profissionalService.getProfissionalProfile();
          setProfileData(data);
          setProfileEditData({ nome: data.nome, email: data.email, telefone: data.telefone });
        } catch (err: any) {
          setProfileError(err.message || 'Erro ao carregar perfil do profissional.');
        } finally {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();
  }, [activeSection]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('profissional');
    navigate('/login');
  };

  const getTodayAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return agendamentos.filter(ag => {
      const agDate = new Date(ag.dataHora);
      agDate.setHours(0, 0, 0, 0);
      return agDate.getTime() === today.getTime();
    });
  };

  const getNextAppointment = () => {
    const now = new Date();
    const futureAppointments = agendamentos.filter(ag => new Date(ag.dataHora) > now);
    futureAppointments.sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
    return futureAppointments[0] || null;
  };

  // Função para obter agendamentos dos próximos 7 dias
  const getWeekAppointments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekLater = new Date(today);
    weekLater.setDate(weekLater.getDate() + 7);

    return agendamentos.filter(ag => {
      const agDate = new Date(ag.dataHora);
      return agDate >= today && agDate < weekLater;
    });
  };

  // Função para agrupar agendamentos por dia
  const groupAppointmentsByDay = (appointments: Agendamento[]) => {
    const grouped: { [date: string]: Agendamento[] } = {};

    appointments.forEach(ag => {
      const date = new Date(ag.dataHora).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(ag);
    });

    // Ordenar agendamentos dentro de cada dia por horário
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime());
    });

    return grouped;
  };

  const handleNewAppointmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAppointmentData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewAppointmentMessage('');
    setNewAppointmentLoading(true);

    const { data, hora, clienteId, servico, descricao } = newAppointmentData;

    if (!data || !hora || !clienteId || !servico) {
      setNewAppointmentMessage('Por favor, preencha todos os campos obrigatórios (Data, Hora, Cliente, Serviço).');
      setNewAppointmentLoading(false);
      return;
    }

    try {
      const dataHora = `${data}T${hora}:00.000Z`; // Concatena data e hora e formata para ISO string
      await agendamentoService.createAgendamento({
        dataHora,
        clienteId,
        servico,
        descricao: descricao || undefined,
      });
      setNewAppointmentMessage('Agendamento criado com sucesso!');
      // Opcional: recarregar todos os agendamentos ou atualizar o estado local
      // (aqui, apenas limpamos o formulário para um novo agendamento)
      setNewAppointmentData({
        data: todayISO,
        hora: '09:00',
        clienteId: clientes.length > 0 ? clientes[0].id : '',
        servico: '',
        descricao: '',
      });
      // Forçar recarregamento de todos os agendamentos para atualizar as visões
      setLoading(true);
      setError('');
      agendamentoService.getAllAgendamentos().then(setAgendamentos).catch(setError).finally(() => setLoading(false));

    } catch (err: any) {
      setNewAppointmentMessage(err.message || 'Erro ao criar agendamento.');
    } finally {
      setNewAppointmentLoading(false);
    }
  };

  const handleProfileEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setProfileLoading(true);
    try {
      const updatedProfile = await profissionalService.updateProfissionalProfile(profileEditData);
      setProfileData(updatedProfile); // Atualiza os dados do perfil exibidos
      setProfileMessage('Perfil atualizado com sucesso!');
    } catch (err: any) {
      setProfileError(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordChangeData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    setPasswordLoading(true);
    if (passwordChangeData.newPassword !== passwordChangeData.confirmNewPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      setPasswordLoading(false);
      return;
    }
    try {
      await profissionalService.changeProfissionalPassword({
        currentPassword: passwordChangeData.currentPassword,
        newPassword: passwordChangeData.newPassword,
      });
      setPasswordMessage('Senha alterada com sucesso!');
      setPasswordChangeData({ currentPassword: '', newPassword: '', confirmNewPassword: '' }); // Limpa o formulário
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao alterar senha.');
    } finally {
      setPasswordLoading(false);
    }
  };


  const renderSection = () => {
    switch (activeSection) {
      case 'visaoGeral':
        if (loading) {
          return <p style={styles.message}>Carregando agendamentos...</p>;
        }
        if (error) {
          return <p style={styles.errorMessage}>{error}</p>;
        }
        const todayAppointments = getTodayAppointments();
        const nextAppointment = getNextAppointment();
        return (
          <div>
            <h2 style={styles.sectionTitle}>Visão Geral do Dia</h2>
            {nextAppointment ? (
              <p>Próximo agendamento: {new Date(nextAppointment.dataHora).toLocaleString()} - {nextAppointment.cliente?.nome || 'Cliente Desconhecido'} ({nextAppointment.servico})</p>
            ) : (
              <p>Nenhum próximo agendamento.</p>
            )}
            <p>Total de agendamentos hoje: {todayAppointments.length}</p>
            {todayAppointments.length > 0 && (
              <div>
                <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Agendamentos de Hoje:</h3>
                <ul style={styles.appointmentList}>
                  {todayAppointments.map(ag => (
                    <li key={ag.id} style={styles.appointmentItem}>
                      {new Date(ag.dataHora).toLocaleTimeString()} - {ag.cliente?.nome || 'Cliente Desconhecido'} ({ag.servico})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      case 'agenda':
        const weekAppointments = getWeekAppointments();
        const groupedAppointments = groupAppointmentsByDay(weekAppointments);
        const sortedDates = Object.keys(groupedAppointments).sort();

        return (
          <div>
            <h2 style={styles.sectionTitle}>Agenda Semanal</h2>
            {loading ? (
              <p style={styles.message}>Carregando agenda...</p>
            ) : error ? (
              <p style={styles.errorMessage}>{error}</p>
            ) : sortedDates.length > 0 ? (
              <div>
                {sortedDates.map(date => {
                  const dateObj = new Date(date + 'T00:00:00');
                  const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                  const formattedDate = dateObj.toLocaleDateString('pt-BR');

                  return (
                    <div key={date} style={styles.daySection}>
                      <h3 style={styles.dayTitle}>
                        {dayName.charAt(0).toUpperCase() + dayName.slice(1)} - {formattedDate}
                      </h3>
                      <ul style={styles.appointmentList}>
                        {groupedAppointments[date].map(ag => (
                          <li key={ag.id} style={styles.appointmentItem}>
                            {new Date(ag.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {ag.cliente?.nome || 'Cliente Desconhecido'} ({ag.servico}) - {ag.status}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p>Nenhum agendamento nos próximos 7 dias.</p>
            )}
          </div>
        );
      case 'cadastrarAgendamento':
        return (
          <div>
            <h2 style={styles.sectionTitle}>Cadastrar Agendamento Manual</h2>
            <form onSubmit={handleCreateAppointment} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="appointmentDate" style={styles.label}>Data:</label>
                <input
                  type="date"
                  id="appointmentDate"
                  name="data"
                  value={newAppointmentData.data}
                  onChange={handleNewAppointmentChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="appointmentTime" style={styles.label}>Hora:</label>
                <input
                  type="time"
                  id="appointmentTime"
                  name="hora"
                  value={newAppointmentData.hora}
                  onChange={handleNewAppointmentChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="clienteId" style={styles.label}>Cliente:</label>
                {clientesLoading ? (
                  <p>Carregando clientes...</p>
                ) : clientesError ? (
                  <p style={styles.errorMessage}>{clientesError}</p>
                ) : (
                  <select
                    id="clienteId"
                    name="clienteId"
                    value={newAppointmentData.clienteId}
                    onChange={handleNewAppointmentChange}
                    required
                    style={styles.input}
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="servico" style={styles.label}>Serviço:</label>

                {servicosLoading ? (
                  <p>Carregando serviços...</p>
                ) : servicosError ? (
                  <p style={styles.errorMessage}>{servicosError}</p>
                ) : (
                  <select
                    id="servico"
                    name="servico"
                    value={newAppointmentData.servico}
                    onChange={handleNewAppointmentChange}
                    required
                    style={styles.input}
                  >
                    <option value="">Selecione um serviço</option>
                    {servicos.map(servico => (
                      <option key={servico.id} value={servico.nome}>
                        {servico.nome} - R$ {servico.preco}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="descricao" style={styles.label}>Descrição (Opcional):</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={newAppointmentData.descricao}
                  onChange={handleNewAppointmentChange}
                  style={styles.textarea}
                ></textarea>
              </div>
              <button type="submit" style={styles.button} disabled={newAppointmentLoading}>
                {newAppointmentLoading ? 'Criando...' : 'Criar Agendamento'}
              </button>
            </form>
            {newAppointmentMessage && <p style={styles.message}>{newAppointmentMessage}</p>}
          </div>
        );
      case 'configuracoesAgenda':
        return (
          <div>
            <h2 style={styles.sectionTitle}>Configurações da Agenda</h2>
            <p>Você pode editar seus dias e horários de trabalho <a href="/onboarding" style={styles.link}>clicando aqui.</a></p>
          </div>
        );
      case 'configuracoesConta':
        return (
          <div>
            <h2 style={styles.sectionTitle}>Configurações da Conta</h2>

            {/* Formulário de Dados Pessoais */}
            <h3 style={styles.subSectionTitle}>Dados Pessoais</h3>
            {profileLoading ? (
              <p style={styles.message}>Carregando perfil...</p>
            ) : profileError ? (
              <p style={styles.errorMessage}>{profileError}</p>
            ) : profileData ? (
              <form onSubmit={handleUpdateProfile} style={styles.form}>
                <div style={styles.formGroup}>
                  <label htmlFor="nome" style={styles.label}>Nome:</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={profileEditData.nome}
                    onChange={handleProfileEditChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="email" style={styles.label}>Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileEditData.email}
                    onChange={handleProfileEditChange}
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="telefone" style={styles.label}>Telefone:</label>
                  <input
                    type="text"
                    id="telefone"
                    name="telefone"
                    value={profileEditData.telefone}
                    onChange={handleProfileEditChange}
                    required
                    style={styles.input}
                  />
                </div>
                <button type="submit" style={styles.button} disabled={profileLoading}>
                  {profileLoading ? 'Salvando...' : 'Atualizar Perfil'}
                </button>
              </form>
            ) : null}
            {profileMessage && <p style={styles.message}>{profileMessage}</p>}


            {/* Formulário de Alteração de Senha */}
            <h3 style={{ ...styles.subSectionTitle, marginTop: '40px' }}>Alterar Senha</h3>
            <form onSubmit={handleChangePassword} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="currentPassword" style={styles.label}>Senha Atual:</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordChangeData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="newPassword" style={styles.label}>Nova Senha:</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordChangeData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="confirmNewPassword" style={styles.label}>Confirmar Nova Senha:</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  value={passwordChangeData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  required
                  style={styles.input}
                />
              </div>
              <button type="submit" style={styles.button} disabled={passwordLoading}>
                {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </form>
            {passwordMessage && <p style={styles.message}>{passwordMessage}</p>}
            {passwordError && <p style={styles.errorMessage}>{passwordError}</p>}
          </div>
        );
      case 'planoAssinatura':
        return (
          <div>
            <h2 style={styles.sectionTitle}>Plano / Assinatura</h2>
            <p style={styles.message}>
              Gerencie seus planos de assinatura aqui. Atualmente, esta funcionalidade está em desenvolvimento.
              Em breve, você poderá visualizar seu plano atual, histórico de pagamentos e opções de upgrade.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.dashboardContainer}>
      <div style={styles.sidebar}>
        <h1 style={styles.logo}>Meu Agendamento</h1>
        <nav>
          <ul style={styles.navList}>
            <li style={styles.navItem}>
              <a href="#" style={styles.navLink(activeSection === 'visaoGeral')} onClick={() => setActiveSection('visaoGeral')}>Visão Geral</a>
            </li>
            <li style={styles.navItem}>
              <a href="#" style={styles.navLink(activeSection === 'agenda')} onClick={() => setActiveSection('agenda')}>Agenda</a>
            </li>
            <li style={styles.navItem}>
              <a href="#" style={styles.navLink(activeSection === 'cadastrarAgendamento')} onClick={() => setActiveSection('cadastrarAgendamento')}>Novo Agendamento</a>
            </li>
            <li style={styles.navItem}>
              <a href="#" style={styles.navLink(activeSection === 'configuracoesAgenda')} onClick={() => setActiveSection('configuracoesAgenda')}>Config. Agenda</a>
            </li>
            <li style={styles.navItem}>
              <a href="#" style={styles.navLink(activeSection === 'configuracoesConta')} onClick={() => setActiveSection('configuracoesConta')}>Config. Conta</a>
            </li>
            <li style={styles.navItem}>
              <a href="#" style={styles.navLink(activeSection === 'planoAssinatura')} onClick={() => setActiveSection('planoAssinatura')}>Plano</a>
            </li>
            <li style={styles.navItem}>
              <button onClick={handleLogout} style={styles.logoutButton}>Sair</button>
            </li>
          </ul>
        </nav>
      </div>
      <div style={styles.mainContent}>
        <header style={styles.header}>
          <h2 style={styles.headerTitle}>Painel do Profissional</h2>
          {/* Adicionar informações do usuário logado, se necessário */}
        </header>
        <div style={styles.contentArea}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

const styles = {
  dashboardContainer: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f0f2f5',
  },
  sidebar: {
    width: '250px',
    backgroundColor: '#343a40',
    color: '#fff',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as 'column',
  },
  logo: {
    fontSize: '24px',
    textAlign: 'center' as 'center',
    marginBottom: '30px',
    color: '#007bff',
  },
  navList: {
    listStyle: 'none',
    padding: 0,
  },
  navItem: {
    marginBottom: '10px',
  },
  navLink: (isActive: boolean) => ({
    display: 'block',
    padding: '10px 15px',
    color: isActive ? '#007bff' : '#adb5bd',
    textDecoration: 'none',
    borderRadius: '5px',
    backgroundColor: isActive ? '#495057' : 'transparent',
    transition: 'all 0.3s ease',
    ':hover': {
      backgroundColor: '#495057',
      color: '#fff',
    },
  }),
  logoutButton: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: '10px 15px',
    border: 'none',
    borderRadius: '5px',
    width: '100%',
    cursor: 'pointer',
    marginTop: '30px',
    transition: 'background-color 0.3s ease',
  },
  mainContent: {
    flexGrow: 1,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as 'column',
  },
  header: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    margin: 0,
    color: '#333',
  },
  contentArea: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    flexGrow: 1,
  },
  sectionTitle: {
    color: '#333',
    marginBottom: '20px',
  },
  subSectionTitle: {
    color: '#555',
    marginBottom: '15px',
    borderBottom: '1px solid #eee',
    paddingBottom: '5px',
    width: '100%',
  },
  message: {
    color: '#555',
    textAlign: 'center' as 'center',
    marginTop: '15px',
  },
  errorMessage: {
    color: '#dc3545',
    textAlign: 'center' as 'center',
    marginTop: '15px',
  },
  appointmentList: {
    listStyle: 'none',
    padding: 0,
  },
  appointmentItem: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '5px',
    padding: '10px',
    marginBottom: '10px',
    fontSize: '16px',
    color: '#333',
  },
  daySection: {
    marginBottom: '30px',
    borderBottom: '2px solid #e9ecef',
    paddingBottom: '15px',
  },
  dayTitle: {
    color: '#007bff',
    fontSize: '20px',
    marginBottom: '10px',
    fontWeight: 'bold' as 'bold',
  },
  formGroup: {
    marginBottom: '20px',
    width: '100%',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#555',
    fontWeight: 'bold',
  },
  input: {
    width: 'calc(100% - 22px)',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  textarea: {
    width: 'calc(100% - 22px)',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    minHeight: '80px',
    resize: 'vertical' as 'vertical',
  },
  button: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '18px',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'background-color 0.3s ease',
  },
  link: { // Estilo para o link na Configurações da Agenda
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: 'bold',
  }
};

export default Dashboard;