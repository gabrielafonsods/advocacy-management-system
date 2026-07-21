import { useEffect, useState } from 'react';
import { Menu } from '@headlessui/react';
import {
  BellIcon,
  UserCircleIcon,
  TrashIcon,
  Bars3Icon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../lib/axios';
import { useUIStore } from '../store/uiStore';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const apiRoot = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/api\/?$/, '');

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const [profileImageError, setProfileImageError] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState<{
    title: string;
    message: string;
    target: 'USERS' | 'ROLE' | 'ALL';
    userIds: string[];
    roles: string[];
  }>({ title: '', message: '', target: 'USERS', userIds: [], roles: [] });

  const isSocio = user?.role === 'SOCIO';

  const { data: usersList = [] } = useQuery({
    queryKey: ['users-for-notifications'],
    queryFn: async () => {
      const res = await api.get('/users?limit=200');
      return res.data.data?.users || res.data.data || [];
    },
    enabled: isSocio,
  });

  useEffect(() => {
    setProfileImageError(false);
  }, [user?.profileImage, user?.updatedAt]);

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=8');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas as notificações foram marcadas como lidas');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notificação excluída');
    },
  });

  const createNotificationMutation = useMutation({
    mutationFn: (data: typeof composeForm) => api.post('/notifications', data),
    onSuccess: () => {
      toast.success('Notificação enviada com sucesso');
      setIsComposeOpen(false);
      setComposeForm({ title: '', message: '', target: 'USERS', userIds: [], roles: [] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao enviar notificação');
    },
  });

  const handleComposeSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!composeForm.title || !composeForm.message) {
      toast.error('Preencha o título e a mensagem');
      return;
    }
    if (composeForm.target === 'USERS' && !composeForm.userIds.length) {
      toast.error('Selecione ao menos um usuário');
      return;
    }
    if (composeForm.target === 'ROLE' && !composeForm.roles.length) {
      toast.error('Selecione ao menos um cargo');
      return;
    }
    createNotificationMutation.mutate(composeForm);
  };

  const toggleComposeUser = (userId: string) => {
    setComposeForm((prev) => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter((id) => id !== userId)
        : [...prev.userIds, userId],
    }));
  };

  const toggleComposeRole = (role: string) => {
    setComposeForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }));
  };

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const notifications = notificationsData?.data || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PRAZO':
        return 'Prazo';
      case 'AUDIENCIA':
        return 'Audiência';
      case 'PAGAMENTO':
        return 'Pagamento';
      case 'DOCUMENTO':
        return 'Documento';
      case 'CLIENTE':
        return 'Cliente';
      default:
        return 'Aviso';
    }
  };

  const profileImageSrc =
    !profileImageError &&
    user?.profileImage &&
    `${apiRoot}${user.profileImage}?v=${encodeURIComponent(user.updatedAt || Date.now().toString())}`;

  return (
    <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 hover:bg-gray-100 dark:hover:bg-dark-700"
            title="Expandir/recolher menu"
            aria-label="Expandir ou recolher menu lateral"
          >
            <Bars3Icon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-2xl font-semibold text-dark-900 dark:text-gray-100 truncate">
                Bem-vindo, {user?.name}
              </h2>
            </div>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {user?.role === 'SOCIO' && 'Sócio'}
              {user?.role === 'ADVOGADO' && 'Advogado'}
              {user?.role === 'ESTAGIARIO' && 'Estagiário'}
              {user?.role === 'ADMINISTRATIVO' && 'Administrativo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Menu as="div" className="relative">
            <Menu.Button
              className="relative p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition"
              title="Notificações"
              aria-label="Ver notificações"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Menu.Button>

            <Menu.Items className="absolute right-0 mt-2 w-[22rem] bg-white dark:bg-dark-800 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-dark-600 focus:outline-none z-50 max-h-[500px] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notificações</h3>
                <div className="flex items-center gap-3">
                  {isSocio && (
                    <button
                      onClick={() => setIsComposeOpen(true)}
                      className="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-dark-700 rounded-lg"
                      title="Criar notificação"
                      aria-label="Criar notificação"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsReadMutation.mutate()}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Marcar todas
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                {notifications.length > 0 ? (
                  notifications.map((notification: Notification) => (
                    <Menu.Item key={notification.id}>
                      {({ active }) => (
                        <div
                          className={`${active ? 'bg-gray-50 dark:bg-dark-700' : ''} ${
                            !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/25' : ''
                          } p-4 border-b border-gray-100 dark:border-dark-700 cursor-pointer relative`}
                        >
                          <div onClick={() => handleNotificationClick(notification)} className="flex gap-3">
                            <div className="text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-200 h-fit">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{notification.title}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.createdAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            {!notification.isRead && <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2"></div>}
                          </div>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteNotificationMutation.mutate(notification.id);
                            }}
                            className="absolute top-4 right-4 p-1 text-gray-400 hover:text-red-600 transition"
                            title="Excluir notificação"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </Menu.Item>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <BellIcon className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-dark-500" />
                    <p>Nenhuma notificação</p>
                  </div>
                )}
              </div>
            </Menu.Items>
          </Menu>

          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-2 p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition">
              {profileImageSrc ? (
                <img
                  src={profileImageSrc}
                  alt="Foto de perfil"
                  className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-dark-600"
                  onError={(event) => {
                    const target = event.target as HTMLImageElement;
                    target.onerror = null;
                    setProfileImageError(true);
                  }}
                />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-gray-500 dark:text-gray-300" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:inline">{user?.name}</span>
            </Menu.Button>

            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-dark-600 focus:outline-none z-10">
              <div className="p-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => navigate('/configuracoes')}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-dark-700' : ''
                      } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-md`}
                    >
                      Configurações
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-100 dark:bg-dark-700' : ''
                      } w-full text-left px-4 py-2 text-sm text-red-600 rounded-md`}
                    >
                      Sair
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>

      {isComposeOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-dark-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-dark-600">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-100">Criar notificação</h3>
                <button
                  onClick={() => setIsComposeOpen(false)}
                  className="text-gray-400 hover:text-gray-200"
                  title="Fechar"
                  aria-label="Fechar"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleComposeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Título *</label>
                  <input
                    className="input-field"
                    value={composeForm.title}
                    onChange={(e) => setComposeForm({ ...composeForm, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Mensagem *</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    value={composeForm.message}
                    onChange={(e) => setComposeForm({ ...composeForm, message: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Enviar para</label>
                  <div className="flex gap-4 text-sm text-gray-200">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={composeForm.target === 'USERS'}
                        onChange={() => setComposeForm({ ...composeForm, target: 'USERS' })}
                      />
                      Usuários específicos
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={composeForm.target === 'ROLE'}
                        onChange={() => setComposeForm({ ...composeForm, target: 'ROLE' })}
                      />
                      Por cargo
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        checked={composeForm.target === 'ALL'}
                        onChange={() => setComposeForm({ ...composeForm, target: 'ALL' })}
                      />
                      Todos
                    </label>
                  </div>
                </div>

                {composeForm.target === 'USERS' && (
                  <div className="max-h-40 overflow-y-auto border border-dark-600 rounded-lg p-2 space-y-1">
                    {usersList.map((u: any) => (
                      <label key={u.id} className="flex items-center gap-2 text-sm text-gray-200 px-1 py-1">
                        <input
                          type="checkbox"
                          checked={composeForm.userIds.includes(u.id)}
                          onChange={() => toggleComposeUser(u.id)}
                        />
                        {u.name} <span className="text-gray-500">({u.role})</span>
                      </label>
                    ))}
                  </div>
                )}

                {composeForm.target === 'ROLE' && (
                  <div className="flex flex-wrap gap-3 text-sm text-gray-200">
                    {['SOCIO', 'ADVOGADO', 'ESTAGIARIO', 'ADMINISTRATIVO'].map((role) => (
                      <label key={role} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={composeForm.roles.includes(role)}
                          onChange={() => toggleComposeRole(role)}
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsComposeOpen(false)}
                    className="px-4 py-2 border border-dark-600 rounded-lg text-gray-200 hover:bg-dark-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createNotificationMutation.isPending}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {createNotificationMutation.isPending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
