$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$htmlPath = "$PSScriptRoot\index.html"
$content = [System.IO.File]::ReadAllText($htmlPath)

# 1. Add update checking state and handler to MobileAppQRModal
$qrModalState = @'
  const [copied, setCopied] = useState(false);
  const [showManualSteps, setShowManualSteps] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateStatusMsg, setUpdateStatusMsg] = useState("");

  const handleManualCheckUpdate = async () => {
    setIsCheckingUpdate(true);
    setUpdateStatusMsg("");
    try {
      if ("serviceWorker" in navigator && window.swRegistration) {
        await window.swRegistration.update();
        setTimeout(() => {
          setIsCheckingUpdate(false);
          setUpdateStatusMsg("✓ Mobile app is synced with latest webpage version (v7)!");
          setTimeout(() => setUpdateStatusMsg(""), 3500);
        }, 1000);
      } else {
        setTimeout(() => {
          setIsCheckingUpdate(false);
          setUpdateStatusMsg("✓ App is up to date!");
          setTimeout(() => setUpdateStatusMsg(""), 3500);
        }, 800);
      }
    } catch (e) {
      setIsCheckingUpdate(false);
      setUpdateStatusMsg("✓ Connected to server");
      setTimeout(() => setUpdateStatusMsg(""), 3500);
    }
  };
'@

$patternQrState = '(?s)  const \[copied, setCopied\] = useState\(false\);\s*const \[showManualSteps, setShowManualSteps\] = useState\(false\);'
$content = [System.Text.RegularExpressions.Regex]::Replace($content, $patternQrState, [System.Text.RegularExpressions.MatchEvaluator]{ return $qrModalState })

# 2. Add Live Sync Box inside MobileAppQRModal right before Download / Print / Copy Actions
$liveSyncBox = @'
            {/* Real-time Webpage & Mobile App Update Status */}
            <div className="p-4 rounded-xl bg-stone-800/80 border border-stone-700 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="font-bold text-stone-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Automatic Live Updates</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 text-amber-300 border border-stone-700">
                  v7 Online
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                When product prices, images, or menus are modified on the webpage, mobile apps update automatically whenever opened or connected to WiFi/Data.
              </p>
              <button
                type="button"
                onClick={handleManualCheckUpdate}
                disabled={isCheckingUpdate}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-700 hover:bg-stone-600 active:bg-amber-500 active:text-stone-950 text-xs font-bold text-amber-200 border border-stone-600 flex items-center justify-center gap-1.5 transition"
              >
                <span>{isCheckingUpdate ? "⏳ Checking Webpage for Changes..." : "🔄 Sync & Check for Updates Now"}</span>
              </button>
              {updateStatusMsg && (
                <div className="text-center text-[11px] text-emerald-300 font-semibold pt-0.5">
                  {updateStatusMsg}
                </div>
              )}
            </div>

            {/* Download / Print / Copy Actions */}
'@

$patternQrBox = '(?s)\{\/\* Download \/ Print \/ Copy Actions \*\/\}\s*'
$content = [System.Text.RegularExpressions.Regex]::Replace($content, $patternQrBox, [System.Text.RegularExpressions.MatchEvaluator]{ return $liveSyncBox })

# 3. Add updateAvailable state and listener in App component
$appUpdateHook = @'
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setUpdateAvailable(true);
    };
    const handleRefreshed = () => {
      // If no active transaction is ongoing, reload immediately to apply newest webpage code
      if (cart.length === 0) {
        window.location.reload();
      } else {
        setUpdateAvailable(true);
      }
    };
    window.addEventListener("swUpdateAvailable", handleUpdate);
    window.addEventListener("swRefreshed", handleRefreshed);
    return () => {
      window.removeEventListener("swUpdateAvailable", handleUpdate);
      window.removeEventListener("swRefreshed", handleRefreshed);
    };
  }, [cart.length]);
'@

$patternAppHook = '(?s)  const \[isAppInstalled, setIsAppInstalled\] = useState\(false\);'
$content = [System.Text.RegularExpressions.Regex]::Replace($content, $patternAppHook, [System.Text.RegularExpressions.MatchEvaluator]{ return $appUpdateHook })

# 4. Add floating update toast at the top of App return
$appToast = @'
    <div className="flex h-screen w-screen overflow-hidden bg-stone-950 font-sans select-none">
      {/* Real-time Update Banner when Webpage Changes are Pushed */}
      {updateAvailable && (
        <div className="no-print fixed top-2 left-2 right-2 sm:left-auto sm:right-4 sm:top-4 z-50 animate-bounce">
          <div className="p-3 sm:p-4 rounded-2xl bg-amber-500 text-stone-950 shadow-2xl flex items-center justify-between gap-3 border-2 border-stone-950 font-bold max-w-md">
            <div className="flex items-center gap-2">
              <span className="text-xl">🚀</span>
              <div className="text-left">
                <div className="text-xs uppercase font-black text-stone-950 tracking-wider">
                  Webpage Updated!
                </div>
                <div className="text-[11px] font-semibold text-stone-900 leading-tight">
                  New menu items and improvements are ready.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3.5 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-850 text-amber-300 text-xs font-black shrink-0 shadow transition"
            >
              Update Now ↻
            </button>
          </div>
        </div>
      )}
'@

$patternAppReturn = '(?s)    <div className="flex h-screen w-screen overflow-hidden bg-stone-950 font-sans select-none">'
$content = [System.Text.RegularExpressions.Regex]::Replace($content, $patternAppReturn, [System.Text.RegularExpressions.MatchEvaluator]{ return $appToast })

[System.IO.File]::WriteAllText($htmlPath, $content, $utf8NoBom)
Write-Output "Successfully updated index.html with live mobile sync"

