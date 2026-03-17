import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppStore } from '../../stores/appStore';
import { clearAllData } from '../../db/database';
import type { MusicStyle } from '../../types';
import { Button } from '../ui/Button';
import { useState } from 'react';

const MUSIC_STYLES: { value: MusicStyle; label: string }[] = [
  { value: 'ambient-piano', label: 'פסנתר אמביינט' },
  { value: 'nature', label: 'צלילי טבע' },
  { value: 'lofi-generative', label: 'לו-פי גנרטיבי' },
];

export function SettingsScreen() {
  const navigate = useNavigate();
  const { preferredMusicStyle, setPreferredMusicStyle, setCalibrated, setOnboarded } = useAppStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleRecalibrate = () => {
    setCalibrated(false);
    navigate('/calibration');
  };

  const handleClearData = async () => {
    await clearAllData();
    setCalibrated(false);
    setOnboarded(false);
    setShowClearConfirm(false);
    navigate('/onboarding');
  };

  return (
    <div className="screen safe-area-top pb-28 px-6 pt-10 bg-bg-primary">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6">הגדרות</h1>

        {/* Music style */}
        <section className="mb-7">
          <h2 className="text-lg font-semibold mb-3">סגנון מוזיקלי</h2>
          <div className="flex flex-col gap-2">
            {MUSIC_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => setPreferredMusicStyle(style.value)}
                className={`glass-card text-right transition-all appearance-none border-none cursor-pointer text-text-primary ${
                  preferredMusicStyle === style.value
                    ? 'border-accent-calm !border-2 !border-solid'
                    : ''
                }`}
                style={
                  preferredMusicStyle === style.value
                    ? { borderColor: '#6366f1', borderWidth: 2, borderStyle: 'solid' }
                    : {}
                }
              >
                {style.label}
              </button>
            ))}
          </div>
        </section>

        {/* Calibration */}
        <section className="mb-7">
          <h2 className="text-lg font-semibold mb-3">כיול</h2>
          <Button onClick={handleRecalibrate} variant="secondary" size="md" aria-label="כיול מחדש">
            כיול מחדש
          </Button>
        </section>

        {/* Clear data */}
        <section className="mb-7">
          <h2 className="text-lg font-semibold mb-3">ניקוי נתונים</h2>
          {!showClearConfirm ? (
            <Button onClick={() => setShowClearConfirm(true)} variant="ghost" size="md" className="text-accent-stress" aria-label="מחק את כל הנתונים">
              מחק את כל הנתונים
            </Button>
          ) : (
            <div className="glass-card flex flex-col gap-3">
              <p className="text-sm text-accent-stress">פעולה זו תמחק את כל הנתונים לצמיתות. האם להמשיך?</p>
              <div className="flex gap-3">
                <Button onClick={handleClearData} size="sm" className="bg-accent-stress" aria-label="כן, מחק">
                  כן, מחק
                </Button>
                <Button onClick={() => setShowClearConfirm(false)} variant="ghost" size="sm" aria-label="ביטול">
                  ביטול
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Disclaimer */}
        <section className="glass-card text-sm text-text-secondary leading-relaxed">
          <h3 className="font-semibold text-text-primary mb-2">אודות CalmWave</h3>
          <p>
            CalmWave אינה מכשיר רפואי ואינה מחליפה ייעוץ רפואי מקצועי. האפליקציה מיועדת לשימוש ככלי עזר להרפיה בלבד.
          </p>
          <p className="mt-2 text-xs">גרסה 1.0.0</p>
        </section>
      </motion.div>
    </div>
  );
}
