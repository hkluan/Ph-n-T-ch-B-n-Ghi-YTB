import React, { useState, useCallback } from 'react';
import { generateScript, translateStory } from '../services/geminiService';
import type { AnalysisResult } from '../types';
import { BackIcon, KeyPointIcon, ScriptIcon, TranslateIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';
import { CopyButton } from './CopyButton';
import { LanguageSelector } from './LanguageSelector';

interface ScriptWriterProps {
  input: {
    result: AnalysisResult;
    language: string;
  };
  onBack: () => void;
}

export const ScriptWriter: React.FC<ScriptWriterProps> = ({ input, onBack }) => {
  const { result, language } = input;
  const [duration, setDuration] = useState<number>(5);
  const [script, setScript] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const defaultTranslationLang = language === 'Vietnamese' ? 'English' : 'Vietnamese';
  const [storyTargetLanguage, setStoryTargetLanguage] = useState<string>(defaultTranslationLang);
  const [translatedScript, setTranslatedScript] = useState<string | null>(null);
  const [isTranslatingScript, setIsTranslatingScript] = useState<boolean>(false);
  const [translationScriptError, setTranslationScriptError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setScript(null);
    setTranslatedScript(null);
    setTranslationScriptError(null);
    try {
      const generatedScript = await generateScript(result, duration, language);
      setScript(generatedScript);
    } catch (err) {
      console.error(err);
      setError('Không thể tạo câu chuyện. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [result, duration, language]);

  const handleTranslateScript = useCallback(async () => {
    if (!script) return;
    setIsTranslatingScript(true);
    setTranslationScriptError(null);
    setTranslatedScript(null);
    try {
      const translation = await translateStory(script, storyTargetLanguage);
      setTranslatedScript(translation);
    } catch (err) {
      console.error(err);
      setTranslationScriptError('Không thể dịch câu chuyện. Vui lòng thử lại.');
    } finally {
      setIsTranslatingScript(false);
    }
  }, [script, storyTargetLanguage]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="w-full max-w-4xl mx-auto">
        <header className="relative text-center mb-8">
          <button
            onClick={onBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Quay lại"
          >
            <BackIcon />
            <span className="hidden sm:inline">Quay Lại</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">
            Người Kể Chuyện AI
          </h1>
        </header>

        <main>
          {/* Context Section */}
          <div className="mb-8 p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
            <h2 className="text-xl font-bold text-slate-300 mb-4">Dựa trên nội dung đã dịch:</h2>
            <div className="mb-3">
                <h3 className="font-semibold text-purple-400">Chủ Đề:</h3>
                <p className="text-slate-300 pl-4">{result.topic}</p>
            </div>
            <div>
                <h3 className="font-semibold text-purple-400">Các Điểm Cốt Lõi:</h3>
                <ul className="space-y-2 mt-2">
                    {result.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                            <span className="text-purple-400 mr-3 mt-1 flex-shrink-0"><KeyPointIcon /></span>
                            <span className="text-slate-300">{point}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </div>
          
          {/* Controls Section */}
          <div className="p-6 bg-slate-800 rounded-xl shadow-lg flex flex-col md:flex-row items-center gap-6">
            <div className="w-full flex-grow">
                <label htmlFor="duration" className="block text-lg font-semibold text-slate-300 mb-2">
                    Thời lượng câu chuyện: <span className="font-bold text-purple-400">{duration} phút</span>
                </label>
                <input
                    id="duration"
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    disabled={isLoading}
                />
            </div>
             <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full md:w-auto flex-shrink-0 inline-flex items-center justify-center gap-3 px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
            >
                <ScriptIcon />
                {isLoading ? 'Đang tạo...' : 'Tạo Câu Chuyện'}
            </button>
          </div>

          {error && <ErrorDisplay message={error} />}
          {isLoading && <LoadingSpinner />}
          
          {script && !isLoading && (
            <div className="mt-8 animate-fade-in space-y-8">
                 <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-baseline gap-3">
                        <h2 className="text-2xl font-bold text-purple-400">Câu Chuyện Của Bạn</h2>
                        <span className="text-sm font-medium text-slate-400">
                            ({script.trim().split(/\s+/).length} từ)
                        </span>
                      </div>
                      <CopyButton textToCopy={script} />
                    </div>
                    <pre className="text-slate-300 whitespace-pre-wrap font-sans text-base leading-relaxed bg-slate-900/50 p-4 rounded-md">
                        {script}
                    </pre>
                </div>

                {/* Story Translation Section */}
                <div className="border-t-2 border-slate-700/50 pt-8">
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-800 p-4 rounded-lg">
                      <h3 className="text-xl font-semibold text-slate-300 flex items-center gap-2 flex-shrink-0">
                          <TranslateIcon />
                          <span>Dịch Câu Chuyện</span>
                      </h3>
                      <div className="w-full sm:w-auto flex-grow">
                        <LanguageSelector 
                          value={storyTargetLanguage}
                          onChange={setStoryTargetLanguage}
                          disabled={isTranslatingScript}
                        />
                      </div>
                      <button
                          onClick={handleTranslateScript}
                          disabled={isTranslatingScript || !script}
                          className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500"
                      >
                          {isTranslatingScript ? 'Đang dịch...' : 'Dịch'}
                      </button>
                  </div>
                  {translationScriptError && <div className="mt-4"><ErrorDisplay message={translationScriptError} /></div>}
                  {isTranslatingScript && <LoadingSpinner />}
                  {translatedScript && !isTranslatingScript && (
                    <div className="mt-8 animate-fade-in">
                      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-baseline gap-3">
                            <h2 className="text-2xl font-bold text-green-400">Câu Chuyện (Đã dịch)</h2>
                            <span className="text-sm font-medium text-slate-400">
                                ({translatedScript.trim().split(/\s+/).length} từ)
                            </span>
                          </div>
                          <CopyButton textToCopy={translatedScript} />
                        </div>
                        <pre className="text-slate-300 whitespace-pre-wrap font-sans text-base leading-relaxed bg-slate-900/50 p-4 rounded-md">
                            {translatedScript}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};