import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';
import { MagnifyingGlassIcon, FunnelIcon, DocumentTextIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

const statusColors: Record<string, string> = {
  ATIVO: 'bg-blue-100 text-blue-800',
  ENCERRADO: 'bg-green-100 text-green-800',
  ARQUIVADO: 'bg-gray-200 text-gray-800',
  SUSPENSO: 'bg-yellow-100 text-yellow-800',
};

const statusLabels: Record<string, string> = {
  ATIVO: 'Ativo',
  ENCERRADO: 'Encerrado',
  ARQUIVADO: 'Arquivado',
  SUSPENSO: 'Suspenso',
};

const typeLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista',
  CIVIL: 'Civil',
  CRIMINAL: 'Criminal',
  TRIBUTARIO: 'Tributário',
  FAMILIA: 'Família',
  PREVIDENCIARIO: 'Previdenciário',
  CONSUMIDOR: 'Consumidor',
  EMPRESARIAL: 'Empresarial',
  OUTROS: 'Outros',
};

interface ClientOption {
  id: string;
  name: string;
}

export default function Cases() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [showProcuracaoModal, setShowProcuracaoModal] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [procuracaoForm, setProcuracaoForm] = useState({
    NACIONALIDADE: 'brasileiro(a)',
    ESTADO_CIVIL: '',
    PROFISSAO: '',
    RG: '',
  });
  const [caseForm, setCaseForm] = useState({
    caseNumber: '',
    title: '',
    type: '',
    status: 'ATIVO',
    clientId: '',
    court: '',
    value: '',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const queryClient = useQueryClient();

  const { data: casesData, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const res = await api.get('/cases?limit=100');
      return res.data.data;
    },
    retry: 1,
    staleTime: 30000,
  });

  const { data: clients = [] } = useQuery<ClientOption[]>({
    queryKey: ['clients-for-cases'],
    queryFn: async () => {
      const res = await api.get('/clients?limit=200');
      return res.data.data?.clients || res.data.data || [];
    },
  });

  const cases = casesData?.cases || [];

  const filteredCases = cases?.filter((caso: any) => {
    const matchesSearch = caso.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caso.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || caso.type === filterType;
    const matchesStatus = !filterStatus || caso.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const createCaseMutation = useMutation({
    mutationFn: (data: any) =>
      api.post('/cases', {
        ...data,
        value: data.value ? parseFloat(data.value) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success('Processo criado com sucesso');
      closeCreateModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao criar processo');
    },
  });

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCaseForm({
      caseNumber: '',
      title: '',
      type: '',
      status: 'ATIVO',
      clientId: '',
      court: '',
      value: '',
      startDate: new Date().toISOString().split('T')[0],
      description: '',
    });
  };

  const handleCreateSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!caseForm.caseNumber || !caseForm.title || !caseForm.type || !caseForm.clientId) {
      toast.error('Preencha os campos obrigatorios');
      return;
    }
    createCaseMutation.mutate(caseForm);
  };

  const generateProcuracaoMutation = useMutation({
    mutationFn: async () => {
      const templatesRes = await api.get('/templates?category=PROCURACAO');
      const templates = templatesRes.data.data || [];
      if (!templates.length) {
        throw new Error('Nenhum template de procuracao cadastrado ainda.');
      }
      const template = templates[0];

      const response = await api.post(
        `/templates/${template.id}/generate`,
        { caseId: selectedCase.id, variables: procuracaoForm },
        { responseType: 'blob' }
      );
      return response.data;
    },
    onSuccess: (blobData) => {
      const blob = new Blob([blobData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `procuracao-${selectedCase?.caseNumber || 'processo'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Procuracao gerada com sucesso');
      setShowProcuracaoModal(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || error?.message || 'Erro ao gerar procuracao');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Processos</h1>
          <p className="text-gray-400 mt-1">Gerencie todos os processos do escritório</p>
        </div>
        <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Novo Processo
        </button>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por número, título ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              title="Filtrar por tipo"
              aria-label="Filtrar processos por tipo"
              className="input-field pl-10 appearance-none"
            >
              <option value="">Todos os Tipos</option>
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              title="Filtrar por status"
              aria-label="Filtrar processos por status"
              className="input-field pl-10 appearance-none"
            >
              <option value="">Todos os Status</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 text-center py-8 text-gray-400">Carregando processos...</div>
        ) : filteredCases && filteredCases.length > 0 ? (
          filteredCases.map((caso: any) => (
            <div
              key={caso.id}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCase(caso)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-100">{caso.caseNumber}</h3>
                    <p className="text-sm text-gray-400 mt-1">{caso.title || 'Sem título'}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[caso.status] || 'bg-gray-200 text-gray-800'}`}>
                    {statusLabels[caso.status] || caso.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {typeLabels[caso.type] || caso.type}
                  </span>
                  <span className="text-gray-400">{caso.client?.name || 'Cliente não identificado'}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-dark-700">
                  <div>
                    <p className="text-xs text-gray-400">Data de Abertura</p>
                    <p className="text-sm font-medium text-gray-100">
                      {new Date(caso.startDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Valor da Causa</p>
                    <p className="text-sm font-medium text-gray-100">
                      {caso.value ? `R$ ${caso.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 text-gray-400">
            Nenhum processo encontrado com os filtros aplicados
          </div>
        )}
      </div>

      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-dark-600">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-100">{selectedCase.caseNumber}</h2>
                  <p className="text-gray-400 mt-1">{selectedCase.title}</p>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  title="Fechar"
                  aria-label="Fechar detalhes do processo"
                  className="text-gray-400 hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cliente</label>
                    <p className="text-gray-100 mt-1">{selectedCase.client?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo</label>
                    <p className="text-gray-100 mt-1">{typeLabels[selectedCase.type] || selectedCase.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[selectedCase.status] || 'bg-gray-200 text-gray-800'}`}>
                      {statusLabels[selectedCase.status] || selectedCase.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Valor da Causa</label>
                    <p className="text-gray-100 mt-1">
                      {selectedCase.value ? `R$ ${selectedCase.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não informado'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Data de Abertura</label>
                    <p className="text-gray-100 mt-1">
                      {new Date(selectedCase.startDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Foro</label>
                    <p className="text-gray-100 mt-1">{selectedCase.court || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vara</label>
                    <p className="text-gray-100 mt-1">{selectedCase.courtDivision || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Comarca</label>
                    <p className="text-gray-100 mt-1">{selectedCase.district || 'Não informado'}</p>
                  </div>
                </div>

                {selectedCase.description && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-500">Descrição</label>
                    <p className="text-gray-100 mt-1 whitespace-pre-wrap">{selectedCase.description}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-dark-700">
                <button
                  onClick={() => setShowProcuracaoModal(true)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <DocumentTextIcon className="h-5 w-5" />
                  Gerar Procuracao
                </button>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 border border-dark-600 rounded-lg text-gray-200 hover:bg-dark-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProcuracaoModal && selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-dark-800 rounded-lg shadow-xl max-w-md w-full border border-dark-600">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-100">Gerar Procuracao</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Cliente e advogado sao preenchidos automaticamente. Complete os dados abaixo.
                  </p>
                </div>
                <button
                  onClick={() => setShowProcuracaoModal(false)}
                  className="text-gray-400 hover:text-gray-200"
                  title="Fechar"
                  aria-label="Fechar"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nacionalidade</label>
                  <input
                    className="input-field mt-1"
                    value={procuracaoForm.NACIONALIDADE}
                    onChange={(e) => setProcuracaoForm({ ...procuracaoForm, NACIONALIDADE: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado civil</label>
                  <input
                    className="input-field mt-1"
                    value={procuracaoForm.ESTADO_CIVIL}
                    onChange={(e) => setProcuracaoForm({ ...procuracaoForm, ESTADO_CIVIL: e.target.value })}
                    placeholder="solteiro(a), casado(a)..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Profissao</label>
                  <input
                    className="input-field mt-1"
                    value={procuracaoForm.PROFISSAO}
                    onChange={(e) => setProcuracaoForm({ ...procuracaoForm, PROFISSAO: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">RG</label>
                  <input
                    className="input-field mt-1"
                    value={procuracaoForm.RG}
                    onChange={(e) => setProcuracaoForm({ ...procuracaoForm, RG: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-700">
                <button
                  onClick={() => setShowProcuracaoModal(false)}
                  className="px-4 py-2 border border-dark-600 rounded-lg text-gray-200 hover:bg-dark-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => generateProcuracaoMutation.mutate()}
                  disabled={generateProcuracaoMutation.isPending}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {generateProcuracaoMutation.isPending ? 'Gerando...' : 'Gerar PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-dark-600">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-100">Novo Processo</h2>
                <button
                  onClick={closeCreateModal}
                  title="Fechar"
                  aria-label="Fechar modal"
                  className="text-gray-400 hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Número do processo *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={caseForm.caseNumber}
                      onChange={(e) => setCaseForm({ ...caseForm, caseNumber: e.target.value })}
                      placeholder="0000000-00.0000.0.00.0000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Cliente *</label>
                    <select
                      className="input-field"
                      value={caseForm.clientId}
                      onChange={(e) => setCaseForm({ ...caseForm, clientId: e.target.value })}
                    >
                      <option value="">Selecione um cliente</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-1">Título *</label>
                    <input
                      type="text"
                      className="input-field"
                      value={caseForm.title}
                      onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })}
                      placeholder="Ex: Ação Trabalhista - Horas Extras"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Tipo *</label>
                    <select
                      className="input-field"
                      value={caseForm.type}
                      onChange={(e) => setCaseForm({ ...caseForm, type: e.target.value })}
                    >
                      <option value="">Selecione o tipo</option>
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Status</label>
                    <select
                      className="input-field"
                      value={caseForm.status}
                      onChange={(e) => setCaseForm({ ...caseForm, status: e.target.value })}
                    >
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Foro / Vara</label>
                    <input
                      type="text"
                      className="input-field"
                      value={caseForm.court}
                      onChange={(e) => setCaseForm({ ...caseForm, court: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Valor da causa (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input-field"
                      value={caseForm.value}
                      onChange={(e) => setCaseForm({ ...caseForm, value: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Data de abertura</label>
                    <input
                      type="date"
                      className="input-field"
                      value={caseForm.startDate}
                      onChange={(e) => setCaseForm({ ...caseForm, startDate: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-1">Descrição</label>
                    <textarea
                      className="input-field"
                      rows={3}
                      value={caseForm.description}
                      onChange={(e) => setCaseForm({ ...caseForm, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="px-4 py-2 border border-dark-600 rounded-lg text-gray-200 hover:bg-dark-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createCaseMutation.isPending}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {createCaseMutation.isPending ? 'Criando...' : 'Criar Processo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
