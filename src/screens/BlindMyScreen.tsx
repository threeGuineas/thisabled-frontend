import { useEffect, useState } from 'react'
import styles from './BlindMyScreen.styles'
import BlindBottomNav, { type Tab } from '../components/BlindBottomNav'
import modeIcon from '../assets/images/mode.svg'
import checkYIcon from '../assets/images/check-y.svg'
import alarmIcon from '../assets/images/alarm.svg'
import mypageWIcon from '../assets/images/mypage-w.svg'
import { getMe, type MeProfile } from '../services/users'

const MODES = [
  { id: 'default',       title: '기본화면', desc: '모든 기능을 기본 UI로' },
  { id: 'visual',        title: '시각장애', desc: '고대비 · 큰 글씨 · 음성 지원' },
  { id: 'hearing',       title: '청각장애', desc: '자막 · 시각 알림' },
  { id: 'developmental', title: '발달장애', desc: '쉬운 말 · 그림 · 큰 버튼' },
] as const

type ModeId = typeof MODES[number]['id']

interface Props {
  onTabChange: (tab: Tab) => void
}

export default function BlindMyScreen({ onTabChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('my')
  const [selectedMode, setSelectedMode] = useState<ModeId>('visual')
  const [pendingMode, setPendingMode] = useState<ModeId | null>(null)
  const [me, setMe] = useState<MeProfile | null>(null)

  useEffect(() => {
    getMe().then(setMe).catch(() => {})
  }, [])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    onTabChange(tab)
  }

  const handleModeClick = (id: ModeId) => {
    if (id === selectedMode) return
    setPendingMode(id)
  }

  const handleConfirm = () => {
    if (pendingMode) setSelectedMode(pendingMode)
    setPendingMode(null)
  }

  const handleCancel = () => {
    setPendingMode(null)
  }

  const pendingModeTitle = MODES.find((m) => m.id === pendingMode)?.title ?? ''

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>마이</span>
      </div>

      {/* 회원 정보 */}
      <div className={styles.section}>
        <div className={styles.profileCard}>
          <div className={styles.profileRow}>
            <div className={`${styles.avatar} bg-[#FFD60A] flex items-center justify-center rounded-full text-black font-bold text-xl`}>
              {me ? me.nickname[0].toUpperCase() : '?'}
            </div>
            <span className={styles.nickname}>{me ? me.nickname : '불러오는 중...'}</span>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>2</span>
              <span className={styles.statLabel}>내 글</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>3</span>
              <span className={styles.statLabel}>댓글</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>9</span>
              <span className={styles.statLabel}>공감</span>
            </div>
          </div>

          <button type="button" className={styles.editButton}>
            <span className={styles.editButtonText}>프로필 편집</span>
          </button>
        </div>
      </div>

      {/* 화면 모드 */}
      <div className={styles.modeSection}>
        <span className={styles.modeSectionTitle}>화면 모드</span>
        <div className={styles.modeCard}>
          <div className={styles.modeList}>
            {MODES.map((mode, idx) => {
              const isActive = selectedMode === mode.id
              return (
                <div key={mode.id}>
                  {idx !== 0 && <div className={styles.modeDivider} />}
                  <button
                    type="button"
                    onClick={() => handleModeClick(mode.id)}
                    className={isActive ? styles.modeButtonActive : styles.modeButton}
                  >
                    <div className={styles.modeTextGroup}>
                      <span className={styles.modeTitle}>{mode.title}</span>
                      <span className={styles.modeDesc}>{mode.desc}</span>
                    </div>
                    <img
                      src={isActive ? checkYIcon : modeIcon}
                      alt=""
                      className={styles.modeIcon}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 기타 */}
      <div className={styles.etcSection}>
        <span className={styles.etcSectionTitle}>기타</span>
        <div className={styles.etcCard}>
          <div className={styles.etcList}>
            <button type="button" className={styles.etcButton}>
              <div className={styles.etcIconWrapper}>
                <img src={alarmIcon} alt="" className={styles.etcIcon} />
              </div>
              <div className={styles.etcTextGroup}>
                <span className={styles.etcTitle}>알림 설정</span>
                <span className={styles.etcDesc}>소리 · 진동 알림</span>
              </div>
              <img src={modeIcon} alt="" className={styles.etcRightIcon} />
            </button>
            <div className={styles.etcDivider} />
            <button type="button" className={styles.etcButton}>
              <div className={styles.etcIconWrapper}>
                <img src={mypageWIcon} alt="" className={styles.etcIcon} />
              </div>
              <div className={styles.etcTextGroup}>
                <span className={styles.etcTitle}>개인정보 및 보안</span>
                <span className={styles.etcDesc}>계정 · 차단 관리</span>
              </div>
              <img src={modeIcon} alt="" className={styles.etcRightIcon} />
            </button>
          </div>
        </div>
      </div>

      {/* 로그아웃 */}
      <button type="button" className={styles.logoutButton}>
        <span className={styles.logoutText}>로그아웃</span>
      </button>

      {/* 오버레이 */}
      {pendingMode && (
        <div className={styles.overlay} onClick={handleCancel} />
      )}

      {/* 모드 전환 바텀시트 */}
      <div className={`${styles.bottomSheet} ${pendingMode ? styles.bottomSheetOpen : styles.bottomSheetClosed}`}>
        <div className={styles.sheetHandle} />
        <span className={styles.sheetTitle}>화면 모드 전환</span>
        <div className={styles.sheetTextGroup}>
          <p className={styles.sheetQuestion}>
            <span className={styles.sheetQuestionHighlight}>{pendingModeTitle} </span>
            모드로 바꿀까요?
          </p>
          <span className={styles.sheetDesc}>앱 전체가 해당 모드에 맞게 바뀌어요.</span>
        </div>
        <button type="button" onClick={handleConfirm} className={styles.sheetConfirmButton}>
          <span className={styles.sheetConfirmText}>변경하기</span>
        </button>
        <button type="button" onClick={handleCancel} className={styles.sheetCancelButton}>
          <span className={styles.sheetCancelText}>취소</span>
        </button>
      </div>

      <BlindBottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  )
}
