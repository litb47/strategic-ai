/* global React, ReactDOM, TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakColor, useTweaks */
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "springStiffness": 85,
  "springDamping": 78,
  "starCount": 120,
  "tunnelRings": true,
  "grain": true
}/*EDITMODE-END*/;

function TweaksApp() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    // Expose spring constants to the tunnel engine
    window.__TUNNEL = {
      STIFF: t.springStiffness / 1000,
      DAMP: t.springDamping / 100,
    };
    document.getElementById('rings').style.display = t.tunnelRings ? '' : 'none';
    const vp = document.querySelector('.viewport');
    if (vp) vp.style.setProperty('--grain-on', t.grain ? '0.3' : '0');
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Spring physics" />
      <TweakSlider label="Stiffness" value={t.springStiffness} min={20} max={200} unit=""
                   onChange={(v) => setTweak('springStiffness', v)} />
      <TweakSlider label="Damping" value={t.springDamping} min={50} max={95} unit=""
                   onChange={(v) => setTweak('springDamping', v)} />
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
