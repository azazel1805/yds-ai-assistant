import React from 'react';
import { AnalysisResult } from '../types';

const AnalysisResultDisplay: React.FC<{ result: AnalysisResult }> = ({ result }) => {
    
    // Bu yardımcı fonksiyon, object/array gibi karmaşık değerleri
    // string'e çevirmek için kullanılıyor ve olduğu gibi kalabilir.
    const renderValue = (value: any) => {
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value);
      }
      return String(value);
    }

    // --- YENİ BÖLÜM: PARAGRAF VE CLOZE TEST ANALİZİ GÖRÜNÜMÜ ---
    // Eğer sonuç 'soruAnalizleri' dizisi içeriyorsa, bu yeni formatı render et.
    if (result.soruAnalizleri && Array.isArray(result.soruAnalizleri)) {
        return (
            <div className="space-y-4 mt-4 border-t border-gray-600 pt-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-lg font-bold text-brand-primary mb-3">Genel Analiz</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div><strong className="text-text-secondary">Soru Tipi:</strong> {result.soruTipi || 'Belirtilmemiş'}</div>
                        {result.anaMetinAnalizi?.konu && <div><strong className="text-text-secondary">Genel Konu:</strong> {result.anaMetinAnalizi.konu}</div>}
                        {result.anaMetinAnalizi?.anaFikir && <div className="sm:col-span-2"><strong className="text-text-secondary">Ana Fikir:</strong> {result.anaMetinAnalizi.anaFikir}</div>}
                    </div>
                </div>

                <div>
                    <h4 className="text-lg font-bold text-brand-primary mb-3">Soruların Detaylı Analizleri</h4>
                    <div className="space-y-4">
                        {result.soruAnalizleri.map((analiz, index) => (
                            <div key={index} className="bg-gray-800 p-4 rounded-lg">
                                <p className="text-md font-semibold text-text-primary mb-2">
                                    <span className="text-brand-primary">Soru {analiz.soruNumarasi}:</span>
                                    <span className="font-bold text-green-400 float-right">Doğru Cevap: {analiz.dogruCevap}</span>
                                </p>
                                <div className="space-y-3 mt-4 text-sm">
                                    <div>
                                        <strong className="font-semibold text-text-secondary block mb-1">Detaylı Açıklama:</strong>
                                        <p className="text-text-primary">{analiz.detayliAciklama}</p>
                                    </div>
                                    <div>
                                        <strong className="font-semibold text-text-secondary block mb-1">Çeldirici Analizi:</strong>
                                        <p className="text-text-primary">{analiz.celdiriciAnalizi}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- MEVCUT KODUNUZ: TEKİL SORU VE AKIŞI BOZAN CÜMLE ANALİZİ ---
    // Eğer 'soruAnalizleri' yoksa, eski formatı (mevcut kodunuzu) render et.
    return (
        <div className="space-y-4 mt-4 border-t border-gray-600 pt-4">
            <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-lg font-bold text-brand-primary mb-3">Analiz Özeti</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div><strong className="text-text-secondary">Soru Tipi:</strong> {result.soruTipi || 'Belirtilmemiş'}</div>
                    <div><strong className="text-text-secondary">Konu:</strong> {result.konu || 'Belirtilmemiş'}</div>
                    <div><strong className="text-text-secondary">Zorluk Seviyesi:</strong> {result.zorlukSeviyesi || 'Belirtilmemiş'}</div>
                    <div className="sm:col-span-2"><strong className="text-text-secondary">Doğru Cevap:</strong> <span className="font-bold text-green-400">{result.dogruCevap || 'Belirtilmemiş'}</span></div>
                </div>
            </div>

            {result.analiz && (
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-brand-primary mb-2">Detaylı Analiz Adımları</h4>
                    <ul className="space-y-2 text-sm text-text-primary">
                        {Object.entries(result.analiz).map(([key, value]) => (
                            <li key={key} className="flex items-start">
                                <span className="text-brand-primary mr-2 mt-1">&#10148;</span>
                                <span><strong className="font-semibold capitalize">{key.replace(/_/g, ' ')}:</strong> {renderValue(value)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-brand-primary mb-2">Kapsamlı Açıklama</h4>
                <p className="text-sm">{result.detayliAciklama || 'Açıklama bulunamadı.'}</p>
            </div>

            {result.digerSecenekler && result.digerSecenekler.length > 0 && (
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-brand-primary mb-2">Diğer Seçeneklerin Analizi</h4>
                    <div className="space-y-3">
                        {result.digerSecenekler.map((opt, index) => (
                            <div key={index} className="p-2 bg-gray-700 rounded">
                                <p className="text-sm"><strong className="font-bold text-red-400">{opt.secenek}:</strong> {opt.aciklama}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisResultDisplay;
