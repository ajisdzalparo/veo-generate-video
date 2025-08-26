import React, { useState, useCallback } from 'react';
import type { AspectRatio, Resolution } from './types';
import { generateVideo } from './services/geminiService';
import LoadingIndicator from './components/LoadingIndicator';
import VideoPlayer from './components/VideoPlayer';
import { UploadIcon, TrashIcon, VideoIcon } from './components/icons';

const App: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [referenceImage, setReferenceImage] = useState<{ file: File | null; previewUrl: string | null; base64: string | null; mimeType: string | null }>({
        file: null,
        previewUrl: null,
        base64: null,
        mimeType: null,
    });
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
    const [resolution, setResolution] = useState<Resolution>('1080p');

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setReferenceImage({ file, previewUrl, base64: base64String, mimeType: file.type });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        if (referenceImage.previewUrl) {
            URL.revokeObjectURL(referenceImage.previewUrl);
        }
        setReferenceImage({ file: null, previewUrl: null, base64: null, mimeType: null });
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!prompt || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        
        try {
            const videoUrl = await generateVideo({
                prompt,
                imageBase64: referenceImage.base64 || undefined,
                mimeType: referenceImage.mimeType || undefined,
                aspectRatio,
                soundEnabled,
                resolution,
                onStatusUpdate: setLoadingMessage,
            });
            setGeneratedVideoUrl(videoUrl);
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
                        VEO Video Generator
                    </h1>
                    <p className="mt-4 text-lg text-gray-400">
                        Craft stunning videos from your ideas using the power of AI.
                    </p>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Control Panel */}
                    <div className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl border border-gray-700">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Prompt */}
                                <div>
                                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                                        Prompt
                                    </label>
                                    <textarea
                                        id="prompt"
                                        rows={5}
                                        className="block w-full bg-gray-900 border-gray-700 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-100 placeholder-gray-500"
                                        placeholder="e.g., A majestic lion roaring on a rocky outcrop, cinematic lighting..."
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>

                                {/* Image Uploader */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Reference Image (Optional)
                                    </label>
                                    {referenceImage.previewUrl ? (
                                        <div className="relative group">
                                            <img src={referenceImage.previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-md" />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                disabled={isLoading}
                                                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-red-500/80 transition-colors opacity-0 group-hover:opacity-100"
                                                aria-label="Remove image"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                                            <div className="space-y-1 text-center">
                                                <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                                                <div className="flex text-sm text-gray-400">
                                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-900 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 focus-within:ring-offset-gray-900">
                                                        <span>Upload a file</span>
                                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} disabled={isLoading} />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Configuration */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <ConfigOption title="Aspect Ratio">
                                        <RadioGroup value={aspectRatio} onChange={setAspectRatio} disabled={isLoading}>
                                            <RadioButton value="16:9" label="16:9" />
                                            <RadioButton value="9:16" label="9:16" />
                                        </RadioGroup>
                                    </ConfigOption>
                                    <ConfigOption title="Resolution">
                                        <RadioGroup value={resolution} onChange={setResolution} disabled={isLoading}>
                                            <RadioButton value="1080p" label="1080p" />
                                            <RadioButton value="720p" label="720p" />
                                        </RadioGroup>
                                    </ConfigOption>
                                </div>
                                <ConfigOption title="Sound">
                                    <ToggleSwitch enabled={soundEnabled} setEnabled={setSoundEnabled} disabled={isLoading} />
                                </ConfigOption>


                                {/* Submit Button */}
                                <div>
                                    <button
                                        type="submit"
                                        disabled={!prompt || isLoading}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isLoading ? 'Generating...' : 'Generate Video'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Output Panel */}
                    <div className="bg-gray-800/50 p-6 rounded-2xl shadow-2xl border border-gray-700 flex items-center justify-center min-h-[400px] lg:min-h-full">
                        {isLoading ? (
                            <LoadingIndicator message={loadingMessage} />
                        ) : error ? (
                            <div className="text-center text-red-400">
                                <h3 className="text-lg font-semibold">Generation Failed</h3>
                                <p className="mt-2 text-sm">{error}</p>
                            </div>
                        ) : generatedVideoUrl ? (
                            <VideoPlayer src={generatedVideoUrl} />
                        ) : (
                            <div className="text-center text-gray-500">
                                <VideoIcon className="mx-auto h-16 w-16" />
                                <h3 className="mt-4 text-lg font-medium text-gray-300">Your generated video will appear here</h3>
                                <p className="mt-1 text-sm">Fill out the form to get started.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

// Helper sub-components for UI clarity

const ConfigOption: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">{title}</h3>
        {children}
    </div>
);

// Fix: Add type guard for child props to ensure `value` exists and is a string.
// Cast the value passed to `onChange` to `T` to match the state setter's type.
const RadioGroup = <T extends string,>({ value, onChange, disabled, children }: { value: T; onChange: (v: T) => void; disabled: boolean; children: React.ReactNode }) => (
    <div className="flex space-x-2 bg-gray-900 p-1 rounded-md">
      {React.Children.map(children, (child) => {
          if (React.isValidElement<{ value: string }>(child)) {
              return React.cloneElement(child, {
                  isChecked: child.props.value === value,
                  onChange: () => onChange(child.props.value as T),
                  disabled,
              });
          }
          return child;
      })}
    </div>
);

const RadioButton = ({ value, label, isChecked, onChange, disabled }: { value: string; label: string; isChecked?: boolean; onChange?: () => void; disabled?: boolean }) => (
  <label className={`w-full text-center py-2 px-4 rounded cursor-pointer text-sm font-medium transition-colors ${isChecked ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <input type="radio" value={value} checked={isChecked} onChange={onChange} disabled={disabled} className="sr-only" />
    {label}
  </label>
);

const ToggleSwitch = ({ enabled, setEnabled, disabled }: { enabled: boolean, setEnabled: (e: boolean) => void, disabled: boolean }) => (
    <button
        type="button"
        className={`${enabled ? 'bg-indigo-600' : 'bg-gray-700'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => setEnabled(!enabled)}
        disabled={disabled}
    >
        <span className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
    </button>
);


export default App;
