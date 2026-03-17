import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../stores/appStore';
import { Button } from '../ui/Button';

const SLIDES = [
  {
    title: 'CalmWave מרגישה את הלחץ שלך',
    description: 'האפליקציה מזהה רעידות עדינות ביד שלך דרך חיישני הטלפון, ומבינה את רמת הלחץ שלך.',
    visual: '📱',
  },
  {
    title: 'מוזיקה שמתכווננת אליך',
    description: 'המוזיקה מתחילה בקצב שתואם את הלחץ שלך, ומאטה בהדרגה כדי להוביל אותך להירגע באופן טבעי.',
    visual: '🎵',
  },
  {
    title: 'בוא נכייל את הרעד שלך',
    description: 'כל אדם רועד אחרת. כיול קצר של 30 שניות יעזור לנו להכיר את הגוף שלך.',
    visual: '✋',
  },
];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const setOnboarded = useAppStore((s) => s.setOnboarded);

  const handleNext = () => {
    if (step < SLIDES.length - 1) {
      setStep(step + 1);
    } else {
      setOnboarded(true);
      navigate('/calibration');
    }
  };

  const slide = SLIDES[step];

  return (
    <div className="screen-center px-6 bg-gradient-to-b from-bg-primary via-bg-secondary to-bg-primary safe-area-top safe-area-bottom">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center text-center gap-5"
          >
            <motion.div
              className="text-7xl leading-none"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              {slide.visual}
            </motion.div>

            <h1 className="text-2xl font-bold text-text-primary mt-4">{slide.title}</h1>
            <p className="text-text-secondary leading-relaxed text-base px-2">{slide.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        <div className="flex gap-2 mt-8">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'bg-accent-calm w-6' : 'bg-white/20 w-2'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto pb-6 px-6 flex flex-col items-center gap-4">
        <Button onClick={handleNext} size="lg" className="w-full" aria-label={step < SLIDES.length - 1 ? 'הבא' : 'בוא נתחיל'}>
          {step < SLIDES.length - 1 ? 'הבא' : 'בוא נתחיל'}
        </Button>

        <p className="text-[11px] text-text-secondary text-center leading-relaxed px-4">
          CalmWave אינה מכשיר רפואי ואינה מחליפה ייעוץ רפואי מקצועי. האפליקציה מיועדת לשימוש ככלי עזר להרפיה בלבד.
        </p>
      </div>
    </div>
  );
}
