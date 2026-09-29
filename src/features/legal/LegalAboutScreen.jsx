import { useNavigate } from 'react-router-dom';
import { ChevronLeft, GraduationCap } from 'lucide-react';
import { colors, heroGradient } from '../../core/theme/colors';
import { textStyles } from '../../core/theme/textStyles';
import AppCard from '../../shared/components/AppCard';
import PrepifyDownloadCard from './PrepifyDownloadCard';

/**
 * Content migrated verbatim from legal_screens.dart, with one factual
 * adaptation: the real Flutter text says "Speaking recordings are saved
 * to local device storage" — but this web build has no recording
 * capability at all (an honest limitation stated throughout the
 * Speaking feature), so that specific claim would be false here. It's
 * replaced with an accurate equivalent rather than copied verbatim.
 * Everything else is unchanged from the source.
 */
const privacyBody = `PREPIFY stores your practice data — including Reading, Listening, Writing, and Speaking activity, Vocabulary and Grammar progress, goals, achievements, and preferences — locally in this browser. This practice data is not transmitted to, or processed by, any server.

To check whether you have PREPIFY PRO, the app sends one thing to PREPIFY's server each time it loads: your PREPIFY ID, a random, anonymous identifier generated in this browser. For customers, the server keeps that ID together with the plan (monthly or lifetime), the date access was granted, and any expiry date. It does not receive your name, email address, or any practice data. To limit abuse, a hashed form of your network address is used to count requests for a few minutes and then discarded. If you buy PRO through Telegram, the person you chat with can see the ID you send and your Telegram account.

Speaking practice in this build does not record or store any audio — no recording capability exists yet, so there is nothing to store beyond your completion of each session.

AI-powered feedback (for example, Writing analysis) is an optional feature. When AI analysis is unavailable — which it is in this build, since no AI provider is configured — no data is sent to any AI service. If a future version enables real AI analysis, only the specific content needed for that analysis (such as the text of one Writing response) will be sent, and this policy will be updated to describe exactly what is sent and to whom before that happens.

You can export your locally stored data as a JSON file, or permanently delete all of it, at any time from Settings.

This policy describes PREPIFY's architecture as it actually exists today. It will be revised if that architecture changes.`;

const termsBody = `PREPIFY is an independent self-study practice tool for IELTS preparation. It is not affiliated with, endorsed by, or connected to IELTS, the British Council, IDP, or Cambridge Assessment English.

Practice content, mock exams, and any band or score estimates shown in PREPIFY are practice estimates only. They are not official IELTS results and should not be relied upon as a guarantee of your actual exam performance.

PREPIFY is provided for educational and practice purposes. Use of PREPIFY does not guarantee any particular exam outcome.

By using PREPIFY, you agree to use the app for its intended purpose of IELTS practice and self-study.`;

const aboutBody = `PREPIFY is built for IELTS preparation — a focused practice tool covering Reading, Listening, Writing, Speaking, Vocabulary, and Grammar, plus full-length Mock Exams and a deterministic intelligence layer that highlights real strengths and focus areas from your own activity.

PREPIFY is an independent practice tool. It is not an official IELTS product and is not affiliated with IELTS, the British Council, IDP, or Cambridge Assessment English. Practice content and mock exam results are estimates for self-study, not official scores.`;

export default function LegalAboutScreen() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '12px 20px 24px', maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => navigate(-1)} aria-label="Go back" style={{ padding: 8 }}>
          <ChevronLeft color={colors.text} />
        </button>
        <h1 style={{ ...textStyles.heading(), margin: 0 }}>About PREPIFY</h1>
      </div>
      <div style={{ height: 20 }} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: heroGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GraduationCap size={28} color={colors.white} aria-hidden="true" />
        </div>
        <div style={{ height: 12 }} />
        <h2 style={{ ...textStyles.heading(), margin: 0, fontSize: 20 }}>PREPIFY</h2>
        <div style={{ height: 4 }} />
        <span style={textStyles.bodyDim()}>Practice smarter. Score higher.</span>
      </div>

      <AppCard style={{ marginBottom: 20 }}>
        <p style={{ ...textStyles.body(), margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{aboutBody}</p>
      </AppCard>

      <div style={{ marginBottom: 20 }}>
        <PrepifyDownloadCard />
      </div>

      <Section title="Privacy Policy" body={privacyBody} />
      <Section title="Terms of Use" body={termsBody} />
    </div>
  );
}

function Section({ title, body }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ ...textStyles.cardTitle(), margin: '0 0 8px' }}>{title}</h2>
      <AppCard>
        <p style={{ ...textStyles.bodyDim(), margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{body}</p>
      </AppCard>
    </div>
  );
}
