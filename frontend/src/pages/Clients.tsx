import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { PencilIcon, TrashIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ClientForm = {
  name: string;
  email: string;
  phone: string;
  cpfCnpj: string;
  type: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export default function Clients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [viewClient, setViewClient] = useState<any>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientForm>();

  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get('/clients?limit=100');
      return res.data.data;
    },
    retry: 1,
    staleTime: 30000,
  });

  const clients = clientsData?.clients || [];

  const createMutation = useMutation({
    mutationFn: (data: ClientForm) => api.post('/clients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente criado com sucesso!');
      setIsModalOpen(false);
      reset();
    },
    onError: () => toast.error('Erro ao criar cliente'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientForm }) => api.put(`/clients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente atualizado com sucesso!');
      setIsModalOpen(false);
      setSelectedClient(null);
      reset();
    },
    onError: () => toast.error('Erro ao atualizar cliente'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: () => toast.error('Erro ao excluir cliente'),
  });

  const openCreateModal = () => {
    setSelectedClient(null);
    reset({
      name: '',
      email: '',
      phone: '',
      cpfCnpj: '',
      type: 'PESSOA_FISICA',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (client: any) => {
    setSelectedClient(client);
    reset(client);
    setIsModalOpen(true);
  };

  const onSubmit = (data: ClientForm) => {
    if (selectedClient) {
      updateMutation.mutate({ id: selectedClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-gray-100">Clientes</h1>
          <p className="text-gray-400 mt-1">Gerencie seus clientes</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">+ Novo Cliente</button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : (
            <table className="min-w-full divide-y divide-dark-700">
              <thead className="bg-dark-900/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">CPF/CNPJ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {clients?.map((client: any) => (
                  <tr key={client.id} className="hover:bg-dark-700/40">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        client.type === 'PESSOA_FISICA' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {client.type === 'PESSOA_FISICA' ? 'PF' : 'PJ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{client.cpfCnpj}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{client.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{client.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setViewClient(client)}
                        title="Ver detalhes"
                        aria-label={`Ver detalhes de ${client.name}`}
                        className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1"
                      >
                        <EyeIcon className="h-4 w-4" /> Ver
                      </button>
                      <button
                        onClick={() => openEditModal(client)}
                        title="Editar cliente"
                        aria-label={`Editar ${client.name}`}
                        className="text-gray-300 hover:text-gray-100 inline-flex items-center gap-1"
                      >
                        <PencilIcon className="h-4 w-4" /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(client.id)}
                        title="Excluir cliente"
                        aria-label={`Excluir ${client.name}`}
                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      >
                        <TrashIcon className="h-4 w-4" /> Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-dark-600">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-dark-900 dark:text-gray-100">
                  {selectedClient ? 'Editar Cliente' : 'Novo Cliente'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  title="Fechar"
                  aria-label="Fechar modal"
                  className="text-gray-400 hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-1">Nome *</label>
                    <input
                      type="text"
                      {...register('name', { required: 'Nome é obrigatório' })}
                      className="input-field"
                    />
                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Tipo *</label>
                    <select
                      {...register('type', { required: true })}
                      className="input-field"
                    >
                      <option value="PESSOA_FISICA">Pessoa Física</option>
                      <option value="PESSOA_JURIDICA">Pessoa Jurídica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">CPF/CNPJ *</label>
                    <input
                      type="text"
                      {...register('cpfCnpj', { required: 'CPF/CNPJ é obrigatório' })}
                      className="input-field"
                    />
                    {errors.cpfCnpj && <p className="text-red-600 text-sm mt-1">{errors.cpfCnpj.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Email *</label>
                    <input
                      type="email"
                      {...register('email', { required: 'Email é obrigatório' })}
                      className="input-field"
                    />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Telefone *</label>
                    <input
                      type="tel"
                      {...register('phone', { required: 'Telefone é obrigatório' })}
                      className="input-field"
                    />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-1">Endereço</label>
                    <input
                      type="text"
                      {...register('address')}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Cidade</label>
                    <input
                      type="text"
                      {...register('city')}
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">Estado</label>
                    <input
                      type="text"
                      {...register('state')}
                      maxLength={2}
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-200 mb-1">CEP</label>
                    <input
                      type="text"
                      {...register('zipCode')}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-dark-600 rounded-lg text-gray-200 hover:bg-dark-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn btn-primary"
                  >
                    {selectedClient ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização */}
      {viewClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-lg shadow-xl max-w-2xl w-full border border-dark-600">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-dark-900 dark:text-gray-100">Detalhes do Cliente</h2>
                <button 
                  onClick={() => setViewClient(null)} 
                  title="Fechar"
                  aria-label="Fechar detalhes"
                  className="text-gray-400 hover:text-gray-200"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome</label>
                    <p className="text-dark-900 dark:text-gray-100 mt-1">{viewClient.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo</label>
                    <p className="text-dark-900 dark:text-gray-100 mt-1">{viewClient.type === 'PESSOA_FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">CPF/CNPJ</label>
                    <p className="text-dark-900 dark:text-gray-100 mt-1">{viewClient.cpfCnpj}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-dark-900 dark:text-gray-100 mt-1">{viewClient.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <p className="text-dark-900 dark:text-gray-100 mt-1">{viewClient.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">CEP</label>
                    <p className="text-dark-900 dark:text-gray-100 mt-1">{viewClient.zipCode || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Endereço</label>
                    <p className="text-dark-900 dark:text-gray-100 mt-1">{viewClient.address || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cidade</label>
                    <p className="text-dark-900 dark:text-gray-100 mt-1">{viewClient.city || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <p className="text-dark-900 dark:text-gray-100 mt-1">{viewClient.state || '-'}</p>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setViewClient(null);
                      openEditModal(viewClient);
                    }}
                    className="btn btn-primary"
                  >
                    Editar Cliente
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

