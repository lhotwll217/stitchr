import '@src/Popup.css';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner, ToggleButton } from '@extension/ui';

const Popup = () => {
  const { isLight } = useStorage(exampleThemeStorage);

  const openOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  };

  return (
    <div className={cn('App flex h-screen flex-col items-center justify-center p-6 transition-colors duration-200', isLight ? 'bg-slate-50' : 'bg-gray-900')}>
      <div className="flex w-full flex-1 flex-col items-center justify-center space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <h1 className="mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-5xl font-extrabold text-transparent">
            Stitchr
          </h1>
          <p className={cn('text-sm font-medium tracking-wide', isLight ? 'text-gray-600' : 'text-gray-400')}>
            REINFORCE YOUR VOCABULARY
          </p>
        </div>

        {/* Visual Element / Decoration */}
        <div className="relative py-4">
          <div className={cn('absolute inset-0 rounded-full blur-xl opacity-20', isLight ? 'bg-blue-400' : 'bg-blue-600')}></div>
          <div className={cn('relative flex items-center gap-2 rounded-lg border px-4 py-3 shadow-sm', isLight ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-700')}>
            <span className={isLight ? 'text-gray-800' : 'text-gray-200'}>Learning</span>
            <span className="text-gray-400">→</span>
            <span className="inline-flex items-center rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 px-2 py-0.5 text-sm font-semibold text-white shadow-sm">
              Oppiminen
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3 pt-4">
          <button
            onClick={openOptions}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]',
              isLight 
                ? 'bg-white text-gray-700 shadow-sm border border-gray-200 hover:bg-gray-50' 
                : 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-750'
            )}
          >
            <span>Settings</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>

      <footer className="mt-6 flex w-full justify-between border-t pt-4 opacity-80" style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}>
        <div className="text-xs">
          <span className={isLight ? 'text-gray-500' : 'text-gray-400'}>v0.1.0</span>
        </div>
        <ToggleButton className="scale-90" />
      </footer>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
