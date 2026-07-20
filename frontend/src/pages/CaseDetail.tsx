import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/processos')}
        className="inline-flex items-center gap-2 text-gray-300 hover:text-gray-100"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Voltar para Processos
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-100">Detalhes do Processo</h1>
        <p className="text-gray-400 mt-2">
          Abra este processo pela lista de Processos para ver os detalhes completos.
          {id ? ` (ID: ${id})` : ''}
        </p>
      </div>
    </div>
  );
}
