'use client';

import {
  useWorkbook, AnswerArea, StepBadge, Divider,
  WorkbookToolbar, WorkbookHeader, WorkbookShell, cx,
} from '../workbook-shared';
import { WorkbookAuth } from '../WorkbookAuth';
import { useAuth } from '@/components/providers/SupabaseProvider';

export function BrandingWorkbookES() {
  const { user } = useAuth();
  const wb = useWorkbook('es', user?.id);

  return (
    <WorkbookShell loaded={wb.loaded} isDark={wb.isDark}>
      <WorkbookHeader
        title="Workbook de Marca"
        subtitle="Construye una marca personal que crece con el tiempo."
        v={wb.v} update={wb.update}
        namePlaceholder="Tu nombre" businessPlaceholder="Tu negocio"
      />

      {/* Auth */}
      <WorkbookAuth onAuth={wb.handleSave} locale="es" />

      {/* Intro */}
      <div className="mb-14 rounded-xl border-l-4 border-forge-accent bg-forge-surface/50 px-6 py-5 print:bg-transparent print:border-l-2">
        <span className="inline-block rounded-md bg-forge-accent px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white mb-3">
          Objetivo
        </span>
        <p className="font-body text-[15px] leading-relaxed text-forge-text-secondary">
          Tu historia de marca no es solo una transformaci&oacute;n de antes y despu&eacute;s &mdash;
          es una serie de decisiones intencionales que definen c&oacute;mo te ve la gente. Las marcas
          grandes no se construyen en un solo momento &mdash; se construyen con consistencia,
          distinci&oacute;n y las conexiones correctas con tu audiencia. Este workbook te ayudar&aacute;
          a crear una marca que evoluciona y se mantiene relevante.
        </p>
      </div>

      {/* ══ PASO 01 — TU HISTORIA DE MARCA ══ */}
      <section className="step-section mb-16">
        <StepBadge n={1} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">Tu Historia de Marca</h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">Toda marca fuerte tiene una historia en 3 partes. Responde cada secci&oacute;n con honestidad &mdash; escribe como hablas, no como crees que deber&iacute;as sonar.</p>

        <h3 className={cx.h3}>01. El Catalizador &mdash; Por Qu&eacute; Existe Tu Marca</h3>
        <p className={cx.body}>Toda marca empieza porque algo necesitaba cambiar. No siempre es una lucha &mdash; a veces es una oportunidad que nadie m&aacute;s vio.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> Nike no empez&oacute; porque Phil Knight quer&iacute;a ser rico &mdash; empez&oacute; porque vio un hueco en el mercado de zapatos de alto rendimiento.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Preg&uacute;ntate:</p>
        <ul className={cx.questions}>
          <li>&iquest;Qu&eacute; necesita cambiar en tu industria?</li>
          <li>&iquest;Qu&eacute; ves t&uacute; que otros no ven?</li>
          <li>&iquest;Por qu&eacute; sientes la necesidad de hacer algo diferente?</li>
        </ul>
        <AnswerArea id="catalyst" value={wb.v('catalyst')} onChange={(val) => wb.update('catalyst', val)} placeholder="&iquest;Qu&eacute; te impuls&oacute; a empezar? &iquest;Qu&eacute; hueco viste?" />

        <h3 className={cx.h3}>02. La Verdad Central &mdash; Qu&eacute; Te Hace Diferente</h3>
        <p className={cx.body}>Una marca fuerte destaca &mdash; no se mezcla con las dem&aacute;s. Esto no significa ser controversial por serlo &mdash; significa tener una convicci&oacute;n diferente al mercado y compartirla.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> Russ cree que los artistas deben ser due&ntilde;os de su m&uacute;sica y mantenerse independientes. Refuerza esta creencia a trav&eacute;s de su m&uacute;sica y entrevistas.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Preg&uacute;ntate:</p>
        <ul className={cx.questions}>
          <li>&iquest;Qu&eacute; crees t&uacute; que otros en tu campo no creen?</li>
          <li>&iquest;Qu&eacute; parte de tu personalidad sobresale?</li>
          <li>&iquest;Qu&eacute; te elogian las personas que puedes aprovechar?</li>
          <li>&iquest;Por qu&eacute; le importar&iacute;a esto a tu audiencia?</li>
        </ul>
        <AnswerArea id="coreTruth" value={wb.v('coreTruth')} onChange={(val) => wb.update('coreTruth', val)} placeholder="&iquest;Cu&aacute;l es tu creencia contraria? &iquest;Qu&eacute; te distingue?" />

        <h3 className={cx.h3}>03. La Prueba &mdash; C&oacute;mo Refuerzas Tu Identidad</h3>
        <p className={cx.body}>Una historia no es lo que dices &mdash; es lo que demuestras una y otra vez. Las marcas fuertes no solo tienen una historia de &eacute;xito pasada &mdash; tienen un patr&oacute;n continuo de credibilidad.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> GaryVee no solo habl&oacute; de volumen de contenido una vez &mdash; lo ha demostrado por m&aacute;s de 15 a&ntilde;os.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Preg&uacute;ntate:</p>
        <ul className={cx.questions}>
          <li>&iquest;C&oacute;mo refuerza cada pieza de contenido las asociaciones que quieres que la gente haga contigo?</li>
          <li>&iquest;Qu&eacute; casos de estudio o ejemplos puedes compartir para establecer credibilidad?</li>
          <li>Si alguien escucha tu nombre, &iquest;qu&eacute; es lo primero que quieres que piense?</li>
        </ul>
        <AnswerArea id="proof" value={wb.v('proof')} onChange={(val) => wb.update('proof', val)} placeholder="&iquest;Qu&eacute; patr&oacute;n de prueba puedes se&ntilde;alar?" />
      </section>

      <Divider />

      {/* ══ PASO 02 — HISTORIAS ══ */}
      <section className="step-section mb-16">
        <StepBadge n={2} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">Los Mejores Tipos de Historias</h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">No todas las historias funcionan igual en contenido. Las mejores caen en estas categor&iacute;as. Para cada tipo, escribe al menos una historia real de tu experiencia.</p>

        <div className={cx.story}>
          <h3 className={cx.h3}>01. Historias de Origen</h3>
          <p className={cx.body}>&iquest;Por qu&eacute; haces lo que haces? &iquest;Qu&eacute; momento defini&oacute; tu carrera?</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;A los 22 vi c&oacute;mo mi familia se qued&oacute; sin nada cuando mi t&iacute;o tuvo un accidente y no ten&iacute;a seguro. Ah&iacute; decid&iacute; que nadie m&aacute;s iba a pasar por eso.&rdquo;</p>
          <AnswerArea id="originStory" value={wb.v('originStory')} onChange={(val) => wb.update('originStory', val)} rows={4} placeholder="El momento que defini&oacute; tu camino..." />
        </div>
        <div className={cx.story}>
          <h3 className={cx.h3}>02. Historias de Fracaso</h3>
          <p className={cx.body}>La gente conf&iacute;a m&aacute;s en la vulnerabilidad que en el &eacute;xito. Habla de qu&eacute; sali&oacute; mal y qu&eacute; aprendiste.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;Perd&iacute; a mi cliente m&aacute;s grande porque no entend&iacute; esta cosa...&rdquo;</p>
          <AnswerArea id="failureStory" value={wb.v('failureStory')} onChange={(val) => wb.update('failureStory', val)} rows={4} placeholder="Un momento donde las cosas salieron mal y qu&eacute; aprendiste..." />
        </div>
        <div className={cx.story}>
          <h3 className={cx.h3}>03. Historias de &Eacute;xito</h3>
          <p className={cx.body}>Muestra transformaciones de antes y despu&eacute;s. Destaca peque&ntilde;os logros que llevaron a resultados grandes.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;Un cliente de 28 a&ntilde;os me dijo que no necesitaba seguro de vida. Dos a&ntilde;os despu&eacute;s me llam&oacute; llorando porque tuvo un diagn&oacute;stico dif&iacute;cil &mdash; y gracias al seguro, pudo pagar todo.&rdquo;</p>
          <AnswerArea id="successStory" value={wb.v('successStory')} onChange={(val) => wb.update('successStory', val)} rows={4} placeholder="Una transformaci&oacute;n que hiciste posible..." />
        </div>
        <div className={cx.story}>
          <h3 className={cx.h3}>04. Historias de Clientes</h3>
          <p className={cx.body}>Deja que tu audiencia se vea reflejada en tu contenido. Historias reales de personas que tomaron acci&oacute;n.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;Una pareja de 35 a&ntilde;os me contact&oacute; sin saber nada de seguros. En 3 meses ten&iacute;an protecci&oacute;n completa para su familia y un plan de ahorro.&rdquo;</p>
          <AnswerArea id="clientStory" value={wb.v('clientStory')} onChange={(val) => wb.update('clientStory', val)} rows={4} placeholder="Un cliente que tom&oacute; acci&oacute;n y obtuvo resultados..." />
        </div>
        <div className={cx.story}>
          <h3 className={cx.h3}>05. Historias de la Industria</h3>
          <p className={cx.body}>Habla de tendencias, errores comunes y cambios en tu industria que nadie m&aacute;s est&aacute; mencionando.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;La forma en que las empresas est&aacute;n manejando [X] est&aacute; cambiando &mdash; esto es lo que nadie te est&aacute; diciendo...&rdquo;</p>
          <AnswerArea id="industryStory" value={wb.v('industryStory')} onChange={(val) => wb.update('industryStory', val)} rows={4} placeholder="Una tendencia o insight que otros no ven..." />
        </div>
      </section>

      <Divider />

      {/* ══ PASO 03 — TU MERCADO ══ */}
      <section className="step-section mb-16">
        <StepBadge n={3} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">Tu Cliente Ideal y Tus Productos</h2>

        <h3 className={cx.h3}>Tu Cliente</h3>
        <ul className={cx.questions}>
          <li>Describe a tu cliente ideal en una oraci&oacute;n (edad, situaci&oacute;n, qu&eacute; necesita).</li>
          <li>&iquest;Cu&aacute;l es el miedo #1 que tiene tu cliente?</li>
          <li>&iquest;Cu&aacute;l es la objeci&oacute;n que m&aacute;s escuchas?</li>
          <li>&iquest;Qu&eacute; es lo que m&aacute;s valoran de ti?</li>
        </ul>
        <AnswerArea id="idealClient" value={wb.v('idealClient')} onChange={(val) => wb.update('idealClient', val)} placeholder="&iquest;Qui&eacute;n es tu cliente ideal? &iquest;Qu&eacute; lo desvela?" />

        <h3 className={cx.h3}>Tus Servicios y Productos</h3>
        <p className={cx.body}>Lista tus servicios o productos en orden del m&aacute;s importante al menos importante para tu negocio. &iquest;Cu&aacute;l es el m&aacute;s f&aacute;cil de vender y por qu&eacute;?</p>
        <AnswerArea id="services" value={wb.v('services')} onChange={(val) => wb.update('services', val)} placeholder={"1. (m\u00e1s importante)\n2.\n3.\n4.\n\nM\u00e1s f\u00e1cil de vender y por qu\u00e9:"} />

        <h3 className={cx.h3}>Recursos Para Regalar</h3>
        <p className={cx.body}>&iquest;Qu&eacute; gu&iacute;as, calculadoras o herramientas puedes ofrecer gratis a tu audiencia? Lista al menos 3.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplos:</strong> &ldquo;5 preguntas antes de contratar un [servicio]&rdquo; &middot; &ldquo;Calculadora de ROI para [producto]&rdquo; &middot; &ldquo;Gu&iacute;a para principiantes de [tema]&rdquo;</p>
        <AnswerArea id="freeResources" value={wb.v('freeResources')} onChange={(val) => wb.update('freeResources', val)} rows={4} placeholder={"1.\n2.\n3."} />
      </section>

      <Divider />

      {/* ══ PASO 04 — VOZ E IDENTIDAD ══ */}
      <section className="step-section mb-16">
        <StepBadge n={4} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">Voz, Visual e Identidad</h2>
        <ul className={cx.questions}>
          <li>&iquest;C&oacute;mo hablas con tus clientes &mdash; de t&uacute; o de usted? &iquest;Formal o casual?</li>
          <li>&iquest;Usas jerga o coloquialismos? &iquest;O prefieres algo m&aacute;s neutro?</li>
          <li>&iquest;Te gusta tu branding actual? &iquest;Qu&eacute; cambiar&iacute;as?</li>
          <li>&iquest;Hay cuentas de redes sociales que admires por c&oacute;mo se ven? Comparte 2&ndash;3.</li>
          <li>Completa: &ldquo;[Tu nombre] es el de _____.&rdquo;</li>
          <li>&iquest;Qu&eacute; quieres que la gente <em>sienta</em> cuando vea tu contenido?</li>
        </ul>
        <AnswerArea id="voiceIdentity" value={wb.v('voiceIdentity')} onChange={(val) => wb.update('voiceIdentity', val)} placeholder="Describe c&oacute;mo quieres que tu marca suene, se vea y se sienta..." rows={8} />
      </section>

      <WorkbookToolbar
        completedCount={wb.completedCount} saveStatus={wb.saveStatus}
        onSave={wb.handleSave} onExport={wb.handleExport}
        onReset={() => wb.handleReset('Borrar todas las respuestas? No se puede deshacer.')}
        isDark={wb.isDark} onToggleDark={wb.toggleDark}
        saveLabel="Guardar" exportLabel="Exportar PDF" resetLabel="Limpiar"
        sectionsLabel={`de ${12} secciones`}
      />
    </WorkbookShell>
  );
}
