import React, { useState, useEffect } from 'react';
import { X, Download, RefreshCw, CheckCircle, AlertCircle, Rocket } from 'lucide-react';

const UpdateModal = () => {
    const [updateInfo, setUpdateInfo] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, checking, available, downloading, downloaded, error
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [currentVersion, setCurrentVersion] = useState('');
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        // Get current version
        if (window.updater) {
            window.updater.getVersion().then(version => {
                setCurrentVersion(version);
            });

            // Listen for update status
            const cleanup = window.updater.onUpdateStatus((data) => {
                console.log('Update status:', data);

                switch (data.status) {
                    case 'checking':
                        setStatus('checking');
                        break;
                    case 'available':
                        setStatus('available');
                        setUpdateInfo({
                            version: data.version,
                            releaseDate: data.releaseDate,
                            releaseNotes: data.releaseNotes
                        });
                        setDismissed(false); // Show modal when update available
                        break;
                    case 'not-available':
                        setStatus('idle');
                        break;
                    case 'downloading':
                        setStatus('downloading');
                        setDownloadProgress(data.percent || 0);
                        break;
                    case 'downloaded':
                        setStatus('downloaded');
                        break;
                    case 'error':
                        setStatus('error');
                        console.error('Update error:', data.message);
                        break;
                    default:
                        break;
                }
            });

            return cleanup;
        }
    }, []);

    const handleDownload = async () => {
        if (window.updater) {
            setStatus('downloading');
            await window.updater.downloadUpdate();
        }
    };

    const handleInstall = () => {
        if (window.updater) {
            window.updater.installUpdate();
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
    };

    // Don't render if no update or dismissed
    if (status === 'idle' || status === 'checking' || dismissed) {
        return null;
    }

    // Don't render if status is error (silent fail)
    if (status === 'error') {
        return null;
    }

    const formatReleaseNotes = (notes) => {
        if (!notes) return 'Ameliorations et corrections de bugs.';
        if (typeof notes === 'string') return notes;
        if (Array.isArray(notes)) {
            return notes.map(n => n.note || n).join('\n');
        }
        return 'Ameliorations et corrections de bugs.';
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Rocket className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Mise a jour disponible</h2>
                                <p className="text-white/80 text-sm">CashProfit v{updateInfo?.version}</p>
                            </div>
                        </div>
                        {status !== 'downloading' && (
                            <button
                                onClick={handleDismiss}
                                className="p-2 hover:bg-white/20 rounded-full transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Version info */}
                    <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-slate-100">
                        <span className="text-slate-500">Version actuelle</span>
                        <span className="font-mono text-slate-700">v{currentVersion}</span>
                    </div>

                    {/* Release notes */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-700 mb-2">Nouveautes</h3>
                        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 max-h-40 overflow-y-auto">
                            <pre className="whitespace-pre-wrap font-sans">
                                {formatReleaseNotes(updateInfo?.releaseNotes)}
                            </pre>
                        </div>
                    </div>

                    {/* Progress bar (when downloading) */}
                    {status === 'downloading' && (
                        <div className="mb-6">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-slate-600">Telechargement en cours...</span>
                                <span className="font-medium text-indigo-600">{Math.round(downloadProgress)}%</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                    style={{ width: `${downloadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Downloaded success message */}
                    {status === 'downloaded' && (
                        <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 rounded-lg text-emerald-700">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm">Telechargement termine ! Pret a installer.</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        {status === 'available' && (
                            <>
                                <button
                                    onClick={handleDismiss}
                                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition"
                                >
                                    Plus tard
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition flex items-center justify-center gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    Telecharger
                                </button>
                            </>
                        )}

                        {status === 'downloading' && (
                            <button
                                disabled
                                className="flex-1 px-4 py-3 bg-slate-100 text-slate-400 rounded-xl font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                            >
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Telechargement...
                            </button>
                        )}

                        {status === 'downloaded' && (
                            <>
                                <button
                                    onClick={handleDismiss}
                                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition"
                                >
                                    Plus tard
                                </button>
                                <button
                                    onClick={handleInstall}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Installer et redemarrer
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs text-slate-500 text-center">
                        La mise a jour sera installee au prochain redemarrage si vous choisissez "Plus tard"
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;
