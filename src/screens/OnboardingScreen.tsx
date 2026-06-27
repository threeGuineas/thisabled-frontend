import { useState } from 'react'
import styles from './OnboardingScreen.styles'
import eyeIcon from '../assets/images/eye.svg'
import earIcon from '../assets/images/ear.svg'
import brainIcon from '../assets/images/brain.svg'
import normalIcon from '../assets/images/normal.svg'
import checkY from '../assets/images/check-y.svg'
import nextIcon from '../assets/images/next.svg'
import { type DisabilityType } from '../services/auth'

export type Mode = DisabilityType

interface ModeOption {
  id: DisabilityType
  icon: string
  name: string
  description: string
}

const modes: ModeOption[] = [
  { id: 'visual',        icon: eyeIcon,    name: '시각장애',  description: '음성 해설과 고대비 화면' },
  { id: 'hearing',       icon: earIcon,    name: '청각장애',  description: '자막과 시각 알림 중심 화면' },
  { id: 'developmental', icon: brainIcon,  name: '발달장애',  description: '단순하고 직관적인 화면' },
  { id: 'default',       icon: normalIcon, name: '기본화면',  description: '표준 인터페이스' },
]

interface Props {
  onNext: (mode: DisabilityType) => void
}

export default function OnboardingScreen({ onNext }: Props) {
  const [selected, setSelected] = useState<Mode | null>(null)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>나에게 맞는<br />환경을 설정할게요</h1>
      <p className={styles.subtitle}>환경을 선택하면, 앱 전체 화면이<br />해당 환경에 맞게 바뀝니다.</p>

      <ul className={styles.cardList}>
        {modes.map((mode) => {
          const isSelected = selected === mode.id
          return (
            <li
              key={mode.id}
              className={isSelected ? styles.cardSelected : styles.card}
              onClick={() => setSelected(mode.id)}
            >
              <div className={styles.iconWrapper}>
                <img src={mode.icon} alt="" className={styles.icon} />
              </div>
              <div className={styles.textWrapper}>
                <span className={styles.modeName}>{mode.name}</span>
                <span className={styles.modeDesc}>{mode.description}</span>
              </div>
              <div className={styles.circle}>
                {isSelected && (
                  <img src={checkY} alt="선택됨" className={styles.checkIcon} />
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <button
        disabled={!selected}
        onClick={() => selected && onNext(selected)}
        className={[
          styles.nextButton,
          selected ? styles.nextButtonActive : styles.nextButtonDisabled,
        ].join(' ')}
      >
        다음으로
        <img src={nextIcon} alt="" className={styles.nextIcon} />
      </button>
      <p className={styles.footerText}>나중에 설정에서 언제든 바꿀 수 있어요</p>
    </div>
  )
}
