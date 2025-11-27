import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import horarioService from '../services/horarioService';

interface HorarioProfissional {
  id: string;
  profissionalId: string;
  diaDaSemana: number; // 0 (Domingo) a 6 (Sábado)
  ativo: boolean;
  horarioInicio: string; // Formato "HH:MM"
  horarioFim: string; // Formato "HH:MM"
  almocoInicio: string | null; // Formato "HH:MM", opcional
  almocoFim: string | null; // Formato "HH:MM", opcional
}

const diaDaSemanaMapReverse: { [key: number]: string } = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
};

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    diasTrabalho: [] as string[],
    horarioAbertura: '',
    horarioFechamento: '',
    intervaloInicio: '',
    intervaloFim: '',
    servicos: [] as string[], // Placeholder for now
  });
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingExistingHorarios, setFetchingExistingHorarios] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExistingHorarios = async () => {
      try {
        const existingHorarios: HorarioProfissional[] = await horarioService.getHorarios();
        if (existingHorarios.length > 0) {
          const activeDays = existingHorarios
            .filter(h => h.ativo)
            .map(h => diaDaSemanaMapReverse[h.diaDaSemana]);

          const sampleHorario = existingHorarios.find(h => h.ativo); // Pega qualquer horário ativo para preencher os tempos
          
          setOnboardingData({
            diasTrabalho: activeDays,
            horarioAbertura: sampleHorario?.horarioInicio || '',
            horarioFechamento: sampleHorario?.horarioFim || '',
            intervaloInicio: sampleHorario?.almocoInicio || '',
            intervaloFim: sampleHorario?.almocoFim || '',
            servicos: [], // Placeholder
          });
        }
      } catch (err: any) {
        setFetchError(err.message || 'Erro ao carregar horários existentes.');
      } finally {
        setFetchingExistingHorarios(false);
      }
    };

    fetchExistingHorarios();
  }, []); // Executa apenas uma vez ao montar o componente

  const handleNextStep = () => {
    setStep((prevStep) => prevStep + 1);
  };

  const handlePreviousStep = () => {
    setStep((prevStep) => prevStep - 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      const updatedDias = checked
        ? [...onboardingData.diasTrabalho, value]
        : onboardingData.diasTrabalho.filter((day) => day !== value);
      setOnboardingData((prevData) => ({
        ...prevData,
        diasTrabalho: updatedDias,
      }));
    } else {
      setOnboardingData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem('');
    setLoading(true);

    try {
      const dataToSend = {
        diasTrabalho: onboardingData.diasTrabalho,
        horarioAbertura: onboardingData.horarioAbertura,
        horarioFechamento: onboardingData.horarioFechamento,
        intervaloInicio: onboardingData.intervaloInicio || undefined,
        intervaloFim: onboardingData.intervaloFim || undefined,
      };

      await horarioService.saveHorarios(dataToSend);
      setMensagem('Configurações de horário salvas com sucesso! Redirecionando...');
      navigate('/dashboard');
    } catch (error: any) {
      setMensagem(error.message || 'Erro ao salvar configurações de horário.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingExistingHorarios) {
    return <p style={styles.message}>Carregando configurações de horário...</p>;
  }

  if (fetchError) {
    return <p style={styles.errorMessage}>{fetchError}</p>;
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div style={styles.stepContainer}>
            <h2 style={styles.stepTitle}>Passo 1: Dias de Trabalho</h2>
            <p style={styles.stepDescription}>Selecione os dias da semana em que você trabalha.</p>
            <div style={styles.checkboxGroup}>
              {['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map((day) => (
                <label key={day} style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="diasTrabalho"
                    value={day}
                    checked={onboardingData.diasTrabalho.includes(day)}
                    onChange={handleInputChange}
                    style={styles.checkboxInput}
                  />
                  {day}
                </label>
              ))}
            </div>
            <button onClick={handleNextStep} style={styles.button} disabled={loading || onboardingData.diasTrabalho.length === 0}>Próximo</button>
          </div>
        );
      case 2:
        return (
          <div style={styles.stepContainer}>
            <h2 style={styles.stepTitle}>Passo 2: Horário de Atendimento</h2>
            <p style={styles.stepDescription}>Defina seu horário de abertura e fechamento.</p>
            <div style={styles.formGroup}>
              <label htmlFor="horarioAbertura" style={styles.label}>Abertura:</label>
              <input
                type="time"
                id="horarioAbertura"
                name="horarioAbertura"
                value={onboardingData.horarioAbertura}
                onChange={handleInputChange}
                required
                style={styles.input}
                disabled={loading}
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="horarioFechamento" style={styles.label}>Fechamento:</label>
              <input
                type="time"
                id="horarioFechamento"
                name="horarioFechamento"
                value={onboardingData.horarioFechamento}
                onChange={handleInputChange}
                required
                style={styles.input}
                disabled={loading}
              />
            </div>
            <div style={styles.navigationButtons}>
              <button onClick={handlePreviousStep} style={styles.buttonSecondary} disabled={loading}>Anterior</button>
              <button onClick={handleNextStep} style={styles.button} disabled={loading || !onboardingData.horarioAbertura || !onboardingData.horarioFechamento}>Próximo</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div style={styles.stepContainer}>
            <h2 style={styles.stepTitle}>Passo 3: Intervalo (Almoço)</h2>
            <p style={styles.stepDescription}>Configure o início e fim do seu intervalo.</p>
            <div style={styles.formGroup}>
              <label htmlFor="intervaloInicio" style={styles.label}>Início do Intervalo:</label>
              <input
                type="time"
                id="intervaloInicio"
                name="intervaloInicio"
                value={onboardingData.intervaloInicio}
                onChange={handleInputChange}
                style={styles.input}
                disabled={loading}
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="intervaloFim" style={styles.label}>Fim do Intervalo:</label>
              <input
                type="time"
                id="intervaloFim"
                name="intervaloFim"
                value={onboardingData.intervaloFim}
                onChange={handleInputChange}
                style={styles.input}
                disabled={loading}
              />
            </div>
            <div style={styles.navigationButtons}>
              <button onClick={handlePreviousStep} style={styles.buttonSecondary} disabled={loading}>Anterior</button>
              <button onClick={handleSubmit} style={styles.button} disabled={loading}>
                {loading ? 'Salvando...' : 'Finalizar Configuração'}
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div style={styles.stepContainer}>
            <h2 style={styles.stepTitle}>Passo 4: Serviços</h2>
            <p style={styles.stepDescription}>Aqui você poderá configurar seus serviços. <br/> Por enquanto, esta seção é um placeholder.</p>
            {/* Implementação futura para serviços customizáveis */}
            <div style={styles.navigationButtons}>
              <button onClick={handlePreviousStep} style={styles.buttonSecondary} disabled={loading}>Anterior</button>
              <button onClick={handleSubmit} style={styles.button} disabled={loading}>
                {loading ? 'Salvando...' : 'Finalizar Configuração'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        {renderStep()}
        {mensagem && <p style={styles.message}>{mensagem}</p>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  formCard: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
  },
  stepContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as 'column',
    alignItems: 'center',
  },
  stepTitle: {
    color: '#333',
    marginBottom: '10px',
  },
  stepDescription: {
    color: '#666',
    marginBottom: '20px',
    textAlign: 'center' as 'center',
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
    width: 'calc(100% - 22px)', // Adjusted for padding and border
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column' as 'column',
    marginBottom: '20px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    color: '#555',
    fontSize: '16px',
  },
  checkboxInput: {
    marginRight: '10px',
    transform: 'scale(1.2)',
  },
  navigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: '30px',
  },
  button: {
    backgroundColor: '#007bff',
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    minWidth: '120px',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    color: '#fff',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
    minWidth: '120px',
  },
  message: {
    marginTop: '20px',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#ffe0b2',
    color: '#e65100',
    textAlign: 'center' as 'center',
    width: '100%',
    maxWidth: '400px',
  },
  errorMessage: {
    marginTop: '20px',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#ffdddd',
    color: '#d8000c',
    textAlign: 'center' as 'center',
    width: '100%',
    maxWidth: '400px',
  },
};

export default Onboarding;