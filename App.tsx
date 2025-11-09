import React, { useState, useCallback } from 'react';
import { analyzeTranscript, translateResult } from './services/geminiService';
import type { AnalysisResult } from './types';
import { Header } from './components/Header';
import { TranscriptInput } from './components/TranscriptInput';
import { ResultDisplay } from './components/ResultDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ScriptWriter } from './components/ScriptWriter';

type View = 'main' | 'scriptWriter';

const App: React.FC = () => {
  const [view, setView] = useState<View>('main');
  
  const [transcript, setTranscript] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [translatedResult, setTranslatedResult] = useState<AnalysisResult | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>('Vietnamese');

  const [scriptWriterInput, setScriptWriterInput] = useState<{ result: AnalysisResult; language: string } | null>(null);


  const handleAnalyze = useCallback(async () => {
    if (!transcript.trim()) {
      setError('Vui lòng nhập bản ghi trước khi phân tích.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setTranslatedResult(null);
    setTranslationError(null);

    try {
      const analysis = await analyzeTranscript(transcript);
      setResult(analysis);
    } catch (err) {
      console.error(err);
      setError('Đã xảy ra lỗi khi phân tích. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, [transcript]);

  const handleTranslate = useCallback(async () => {
    if (!result) return;
    setIsTranslating(true);
    setTranslationError(null);
    setTranslatedResult(null);
    try {
        const translation = await translateResult(result, targetLanguage);
        setTranslatedResult(translation);
    } catch (err)
 {
        console.error(err);
        setTranslationError('Không thể dịch kết quả. Vui lòng thử lại.');
    } finally {
        setIsTranslating(false);
    }
  }, [result, targetLanguage]);

  const handleGoToScriptWriter = useCallback(() => {
    if (!translatedResult) return;
    setScriptWriterInput({ result: translatedResult, language: targetLanguage });
    setView('scriptWriter');
  }, [translatedResult, targetLanguage]);
  
  const handleBackToMain = useCallback(() => {
    setScriptWriterInput(null);
    setView('main');
  }, []);

  if (view === 'scriptWriter' && scriptWriterInput) {
    return <ScriptWriter input={scriptWriterInput} onBack={handleBackToMain} />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <Header />
        <main className="mt-8">
          <TranscriptInput
            transcript={transcript}
            onTranscriptChange={setTranscript}
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
          />

          {error && <ErrorDisplay message={error} />}

          {isLoading && <LoadingSpinner />}

          {result && !isLoading && (
            <div className="mt-8 animate-fade-in">
              <ResultDisplay
                result={result}
                translatedResult={translatedResult}
                onTranslate={handleTranslate}
                isTranslating={isTranslating}
                targetLanguage={targetLanguage}
                onLanguageChange={setTargetLanguage}
                translationError={translationError}
                onGoToScriptWriter={handleGoToScriptWriter}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;