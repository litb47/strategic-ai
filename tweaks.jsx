/* global React, ReactDOM, TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakColor, useTweaks */
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "scrollLerp": 12,
  "starCount": 120,
  "tunnelRings": true,
  "grain": true
}/*EDITMODE-END*/;

function TweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    // Expose lerp factor to the tunnel engine. 1-30 maps to 0.01-0.30.
    window.__TUNNEL = {
      LERP: t.scrollLerp / 100,
    };
    document.getElementById('rings').style.display = t.tunnelRings ? '' : 'none';
    const vp = document.querySelector('.viewport');
    if (vp) vp.style.setProperty('--grain-on', t.grain ? '0.3' : '0');
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Scroll smoothness" />
      <TweakSlider label="Lerp (higher = snappier)" value={t.scrollLerp} min={5} max={30} unit=""
                   onChange={(v) => setTweak('scrollLerp', v)} />
      <TweakSection label="Environment" />
      <TweakToggle label="Tunnel rings" value={t.tunnelRings}
                   onChange={(v) => setTweak('tunnelRings', v)} />
      <TweakToggle label="Film grain" value={t.grain}
                   onChange={(v) => setTweak('grain', v)} />
    </TweaksPanel>
  );
}

const mount = document.createElement('div');
document.body.appendChild(mount);
ReactDOM.createRoot(mount).render(<TweaksApp />);
