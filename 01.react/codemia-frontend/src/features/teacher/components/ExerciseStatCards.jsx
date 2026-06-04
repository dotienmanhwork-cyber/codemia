// src/features/teacher/components/ExerciseStatCards.jsx
import StatCard from '../../../shared/components/dashboard-ui/StatCard'

export default function ExerciseStatCards({ stats, loading }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
      gap: 12,
    }}>
      <StatCard
        label="Tổng số bài tập"
        value={loading ? '—' : stats.totalExercises}
        icon="clipboard-list"
        iconColor="var(--purple)"
        iconBg="var(--purple-light)"
      />
      <StatCard
        label="Trắc nghiệm"
        value={loading ? '—' : stats.quizExercises}
        icon="list-check"
        iconColor="var(--blue)"
        iconBg="var(--blue-bg)"
      />
      <StatCard
        label="Bài tập lập trình"
        value={loading ? '—' : stats.codeExercises}
        icon="code"
        iconColor="var(--purple-dim)"
        iconBg="var(--purple-light)"
      />
      <StatCard
        label="Tổng lượt nộp bài"
        value={loading ? '—' : stats.totalSubmissions?.toLocaleString()}
        icon="send"
        iconColor="var(--green)"
        iconBg="var(--green-bg)"
      />
    </div>
  )
}