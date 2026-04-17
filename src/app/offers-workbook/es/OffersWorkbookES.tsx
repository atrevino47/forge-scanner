'use client';

import {
  useWorkbook, AnswerArea, StepBadge, Divider,
  WorkbookToolbar, WorkbookHeader, WorkbookShell, cx,
  OFFERS_CONTENT_FIELDS,
} from '../../branding-workbook/workbook-shared';
import { WorkbookAuth } from '../../branding-workbook/WorkbookAuth';
import { useAuth } from '@/components/providers/SupabaseProvider';

export function OffersWorkbookES() {
  const { user } = useAuth();
  const wb = useWorkbook('es', user?.id, { type: 'offers', contentFields: OFFERS_CONTENT_FIELDS });

  return (
    <WorkbookShell loaded={wb.loaded} isDark={wb.isDark}>
      <WorkbookHeader
        title="Workbook de Oferta"
        subtitle="Construye una oferta tan buena que decir no se sienta tonto."
        v={wb.v} update={wb.update}
        namePlaceholder="Tu nombre" businessPlaceholder="Tu negocio"
      />

      <WorkbookAuth onAuth={wb.handleSave} locale="es" />

      {/* Intro */}
      <div className="mb-14 rounded-xl border-l-4 border-forge-accent bg-forge-surface/50 px-6 py-5 print:bg-transparent print:border-l-2">
        <span className="inline-block rounded-md bg-forge-accent px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-white mb-3">
          Objetivo
        </span>
        <p className="font-body text-[15px] leading-relaxed text-forge-text-secondary">
          La mayor&iacute;a de los negocios compiten por precio porque sus ofertas se ven iguales. Una Grand Slam Offer es distinta &mdash;
          tan distinta que el prospecto no la puede comparar con nada. La decisi&oacute;n deja de ser
          &ldquo;t&uacute; vs. una opci&oacute;n m&aacute;s barata&rdquo; y se vuelve &ldquo;t&uacute; vs. no hacer nada.&rdquo; Este workbook te gu&iacute;a por
          los siete movimientos para llegar ah&iacute;: elige al p&uacute;blico correcto, define el sue&ntilde;o, inventar&iacute;a cada problema,
          convi&eacute;rtelos en soluciones, decide c&oacute;mo entregar, recorta y arma el bundle, y por &uacute;ltimo potencia la oferta.
        </p>
      </div>

      {/* ══ PASO 01 — MULTITUD HAMBRIENTA ══ */}
      <section className="step-section mb-16">
        <StepBadge n={1} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Tu Multitud Hambrienta
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Elige el mercado antes que la oferta. Una oferta promedio para una multitud hambrienta le gana a una oferta excelente para un mercado indiferente.
        </p>

        <h3 className={cx.h3}>01. El Avatar &mdash; Qui&eacute;n Espec&iacute;ficamente</h3>
        <p className={cx.body}>Describe a una sola persona espec&iacute;fica &mdash; no un segmento. Entre m&aacute;s espec&iacute;fico, m&aacute;s se siente como si tu oferta estuviera hecha para ella.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;Due&ntilde;os de negocios de climatizaci&oacute;n, $2&ndash;5M/a&ntilde;o, con 3&ndash;8 camionetas, que todav&iacute;a despachan desde una hoja de Excel, estresados por la baja de Q3, 45&ndash;55 a&ntilde;os, casi siempre el fundador.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Preg&uacute;ntate:</p>
        <ul className={cx.questions}>
          <li>&iquest;Qui&eacute;n es la persona que apostar&iacute;as tu &uacute;ltimo peso que tiene este dolor?</li>
          <li>&iquest;Qu&eacute; industria? &iquest;Qu&eacute; rango de facturaci&oacute;n? &iquest;En qu&eacute; etapa de vida?</li>
          <li>&iquest;C&oacute;mo se ve su martes en la ma&ntilde;ana?</li>
          <li>&iquest;C&oacute;mo se enteran de soluciones &mdash; podcasts, conferencias, LinkedIn, amigos?</li>
        </ul>
        <AnswerArea id="crowdAvatar" value={wb.v('crowdAvatar')} onChange={(val) => wb.update('crowdAvatar', val)} placeholder="Describe a una persona espec&iacute;fica, no una categor&iacute;a..." />

        <h3 className={cx.h3}>02. El Dolor &mdash; Lo Que Pagar&iacute;an Por Resolver Ma&ntilde;ana</h3>
        <p className={cx.body}>Las multitudes hambrientas tienen un dolor urgente, visible y caro si no se resuelve. Si el dolor es leve, la oferta no va a importar.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;Est&aacute;n perdiendo $30K/mes porque la mitad de sus leads entrantes nunca reciben llamada de regreso. Lo saben. No lo pueden arreglar sin contratar. Contratar es una pesadilla.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Preg&uacute;ntate:</p>
        <ul className={cx.questions}>
          <li>&iquest;Cu&aacute;l es su dolor #1 &mdash; el que les quita el sue&ntilde;o?</li>
          <li>&iquest;Cu&aacute;nto les cuesta este dolor al mes en dinero, tiempo o estr&eacute;s?</li>
          <li>&iquest;Ya intentaron resolverlo? &iquest;Qu&eacute; no funcion&oacute;?</li>
          <li>&iquest;Por qu&eacute; es diferente ahora &mdash; qu&eacute; los obliga a actuar este trimestre y no el pr&oacute;ximo a&ntilde;o?</li>
        </ul>
        <AnswerArea id="crowdPain" value={wb.v('crowdPain')} onChange={(val) => wb.update('crowdPain', val)} placeholder="El dolor que pagar&iacute;an por que desapareciera ma&ntilde;ana..." />
      </section>

      <Divider />

      {/* ══ PASO 02 — SUE&Ntilde;O ══ */}
      <section className="step-section mb-16">
        <StepBadge n={2} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          El Resultado So&ntilde;ado
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Nadie compra una membres&iacute;a de gimnasio &mdash; compran perder 10 kilos. Vende las vacaciones, no el avi&oacute;n. Define el destino.
        </p>

        <h3 className={cx.h3}>01. El Destino</h3>
        <p className={cx.body}>&iquest;C&oacute;mo se ve su vida <em>despu&eacute;s</em> de resolver el problema? Pinta el cuadro con detalles concretos.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;Entra el lunes, su equipo ya est&aacute; despachado, todos los leads del fin de semana recibieron llamada en menos de 2 horas, y est&aacute; revisando un dashboard que muestra que Q3 va adelante de Q2 por primera vez.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Preg&uacute;ntate:</p>
        <ul className={cx.questions}>
          <li>&iquest;C&oacute;mo se ve su calendario en 90 d&iacute;as si tu oferta funciona?</li>
          <li>&iquest;Qu&eacute; deja de pasar &mdash; qu&eacute; ansiedad, tarea o estresor desaparece?</li>
          <li>&iquest;Qu&eacute; se vuelve posible que antes no lo era?</li>
          <li>&iquest;Qu&eacute; le dicen a su pareja en la cena?</li>
        </ul>
        <AnswerArea id="dreamOutcome" value={wb.v('dreamOutcome')} onChange={(val) => wb.update('dreamOutcome', val)} placeholder="Pinta el cuadro de su vida cuando el problema ya no existe..." />

        <h3 className={cx.h3}>02. La Ganancia de Estatus</h3>
        <p className={cx.body}>Los humanos buscan estatus. Los resultados que mejor venden son los que elevan a alguien ante su c&iacute;rculo &mdash; su industria, su familia, su propio espejo.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;En la reuni&oacute;n de la c&aacute;mara del sector, los otros due&ntilde;os le preguntan c&oacute;mo le hizo. Se vuelve el tipo con el que la gente quiere estar.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Preg&uacute;ntate:</p>
        <ul className={cx.questions}>
          <li>&iquest;Qui&eacute;n necesita verlos ganar para que se sienta real &mdash; pares, empleados, familia?</li>
          <li>&iquest;De qu&eacute; estar&iacute;an orgullosos de contar o publicar?</li>
          <li>&iquest;Qu&eacute; miedo a quedar en rid&iacute;culo desaparece cuando tienen tu soluci&oacute;n?</li>
        </ul>
        <AnswerArea id="statusGain" value={wb.v('statusGain')} onChange={(val) => wb.update('statusGain', val)} placeholder="&iquest;C&oacute;mo cambia el resultado la forma en que otros los ven?" />
      </section>

      <Divider />

      {/* ══ PASO 03 — INVENTARIO DE PROBLEMAS ══ */}
      <section className="step-section mb-16">
        <StepBadge n={3} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Inventario de Problemas
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Cada obst&aacute;culo entre donde est&aacute;n hoy y el sue&ntilde;o es un espacio donde tu oferta puede agregar valor. No te cortes &mdash; veinte problemas es mejor que cinco. Los vamos a filtrar por las cuatro lentes de la Ecuaci&oacute;n de Valor.
        </p>

        <div className={cx.story}>
          <h3 className={cx.h3}>Lente 1: &ldquo;&iquest;De verdad vale la pena?&rdquo; (Dudas del Resultado)</h3>
          <p className={cx.body}>Problemas que los hacen dudar si la recompensa justifica el precio &mdash; financiero, emocional o de reputaci&oacute;n.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplos:</strong> &ldquo;No s&eacute; si el ROI est&aacute; ah&iacute;.&rdquo; &middot; &ldquo;La &uacute;ltima vez que pagu&eacute; algo as&iacute;, no funcion&oacute;.&rdquo; &middot; &ldquo;&iquest;Y si pago y no mueve la aguja?&rdquo;</p>
          <AnswerArea id="problemsDream" value={wb.v('problemsDream')} onChange={(val) => wb.update('problemsDream', val)} rows={5} placeholder="Lista cada raz&oacute;n por la que dudar&iacute;an del valor del resultado..." />
        </div>

        <div className={cx.story}>
          <h3 className={cx.h3}>Lente 2: &ldquo;&iquest;Funcionar&aacute; para M&Iacute;?&rdquo; (Dudas de Probabilidad)</h3>
          <p className={cx.body}>Problemas que los hacen creer que a otros les funciona pero a ellos no. Experiencia, compatibilidad, lo &uacute;nico de su situaci&oacute;n.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplos:</strong> &ldquo;Mi negocio es diferente.&rdquo; &middot; &ldquo;Ya prob&eacute; agencias y todas prometieron de m&aacute;s.&rdquo; &middot; &ldquo;Mi equipo no va a hacer el trabajo de seguimiento.&rdquo;</p>
          <AnswerArea id="problemsLikelihood" value={wb.v('problemsLikelihood')} onChange={(val) => wb.update('problemsLikelihood', val)} rows={5} placeholder="Lista cada raz&oacute;n por la que creer&iacute;an que no les funcionar&iacute;a a ellos..." />
        </div>

        <div className={cx.story}>
          <h3 className={cx.h3}>Lente 3: &ldquo;&iquest;Esto es demasiado dif&iacute;cil?&rdquo; (Dudas de Esfuerzo)</h3>
          <p className={cx.body}>Problemas de complejidad, carga de trabajo, lo que tendr&iacute;an que sacrificar, habilidades que no tienen.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplos:</strong> &ldquo;No tengo tiempo para aprender esto.&rdquo; &middot; &ldquo;Odio la tecnolog&iacute;a.&rdquo; &middot; &ldquo;Mi equipo ya est&aacute; a tope.&rdquo; &middot; &ldquo;Tendr&iacute;a que reconstruir un mont&oacute;n de cosas primero.&rdquo;</p>
          <AnswerArea id="problemsEffort" value={wb.v('problemsEffort')} onChange={(val) => wb.update('problemsEffort', val)} rows={5} placeholder="Lista todo lo que se sienta como mucho trabajo o muy dif&iacute;cil..." />
        </div>

        <div className={cx.story}>
          <h3 className={cx.h3}>Lente 4: &ldquo;&iquest;Esto va a tardar demasiado?&rdquo; (Dudas de Tiempo)</h3>
          <p className={cx.body}>Problemas sobre cu&aacute;nto tardan en ver resultados, tiempo de setup, fricci&oacute;n del onboarding, impaciencia.</p>
          <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplos:</strong> &ldquo;Necesito ver ingresos este mes, no en seis.&rdquo; &middot; &ldquo;El &uacute;ltimo setup me tom&oacute; 90 d&iacute;as.&rdquo; &middot; &ldquo;No tengo tiempo para esperar.&rdquo;</p>
          <AnswerArea id="problemsTime" value={wb.v('problemsTime')} onChange={(val) => wb.update('problemsTime', val)} rows={5} placeholder="Lista cada objeci&oacute;n o fricci&oacute;n relacionada con el tiempo..." />
        </div>
      </section>

      <Divider />

      {/* ══ PASO 04 — SOLUCIONES ══ */}
      <section className="step-section mb-16">
        <StepBadge n={4} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Convierte los Problemas en Soluciones
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Toma cada problema que listaste y dale la vuelta. F&oacute;rmula: <strong>&ldquo;C&oacute;mo [lograr X] sin [problema]&rdquo;</strong>. Cada l&iacute;nea se vuelve una soluci&oacute;n que va a entrar a alg&uacute;n lugar de tu oferta.
        </p>

        <h3 className={cx.h3}>Tu Lista de Soluciones</h3>
        <p className={cx.body}>No filtres todav&iacute;a &mdash; escribe una soluci&oacute;n para cada problema, aunque algunas parezcan peque&ntilde;as. En el Paso 6 recortamos.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplos:</strong><br/>
        &ldquo;C&oacute;mo conseguir ROI en 30 d&iacute;as sin escalar el gasto en ads&rdquo; &middot; <br/>
        &ldquo;C&oacute;mo lanzar sin que tu equipo tenga que aprender software nuevo&rdquo; &middot; <br/>
        &ldquo;C&oacute;mo probar que funciona en tu mercado espec&iacute;fico antes de comprometer todo el presupuesto&rdquo;</p>
        <AnswerArea id="solutionsList" value={wb.v('solutionsList')} onChange={(val) => wb.update('solutionsList', val)} rows={10} placeholder={'Convierte cada problema en una l\u00ednea "C\u00f3mo [resultado] sin [problema]".\nUna por l\u00ednea. Apunta a 15\u201330.'} />
      </section>

      <Divider />

      {/* ══ PASO 05 — ENTREGA Y TIPO DE PRODUCTO ══ */}
      <section className="step-section mb-16">
        <StepBadge n={5} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Mecanismo de Entrega y Tipo de Producto
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          Cada soluci&oacute;n se entrega de alguna forma. La misma idea puede ser un servicio 1:1, un programa grupal, un curso, un paquete de plantillas o un software &mdash; con m&aacute;rgenes y techos de precio muy distintos. Decide ya c&oacute;mo lo vas a entregar.
        </p>

        <h3 className={cx.h3}>01. Mecanismo de Entrega</h3>
        <p className={cx.body}>&iquest;C&oacute;mo recibe el cliente el valor? Puedes elegir varios, pero marca el principal.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Opciones a considerar:</p>
        <ul className={cx.questions}>
          <li><strong>1:1</strong> &mdash; llamadas, builds personalizados, coaching (alto precio, baja escala)</li>
          <li><strong>1:pocos</strong> &mdash; grupo peque&ntilde;o, cohort, mastermind</li>
          <li><strong>1:muchos</strong> &mdash; curso, videos grabados, comunidad</li>
          <li><strong>Hecho-para-ti (DFY)</strong> &mdash; t&uacute; haces el trabajo, ellos reciben el resultado</li>
          <li><strong>Hecho-contigo (DWY)</strong> &mdash; t&uacute; gu&iacute;as, ellos ejecutan</li>
          <li><strong>Autoservicio</strong> &mdash; usan tu producto sin ti</li>
        </ul>
        <AnswerArea id="deliveryMechanism" value={wb.v('deliveryMechanism')} onChange={(val) => wb.update('deliveryMechanism', val)} placeholder="Mecanismo principal + los secundarios..." />

        <h3 className={cx.h3}>02. Tipo de Producto</h3>
        <p className={cx.body}>El empaque alrededor de la entrega. El mismo mecanismo puede tener muchas formas distintas en el mercado.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Opciones a considerar:</p>
        <ul className={cx.questions}>
          <li>Consultor&iacute;a / retainer mensual</li>
          <li>Programa de coaching (3, 6 o 12 meses)</li>
          <li>Curso + comunidad</li>
          <li>Servicio hecho-para-ti o build custom</li>
          <li>Software / SaaS / herramienta</li>
          <li>Plantillas / playbooks / toolkit</li>
          <li>Evento, workshop, bootcamp, intensivo</li>
          <li>H&iacute;brido &mdash; servicio + software + comunidad</li>
        </ul>
        <AnswerArea id="productType" value={wb.v('productType')} onChange={(val) => wb.update('productType', val)} placeholder="&iquest;Qu&eacute; forma toma la oferta en el mercado?" />
      </section>

      <Divider />

      {/* ══ PASO 06 — RECORTAR, APILAR & BUNDLE ══ */}
      <section className="step-section mb-16">
        <StepBadge n={6} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Recortar, Apilar y Armar el Bundle
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          No puedes incluir todo. La oferta se arma restando lo que es caro-pero-sin-valor, sumando lo que es barato-pero-de-alto-valor, y luego apilando los sobrevivientes en un solo bundle.
        </p>

        <h3 className={cx.h3}>01. Recortar &mdash; Costo Alto, Mismo Valor</h3>
        <p className={cx.body}>&iquest;Qu&eacute; te sale caro entregar pero al cliente no le importa mucho? C&oacute;rtalo. Tu margen depende de esto.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;Las llamadas 1-a-1 semanales se comen 4 hrs/semana por cliente. Reemplazarlas con reviews as&iacute;ncronos por Loom + un doc compartido mantiene el 90% del valor al 20% del costo.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Preg&uacute;ntate:</p>
        <ul className={cx.questions}>
          <li>&iquest;Qu&eacute; te toma m&aacute;s tiempo pero el cliente casi no referencia?</li>
          <li>&iquest;Qu&eacute; entregas por costumbre, no porque el cliente lo pidi&oacute;?</li>
          <li>&iquest;Qu&eacute; se puede volver as&iacute;ncrono, automatizado, con plantilla o autoservicio sin bajar la calidad del resultado?</li>
        </ul>
        <AnswerArea id="trimHighCost" value={wb.v('trimHighCost')} onChange={(val) => wb.update('trimHighCost', val)} rows={5} placeholder="&iquest;Qu&eacute; puedes restar sin reducir el resultado?" />

        <h3 className={cx.h3}>02. Apilar &mdash; Costo Bajo, Valor Alto</h3>
        <p className={cx.body}>&iquest;Qu&eacute; es barato de producir una vez pero le ahorra al cliente muchas horas, esfuerzo o preocupaci&oacute;n para siempre?</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;Una plantilla de diagn&oacute;stico de 20 preguntas que te toma 2 horas hacer &mdash; le ahorra a cada cliente 2 semanas de bat&eacute;. Apalancamiento infinito.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Opciones a considerar:</p>
        <ul className={cx.questions}>
          <li>Plantillas, checklists, scripts, swipe files</li>
          <li>Calculadoras o herramientas de diagn&oacute;stico listas</li>
          <li>Trainings grabados que contestan preguntas recurrentes una sola vez</li>
          <li>SOPs, playbooks, frameworks</li>
          <li>Comunidad / presentaciones con pares</li>
          <li>Integraciones, automatizaciones o starter kits listos</li>
        </ul>
        <AnswerArea id="addLowCostHighValue" value={wb.v('addLowCostHighValue')} onChange={(val) => wb.update('addLowCostHighValue', val)} rows={5} placeholder="&iquest;Qu&eacute; puedes sumar que te cueste poco pero se sienta mucho?" />

        <h3 className={cx.h3}>03. El Bundle Final</h3>
        <p className={cx.body}>Ahora apila a los sobrevivientes. Lista lo que entra en la oferta final en el orden en que el cliente lo recibe. Cada l&iacute;nea deber&iacute;a sentirse como si valiera todo el precio por s&iacute; sola.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong><br/>
        &ldquo;Semana 1: Auditor&iacute;a + setup de dashboard custom (valor: $3K)<br/>
        Semanas 2&ndash;4: 3 reviews as&iacute;ncronos + librer&iacute;a de plantillas completa (valor: $5K)<br/>
        Meses 2&ndash;3: Ciclos mensuales de optimizaci&oacute;n + Slack privado (valor: $4K)<br/>
        Bonus: Toolkit de diagn&oacute;stico de 12 puntos + actualizaciones de por vida (valor: $2K)&rdquo;</p>
        <AnswerArea id="bundle" value={wb.v('bundle')} onChange={(val) => wb.update('bundle', val)} rows={8} placeholder={'Lista todo lo que entra en el bundle final, en orden.\nIncluye un "valor" numerado por cada l\u00ednea.'} />
      </section>

      <Divider />

      {/* ══ PASO 07 — POTENCIAR & CERRAR ══ */}
      <section className="step-section mb-16">
        <StepBadge n={7} label="Paso" />
        <h2 className="font-display text-[28px] font-bold italic leading-[1.15] tracking-[-0.01em] text-forge-text mb-4 sm:text-[30px]">
          Potencia y Cierra
        </h2>
        <p className="font-body text-[15px] text-forge-text-secondary mb-10">
          El bundle ya est&aacute;. Ahora aplica las cuatro palancas que pueden 10x la conversi&oacute;n sin cambiar el producto: escasez + urgencia, bonos, garant&iacute;a y nombre. Cierras con precio.
        </p>

        <h3 className={cx.h3}>01. Escasez y Urgencia</h3>
        <p className={cx.body}>La escasez limita el supply (cu&aacute;ntos pueden tenerlo). La urgencia limita el tiempo (cu&aacute;nto tienen para decidir). Ambas deben ser reales &mdash; los countdowns falsos destruyen la confianza en cuanto alguien lo nota.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplos:</strong> &ldquo;Solo 4 lugares por trimestre por capacidad de onboarding.&rdquo; &middot; &ldquo;Este precio aguanta hasta fin de mes; despu&eacute;s sube a $X.&rdquo; &middot; &ldquo;Empieza antes de [fecha] para ver resultados antes de tu temporada alta.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Preg&uacute;ntate:</p>
        <ul className={cx.questions}>
          <li>&iquest;Cu&aacute;l es el l&iacute;mite real de capacidad &mdash; tus horas, tu equipo, tus ops?</li>
          <li>&iquest;Hay una fecha real (temporada, calendario, cambio de precio)?</li>
          <li>&iquest;Cu&aacute;nto le cuesta al cliente esperar?</li>
        </ul>
        <AnswerArea id="scarcityUrgency" value={wb.v('scarcityUrgency')} onChange={(val) => wb.update('scarcityUrgency', val)} rows={4} placeholder="Escasez y urgencia leg&iacute;timas &mdash; sin countdowns falsos..." />

        <h3 className={cx.h3}>02. Bonos</h3>
        <p className={cx.body}>Los bonos expanden el valor percibido sin inflar tu costo. Los mejores bonos resuelven uno de los problemas de &ldquo;Esfuerzo&rdquo; o &ldquo;Tiempo&rdquo; del Paso 3 &mdash; quitan una fricci&oacute;n espec&iacute;fica que el cliente enfrentar&iacute;a.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplos:</strong> &ldquo;Bono: El script exacto que usamos con clientes nuevos en onboarding.&rdquo; &middot; &ldquo;Bono: Llamada 1:1 de setup con nuestro head of ops en la semana 1.&rdquo; &middot; &ldquo;Bono: Comunidad privada de otros due&ntilde;os en tu industria.&rdquo;</p>
        <AnswerArea id="bonuses" value={wb.v('bonuses')} onChange={(val) => wb.update('bonuses', val)} rows={5} placeholder="3&ndash;5 bonos, cada uno resolviendo una fricci&oacute;n espec&iacute;fica..." />

        <h3 className={cx.h3}>03. La Garant&iacute;a</h3>
        <p className={cx.body}>Reversi&oacute;n de riesgo. La oferta que dice &ldquo;si no funciona, no pagas&rdquo; (en la forma que sea real para ti) le gana a la oferta que dice &ldquo;conf&iacute;a en m&iacute;&rdquo; siempre. Entre m&aacute;s fuerte y espec&iacute;fica, mejor.</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Tipos de garant&iacute;a a considerar:</p>
        <ul className={cx.questions}>
          <li><strong>Incondicional:</strong> Reembolso total, sin preguntas, dentro de X d&iacute;as.</li>
          <li><strong>Condicional:</strong> Reembolso si hacen X, Y, Z y aun as&iacute; no ven resultado.</li>
          <li><strong>Basada en resultado:</strong> &ldquo;Seguimos trabajando hasta que [resultado espec&iacute;fico] &mdash; sin costo adicional.&rdquo;</li>
          <li><strong>Anti-garant&iacute;a:</strong> &ldquo;No hay reembolsos &mdash; solo tomamos clientes que estamos seguros que podemos ayudar. As&iacute; los filtramos.&rdquo;</li>
        </ul>
        <AnswerArea id="guarantee" value={wb.v('guarantee')} onChange={(val) => wb.update('guarantee', val)} rows={4} placeholder="La promesa que hace que decir no se sienta tonto..." />

        <h3 className={cx.h3}>04. El Nombre</h3>
        <p className={cx.body}>El empaque importa. Un buen nombre de oferta es <strong>Magn&eacute;tico, espec&iacute;fico a la Audiencia, con resultado Garantizado, Intrigante y Concreto</strong>. En una frase se&ntilde;ala para qui&eacute;n es y qu&eacute; obtienen.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplos:</strong> &ldquo;Rescate de Ingresos 90 D&iacute;as para Operadores de Servicios a Domicilio&rdquo; &middot; &ldquo;Sistema Lead Velocity&rdquo; &middot; &ldquo;Overhaul Q3 para Climatizaci&oacute;n&rdquo;</p>
        <AnswerArea id="offerName" value={wb.v('offerName')} onChange={(val) => wb.update('offerName', val)} rows={3} placeholder="Escribe 3&ndash;5 opciones de nombre. Escoge la que haga que el avatar se incline..." />

        <h3 className={cx.h3}>05. Precio y Matem&aacute;tica del ROI</h3>
        <p className={cx.body}>Precia por valor, no por costo. La decisi&oacute;n del cliente se vuelve f&aacute;cil cuando la matem&aacute;tica del ROI es obvia. Muestra el ancla, muestra el precio, muestra lo que recuperan.</p>
        <p className={cx.example}><strong className="text-forge-text not-italic">Ejemplo:</strong> &ldquo;Precio de lista: $24K. Tu precio: $12K para founding cohort. Impacto conservador en ingresos: $8K/mes adicionales = $96K/a&ntilde;o. ROI: 8x en a&ntilde;o 1. Punto de equilibrio: necesitas 1.5 clientes adicionales al mes.&rdquo;</p>
        <p className="font-body text-[15px] font-semibold text-forge-text mt-4 mb-1">Incluye en tu respuesta:</p>
        <ul className={cx.questions}>
          <li>Precio ancla (lo que cobrar&iacute;a un DFY/competidor comparable)</li>
          <li>Tu precio (y condiciones &mdash; upfront, mensual, descuento anual)</li>
          <li>Impacto conservador en ingresos o ahorros para el cliente</li>
          <li>M&uacute;ltiplo de ROI en a&ntilde;o 1 (objetivo: 3&ndash;10x)</li>
          <li>Frame del punto de equilibrio (&ldquo;necesitas X clientes m&aacute;s para cubrir esto&rdquo;)</li>
        </ul>
        <AnswerArea id="pricing" value={wb.v('pricing')} onChange={(val) => wb.update('pricing', val)} rows={6} placeholder={'Ancla: $\nPrecio: $\nImpacto en ingresos: $ /mes\nROI a\u00f1o 1:\nPunto de equilibrio:'} />
      </section>

      <WorkbookToolbar
        completedCount={wb.completedCount} totalFields={wb.totalFields} saveStatus={wb.saveStatus}
        onSave={wb.handleSave} onExport={wb.handleExport}
        onReset={() => wb.handleReset('Borrar todas las respuestas? No se puede deshacer.')}
        isDark={wb.isDark} onToggleDark={wb.toggleDark}
        saveLabel="Guardar" exportLabel="Exportar PDF" resetLabel="Limpiar"
        sectionsLabel={`de ${wb.totalFields} secciones`}
      />
    </WorkbookShell>
  );
}
