import {
  Eyebrow,
  PhImg,
  LeverBadge,
} from '@/components/design-system/primitives';

export interface ChapterAnnotation {
  t: 'critical' | 'warning' | 'opportunity' | 'positive';
  x: number;
  y: number;
}

export interface StoryChapterProps {
  num: string;
  stage: string;
  situation: { title: string; shot: string; body: string };
  lever: { name: string; body: string };
  cost: { range: string; benchmark: string };
  fix: string;
  annotations?: ChapterAnnotation[];
}

export function StoryChapter({
  num,
  stage,
  situation,
  lever,
  cost,
  fix,
  annotations = [],
}: StoryChapterProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '56px 1fr',
        gap: 24,
        paddingBottom: 40,
      }}
    >
      <div style={{ position: 'relative' }}>
        <div className="stage-num">{num}</div>
        <div
          className="dotted-line-v"
          style={{ position: 'absolute', left: 13, top: 36, bottom: -40 }}
        />
      </div>
      <div>
        <Eyebrow style={{ marginBottom: 4 }}>
          Chapter {num} · {stage}
        </Eyebrow>
        <h3
          className="display-900"
          style={{ fontSize: 32, margin: '8px 0 20px', lineHeight: 1.1 }}
        >
          {situation.title}
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 24,
            marginBottom: 28,
          }}
        >
          {/* Screenshot w/ pins */}
          <div
            className="ds-card"
            style={{ padding: 0, overflow: 'hidden', borderColor: 'var(--border-strong)' }}
          >
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface)',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-2)' }}>
                {situation.shot}
              </span>
              <span
                className="mono"
                style={{ fontSize: 10, color: 'var(--text-muted)' }}
              >
                {annotations.length} findings
              </span>
            </div>
            <div style={{ position: 'relative', padding: 16 }}>
              <PhImg label={situation.shot} aspect="unset" height={280} />
              {annotations.map((a, i) => (
                <span
                  key={i}
                  className={`ann-pin pin-${a.t}`}
                  style={{ left: `${a.x}%`, top: `${a.y}%`, position: 'absolute' }}
                >
                  {i + 1}
                </span>
              ))}
            </div>
          </div>
          {/* Situation text */}
          <div>
            <Eyebrow>Situation</Eyebrow>
            <p
              className="body"
              style={{
                fontSize: 15,
                color: 'var(--text)',
                marginTop: 8,
                lineHeight: 1.6,
              }}
            >
              {situation.body}
            </p>
          </div>
        </div>

        {/* SCQA row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          <div
            className="ds-card"
            style={{
              padding: 20,
              background: 'var(--surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <Eyebrow>Complication · lever broken</Eyebrow>
            <div style={{ marginTop: 12 }}>
              <LeverBadge lever={lever.name} />
            </div>
            <p
              className="body"
              style={{
                fontSize: 13.5,
                color: 'var(--text-2)',
                marginTop: 12,
                lineHeight: 1.55,
              }}
            >
              {lever.body}
            </p>
          </div>
          <div className="card-ink" style={{ padding: 20, borderRadius: 10 }}>
            <Eyebrow style={{ color: 'rgba(255,255,255,0.5)' }}>
              So what · EXAMPLE 12-mo cost
            </Eyebrow>
            <div
              className="display-900"
              style={{
                fontSize: 32,
                color: 'var(--accent-bright)',
                margin: '12px 0 4px',
              }}
            >
              {cost.range}
            </div>
            <p
              className="body"
              style={{
                fontSize: 12,
                color: 'var(--ink-text-2)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {cost.benchmark}
            </p>
          </div>
          <div
            className="ds-card"
            style={{
              padding: 20,
              background: 'var(--base)',
              borderColor: 'var(--accent)',
              borderRadius: 10,
            }}
          >
            <Eyebrow accent>Fix · specific</Eyebrow>
            <p
              className="body"
              style={{
                fontSize: 14,
                color: 'var(--text)',
                marginTop: 12,
                lineHeight: 1.55,
                fontWeight: 500,
              }}
            >
              {fix}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
