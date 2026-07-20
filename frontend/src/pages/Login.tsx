import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

interface LoginForm {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export default function Login() {
  const [require2FA, setRequire2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', data);

      if (response.data.require2FA) {
        setRequire2FA(true);
        toast.info('Digite o codigo 2FA');
        return;
      }

      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Login realizado com sucesso');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold brand-gradient">ManuADV Jurídico</h1>
          <p className="mt-2 text-gray-300">Gestão advocatícia</p>
        </div>

        <form
          className="mt-8 space-y-6 bg-dark-800/95 p-8 rounded-2xl shadow-2xl border border-dark-600"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
                Email
              </label>
              <input
                id="email"
                {...register('email', {
                  required: 'Email e obrigatorio',
                  pattern: { value: /^\S+@\S+$/i, message: 'Email invalido' },
                })}
                type="email"
                className="input-field"
                placeholder="seu@email.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
                Senha
              </label>
              <input
                id="password"
                {...register('password', { required: 'Senha e obrigatoria' })}
                type="password"
                className="input-field"
                placeholder="********"
              />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {require2FA && (
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-200 mb-1">
                  Codigo 2FA
                </label>
                <input
                  id="twoFactorCode"
                  {...register('twoFactorCode', { required: require2FA ? 'Codigo 2FA e obrigatorio' : false })}
                  type="text"
                  className="input-field"
                  placeholder="000000"
                  maxLength={6}
                />
                {errors.twoFactorCode && <p className="mt-1 text-sm text-red-600">{errors.twoFactorCode.message}</p>}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-gray-300 text-sm">&copy; 2026 ManuADV Juridico. Desenvolvido por GA Systems.</p>
      </div>
    </div>
  );
}
