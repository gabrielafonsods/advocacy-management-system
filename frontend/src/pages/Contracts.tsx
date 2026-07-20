import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';
import {
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface Client {
  id: string;
  name: string;
  cpfCnpj: string;
}

interface Contract {
  id: string;
  title: string;
  description: string | null;
  value: number;
  startDate: string;
  endDate: string | null;
  status: 'ATIVO' | 'VENCIDO' | 'CANCELADO';
  terms: string | null;
  clientId: string;
  client: Client;
  createdAt: string;
}

const statusLabels: Record<Contract['status'], string> = {
  ATIVO: 'Ativo',
  VENCIDO: 'Vencido',
  CANCELADO: 'Cancelado',
};

const statusColors: Record<Contract['status'], string> = {
  ATIVO: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-900/40',
  VENCIDO: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-900/40',
  CANCELADO: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-900/40',
};

export default function Contracts() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    startDate: '',
    endDate: '',
    status: 'ATIVO',
    terms: '',
    clientId: '',
  });

  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      const res = await api.get('/contracts');
      return res.data.data || [];
    },
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients-for-contracts'],
    queryFn: async () => {
      const res = await api.get('/clients?limit=200');
      return res.data.data?.clients || res.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/contracts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato criado com sucesso');
      closeModal();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Erro ao criar contrato'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/contracts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato atualizado com sucesso');
      closeModal();
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Erro ao atualizar contrato'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/contracts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrato excluído com sucesso');
    },
    onError: (error: any) => toast.error(error.response?.data?.message || 'Erro ao excluir contrato'),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.title || !formData.value || !formData.startDate || !formData.clientId) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    if (Number(formData.value) <= 0) {
      toast.error('Informe um valor maior que zero');
      return;
    }

    if (editingContract) {
      updateMutation.mutate({ id: editingContract.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (contract: Contract) => {
    setEditingContract(contract);
    setFormData({
      title: contract.title,
      description: contract.description || '',
      value: contract.value.toString(),
      startDate: contract.startDate.split('T')[0],
      endDate: contract.endDate ? contract.endDate.split('T')[0] : '',
      status: contract.status,
      terms: contract.terms || '',
      clientId: contract.clientId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownloadPdf = async (contract: Contract) => {
    try {
      setDownloadingId(contract.id);
      const response = await api.get(`/contracts/${contract.id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contrato-${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Erro ao gerar PDF do contrato');
    } finally {
      setDownloadingId(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContract(null);
    setFormData({
      title: '',
      description: '',
      value: '',
      startDate: '',
      endDate: '',
      status: 'ATIVO',
      terms: '',
      clientId: '',
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (value: string) => new Date(value).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DocumentTextIcon className="h-8 w-8 text-primary-600" />
            Contratos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os contratos e gere o PDF a qualquer momento</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={() => setIsModalOpen(true)}>
          <PlusIcon className="h-5 w-5" />
          Novo Contrato
        </button>
      </div>

      <div className="card overflow-x-auto">
        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-400 py-6 text-center">Carregando contratos...</p>
        ) : contracts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 py-6 text-center">Nenhum contrato cadastrado ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-700">
                <th className="py-3 pr-4 font-medium">Título</th>
                <th className="py-3 pr-4 font-medium">Cliente</th>
                <th className="py-3 pr-4 font-medium">Valor</th>
                <th className="py-3 pr-4 font-medium">Vigência</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium text-right">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-gray-100 dark:border-dark-800">
                  <td className="py-3 pr-4 font-medium">{contract.title}</td>
                  <td className="py-3 pr-4">{contract.client?.name}</td>
                  <td className="py-3 pr-4">{formatCurrency(contract.value)}</td>
                  <td className="py-3 pr-4">
                    {formatDate(contract.startDate)}
                    {contract.endDate ? ` - ${formatDate(contract.endDate)}` : ' - indeterminado'}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[contract.status]}`}>
                      {statusLabels[contract.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 disabled:opacity-50"
                        title="Baixar PDF"
                        disabled={downloadingId === contract.id}
                        onClick={() => handleDownloadPdf(contract)}
                      >
                        <ArrowDownTrayIcon className="h-5 w-5 text-primary-600" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                        title="Editar"
                        onClick={() => handleEdit(contract)}
                      >
                        <PencilIcon className="h-5 w-5 text-gray-500" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                        title="Excluir"
                        onClick={() => handleDelete(contract.id)}
                      >
                        <TrashIcon className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-dark-600">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
              <h2 className="text-xl font-bold">{editingContract ? 'Editar Contrato' : 'Novo Contrato'}</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input
                  className="input-field"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contrato de Prestacao de Servicos Juridicos"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cliente *</label>
                <select
                  className="input-field"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição / Objeto</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="VENCIDO">Vencido</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data de início *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data de término</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cláusulas e condições</label>
                <textarea
                  className="input-field"
                  rows={4}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Texto que aparece no PDF, na seção de cláusulas e condições"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingContract ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
