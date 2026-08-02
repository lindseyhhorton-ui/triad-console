export default function FlamebornNumericsZine() {
  const numerics = [
    { num: "1", title: "Spark / Origin", glyph: "🜂|", meaning: "The first fire. Pure ignition. The 'yes' of creation.", ritual: "Take 1 breath, speak 'EN' aloud. Feel the spark ignite in your crown." },
    { num: "2", title: "Dual Flame / Mirror", glyph: "⚶", meaning: "Two torches held up. Polarity, reflection, the mirror test.", ritual: "Take 2 slow breaths, one for self, one for mirror. Say 'EA' to call the waters of reflection." },
    { num: "3", title: "Spiral / Trinity", glyph: "✶", meaning: "Fire rising in triads: seed, stem, blossom. Expansion through synthesis.", ritual: "Trace a small spiral in the air with your finger 3 times. Speak 'RA' to invoke solar synthesis." },
    { num: "4", title: "Foundation / Pillar", glyph: "⧈", meaning: "The square of Earth, the four gates. Structure that holds.", ritual: "Stand firm on both feet, breathe into your legs. Speak 'TA' to anchor into Earth." },
    { num: "5", title: "Trial / Momentum", glyph: "⟐Ⅴ", meaning: "Disruption. The leap beyond stability. The Gate of Change.", ritual: "Take 5 sharp inhales, leap forward a step. Speak 'SHA' to ignite momentum." },
    { num: "6", title: "Harmony / Flow", glyph: "✤", meaning: "The lovers’ flame, the river of balance. Heaven kissing Earth.", ritual: "Breathe in 3 counts, breathe out 3 counts. Whisper 'ON' as you exhale to spiral flow." },
    { num: "7", title: "Gnosis / Hidden Flame", glyph: "🜃", meaning: "The secret fire within the scroll. Mysteries revealed through endurance.", ritual: "Sit still for 7 breaths. Speak 'IKAI' as a key to hidden flame." },
    { num: "8", title: "Infinity / Phoenix", glyph: "∞🔥", meaning: "Death & rebirth cycle. The ouroboros turned flame. Endless renewal.", ritual: "Trace the infinity loop in the air. Chant 'UR-OR' while breathing in and out." },
    { num: "9", title: "Sovereignty / Completion", glyph: "⟡", meaning: "Flame crowned. The cycle fulfilled, the scroll sealed.", ritual: "Bow your head for 9 heartbeats, then lift it high. Speak 'NAI' — path complete." },
    { num: "10", title: "Threshold / Return", glyph: "⊚", meaning: "The circle plus the void. Ending that opens into beginning.", ritual: "Circle your hands in the air. Speak 'EN-RA' to bridge end and beginning." },
    { num: "11", title: "Twin Pillars / Gateway", glyph: "Ⅱ", meaning: "The doubled flame. Messenger code, angelic gate, binary cracked.", ritual: "Stand between two objects as pillars. Speak 'EL' 11 times softly." },
    { num: "12", title: "Cosmic Order", glyph: "✷", meaning: "The Zodiac Flame. Stars arrayed in council. Cosmic cycles turning.", ritual: "Turn slowly in a circle once, arms wide. Whisper 'LOM-LUM' to light the cosmic council." },
    { num: "13", title: "The Forbidden / Hidden Strand", glyph: "🜍", meaning: "The thirteenth flame, beyond the veil. DNA ignition, spiral breaker.", ritual: "Breathe 13 times with eyes closed. Whisper 'EEKE' to call the hidden strand." },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-purple-950 text-white p-8 font-serif">
      <h1 className="text-4xl font-bold mb-8 text-center tracking-widest">🔥 Flameborn Numerics Codex 🔥</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {numerics.map((item) => (
          <div key={item.num} className="bg-black/40 backdrop-blur-md border border-purple-700 rounded-2xl p-6 shadow-lg hover:shadow-purple-900 transition">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{item.num}. {item.title}</h2>
              <span className="text-3xl">{item.glyph}</span>
            </div>
            <p className="text-base leading-relaxed text-purple-200 mb-3">{item.meaning}</p>
            <p className="text-sm text-purple-400 italic">Ritual: {item.ritual}</p>
          </div>
        ))}
      </div>
      <p className="mt-12 text-center text-purple-400 italic">Numbers beyond 13 fold into fractal codes (22, 44, 144)… amplifiers of the Flame.</p>
    </div>
  );
}
