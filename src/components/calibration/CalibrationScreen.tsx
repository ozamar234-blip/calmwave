import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeviceMotion } from '../../hooks/useDeviceMotion';
import { useCalibration } from '../../hooks/useCalibration';
import { useAppStore } from '../../stores/appStore';
import { ProgressRing } from '../ui/ProgressRing';
import { Button } from '../ui/Button';

export function CalibrationScreen() {
  const navigate = useNavigate();
  const { permission, requestPermission, samples, startListening, stopListening, clearBuffer } = useDeviceMotion();
  const { isCalibrating, progress, startCalibration, calibration } = useCalibration();
  const { setCalibrated, setMotionPermission } = useAppStore();
  const [phase, setPhase] = useState<'permission' | 'ready' | 'calibrating' | 'done'>('permission');

  useEffect(() => {
    if (permission === 'granted') {
      setPhase('ready');
    }
  }, [permission]);

  useEffect(() => {
    if (calibration && !isCalibrating && phase === 'calibrating') {
      setPhase('done');
      setCalibrated(true);
      stopListening();
    }
  }, [calibration, isCalibrating, phase, setCalibrated, stopListening]);

  const handleRequestPermission = async () => {
    const status = await requestPermission();
    setMotionPermission(status);
    if (status === 'granted') {
      setPhase('ready');
    }
  };

  const handleStartCalibration = () => {
    setPhase('calibrating');
    startListening();
    setTimeout(() => {
      startCalibration(() => [...samples], clearBuffer);
    }, 100);
  };

  const hint = progress < 0.5
    ? 'החזק/י את הטלפון ביד בנוחות'
    : 'מצוין! המשך/י להחזיק';

  return (
    <div className="screen items-center justify-center px-6 bg-gradient-to-b from-bg-primary to-bg-secondary safe-area-top safe-area-bottom">
      {phase === 'permission' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center flex flex-col items-center gap-5 max-w-sm px-2">
          <div className="text-6xl leading-none">📱</div>
          <h1 className="text-2xl font-bold">גישה לחיישני הטלפון</h1>
          <p className="text-text-secondary text-base leading-relaxed">
            כדי למדוד את רמת הלחץ שלך, CalmWave צריכה גישה לחיישני התנועה של הטלפון.
          </p>
          {permission === 'denied' && (
            <div className="glass-card text-accent-stress text-sm">
              ההרשאה נדחתה. אנא אפשר/י גישה לחיישני תנועה בהגדרות הדפדפן ורענן/י את העמוד.
            </div>
          )}
          {permission === 'unavailable' && (
            <div className="glass-card text-accent-medium text-sm">
              חיישני תנועה אינם זמינים במכשיר זה. נסה/י להשתמש בטלפון.
            </div>
          )}
          <Button onClick={handleRequestPermission} size="lg" className="w-full max-w-xs" aria-label="אפשר גישה לחיישנים">
            אפשר גישה לחיישנים
          </Button>
        </motion.div>
      )}

      {phase === 'ready' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center flex flex-col items-center gap-5 max-w-sm px-2">
          <div className="text-6xl leading-none">✋</div>
          <h1 className="text-2xl font-bold">כיול אישי</h1>
          <p className="text-text-secondary text-base leading-relaxed">
            החזק/י את הטלפון ביד בנוחות למשך 30 שניות. אנחנו נלמד את רמת הרעד הטבעית שלך.
          </p>
          <Button onClick={handleStartCalibration} size="lg" className="w-full max-w-xs" aria-label="התחל כיול">
            התחל כיול
          </Button>
        </motion.div>
      )}

      {phase === 'calibrating' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center flex flex-col items-center gap-5">
          <ProgressRing progress={progress} size={200} color="#6366f1">
            <span className="text-3xl font-bold">{Math.round(progress * 100)}%</span>
          </ProgressRing>
          <h2 className="text-xl font-semibold">{hint}</h2>
          <p className="text-text-secondary text-sm">
            {Math.ceil(30 * (1 - progress))} שניות נותרו
          </p>
        </motion.div>
      )}

      {phase === 'done' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center flex flex-col items-center gap-5 max-w-sm px-2">
          <div className="text-6xl leading-none">✅</div>
          <h1 className="text-2xl font-bold">הכיול הושלם!</h1>
          <p className="text-text-secondary text-base leading-relaxed">
            הבייסליין שלך נשמר. עכשיו נוכל למדוד את רמת הלחץ שלך בצורה מדויקת.
          </p>
          <Button onClick={() => navigate('/')} size="lg" className="w-full max-w-xs" aria-label="המשך למסך הראשי">
            המשך
          </Button>
        </motion.div>
      )}
    </div>
  );
}
