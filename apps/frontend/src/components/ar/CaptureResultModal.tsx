import { useState } from 'react';
import { useRecommendedSize } from '../../hooks/useQueries';
import toast from 'react-hot-toast';

interface CaptureResultModalProps {
  dataUrl: string;
  productId: string;
  productName: string;
  productSlug: string;
  savedToProfile: boolean;
  onLogin?: () => void;
  onRegister?: () => void;
  onViewProfile?: () => void;
  onClose: () => void;
}

export function CaptureResultModal({
  dataUrl,
  productId,
  productName,
  productSlug,
  onClose,
}: CaptureResultModalProps) {
  const { data: recommendation } = useRecommendedSize(productId);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `prueba-${productSlug || 'prenda'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloaded(true);
      toast.success('¡Foto guardada en tu dispositivo!');
    } catch {
      toast.error('No se pudo descargar la imagen');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/productos/${productSlug}`;
    const text = `¡Mira cómo me queda ${productName} en el probador virtual AR de Tienda Ropa! Pruébatelo tú también:`;
    const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    window.open(wa, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Captura de tu prueba"
    >
      <div className="w-full max-w-md bg-gray-950 border border-white/15 rounded-3xl overflow-hidden shadow-2xl text-white">
        {/* Vista previa de la foto */}
        <div className="relative bg-black aspect-[3/4] max-h-[48vh] w-full overflow-hidden">
          <img src={dataUrl} alt={`Prueba de ${productName}`} className="w-full h-full object-cover" />
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 border border-emerald-500/30">
            ✓ Captura AR lista
          </div>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-6 space-y-4">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-white">{productName}</h3>
            {recommendation?.recommendedSize ? (
              <p className="text-xs text-primary-300 font-medium">
                Talla recomendada: <span className="font-bold text-white text-sm bg-primary-600/40 px-2 py-0.5 rounded-md border border-primary-400/40">{recommendation.recommendedSize}</span>
              </p>
            ) : (
              <p className="text-xs text-gray-400">Prueba completada con éxito</p>
            )}
          </div>

          {/* Acciones principales sin obligar registro */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              className="btn btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {downloaded ? '¡Guardada!' : 'Guardar foto'}
            </button>

            <button
              onClick={handleShare}
              className="btn btn-outline py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/20"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.837 11.837 0 01-5.667-1.447L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-.607z" transform="translate(.3) scale(.93)" />
              </svg>
              Compartir
            </button>
          </div>

          <div className="pt-1">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-gray-200 rounded-xl text-xs font-medium transition-colors"
            >
              Volver a la tienda / Seguir probando
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}