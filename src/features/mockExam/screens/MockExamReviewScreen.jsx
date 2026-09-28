import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { colors } from '../../../core/theme/colors';
import { textStyles } from '../../../core/theme/textStyles';
import AppCard from '../../../shared/components/AppCard';
import { prepifyFullMockExam, sectionTypeLabel } from '../data/mockExamContent';
import { findAttemptById } from '../data/mockExamRepository';
import { findReadingPassageById } from '../../reading/data/readingPassagesCatalog';
import { findListeningSessionById } from '../../listening/data/listeningSessionsCatalog';

/**
 * Writing and Speaking sections link to a real, persisted
 * WritingResponse/SpeakingSessionAttempt via linkedResponseIds, so those
 * reuse the existing Writing/Speaking Review screens exactly as a
 * student would see them from Writing/Speaking History — never a
 * duplicate review UI. Reading and Listening don't have a
 * reconstructable per-question review object from a mock exam attempt
 * (only aggregate attempt records are kept) — direct port of the real
 * Flutter screen's own honesty about this, rather than faking a review.
 */
export default function MockExamReviewScreen() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setAttempt(findAttemptById(attemptId));
  }, [attemptId]);

  if (!attempt) {
    return (
      <div style={{ padding: 20 }}>
        <span style={textStyles.body()}>This attempt is no longer available.</span>
      </div>
    );
  }

  const handleOpenSection = (section) => {
    const linkedId = attempt.linkedResponseIds[section.contentId];

    if (section.type === 'writing' && linkedId) {
      navigate(`/practice/writing/review/${section.contentId}`);
      return;
    }
    if (section.type === 'speaking' && linkedId) {
      navigate(`/practice/speaking/review/${section.contentId}`);
      return;
    }
    setNotice("Detailed review isn't available for this section yet — you can replay the passage or session for practice.");
  };

  const sectionTitle = (section) => {
    if (section.type === 'reading') return findReadingPassageById(section.contentId)?.title ?? 'Reading';
    if (section.type === 'listening') return findListeningSessionById(section.contentId)?.title ?? 'Listening';
    if (section.type === 'writing') return 'Your Writing response';
    return 'Your Speaking session';
  };

  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>Review Attempt</h1>
      </div>
      <div style={{ paddingLeft: 8, marginTop: 4, marginBottom: 20 }}>
        <span style={textStyles.bodyDim()}>{prepifyFullMockExam.title}</span>
      </div>

      {notice ? (
        <div style={{ padding: 12, background: colors.surfaceAlt, borderRadius: 12, marginBottom: 16 }}>
          <span style={textStyles.meta()}>{notice}</span>
        </div>
      ) : null}

      {prepifyFullMockExam.sections.map((section) => {
        const canReview = section.type === 'writing' || section.type === 'speaking';
        return (
          <div key={section.contentId} style={{ marginBottom: 12 }}>
            <AppCard onTap={() => handleOpenSection(section)}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span style={textStyles.label()}>{sectionTypeLabel(section.type).toUpperCase()}</span>
                  <div style={{ height: 4 }} />
                  <h2 style={{ ...textStyles.cardTitle(), margin: 0, fontSize: 14 }}>{sectionTitle(section)}</h2>
                  {!canReview ? (
                    <>
                      <div style={{ height: 4 }} />
                      <span style={textStyles.meta()}>Summary only</span>
                    </>
                  ) : null}
                </div>
                <ChevronRight size={18} color={colors.textFaint} />
              </div>
            </AppCard>
          </div>
        );
      })}
    </div>
  );
}
