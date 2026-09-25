import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleGauge,
  Clock3,
  Database,
  FileText,
  Fuel,
  Gauge,
  LayoutDashboard,
  MapPin,
  Menu,
  PackageCheck,
  Plus,
  Route as RouteIcon,
  Settings,
  ShieldAlert,
  Truck,
  Upload,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

type Role = 'Direction' | 'Gérant station' | 'Superviseur' | 'Pompiste'
type MissionStep = 'draft' | 'loaded' | 'transit' | 'arrived' | 'completed'

const roleMenus: Record<Role, { path: string; label: string; icon: typeof LayoutDashboard }[]> = {
  Direction: [
    { path: '/', label: 'Vue réseau', icon: LayoutDashboard },
    { path: '/missions', label: 'Missions', icon: RouteIcon },
    { path: '/stations', label: 'Stations & cuves', icon: Database },
    { path: '/pompes', label: 'Pompes', icon: Fuel },
    { path: '/alertes', label: 'Alertes', icon: ShieldAlert },
    { path: '/equipe', label: 'Équipe & parc', icon: Users },
  ],
  'Gérant station': [
    { path: '/', label: "Aujourd'hui", icon: LayoutDashboard },
    { path: '/missions', label: 'Réceptions', icon: RouteIcon },
    { path: '/stations', label: 'Cuves', icon: Database },
    { path: '/pompes', label: 'Pompes', icon: Fuel },
    { path: '/alertes', label: 'Alertes', icon: ShieldAlert },
  ],
  Superviseur: [
    { path: '/', label: "Aujourd'hui", icon: LayoutDashboard },
    { path: '/missions', label: 'Missions station', icon: RouteIcon },
    { path: '/stations', label: 'Jauges cuves', icon: Database },
    { path: '/pompes', label: 'Index pompes', icon: Gauge },
  ],
  Pompiste: [
    { path: '/', label: 'Ma vacation', icon: LayoutDashboard },
    { path: '/pompes', label: 'Relever les index', icon: Gauge },
  ],
}

const initialCompartments = [
  { id: 1, product: 'Gasoil', expected: 9000, measured: 8980 },
  { id: 2, product: 'Gasoil', expected: 9000, measured: 8975 },
  { id: 3, product: 'Super', expected: 9000, measured: 8990 },
  { id: 4, product: 'Super', expected: 9000, measured: 8950 },
  { id: 5, product: 'Gasoil', expected: 9000, measured: 8985 },
]

const steps: { id: MissionStep; short: string; label: string }[] = [
  { id: 'draft', short: '01', label: 'Mission' },
  { id: 'loaded', short: '02', label: 'Chargement' },
  { id: 'transit', short: '03', label: 'Trajet' },
  { id: 'arrived', short: '04', label: 'Réception' },
  { id: 'completed', short: '05', label: 'Rapprochement' },
]

function Brand() {
  return (
    <div className="brand">
      <div className="brand-logo">
        <img src="/logo-sud-contractors.png" alt="SUD CONTRACTORS" />
      </div>
      <span className="brand-product">Pro<i>Fuel</i></span>
      <small>Suivi carburant GESTOCI</small>
    </div>
  )
}

function StatusBadge({ tone, children }: { tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; children: React.ReactNode }) {
  return <span className={`badge ${tone}`}><span className="status-dot" />{children}</span>
}

function KpiCard({ icon: Icon, label, value, detail, tone = 'orange' }: {
  icon: typeof Fuel; label: string; value: string; detail: string; tone?: 'orange' | 'blue' | 'red' | 'green'
}) {
  return (
    <article className="kpi-card">
      <div className={`icon-box ${tone}`}><Icon size={21} /></div>
      <div>
        <span className="eyebrow">{label}</span>
        <strong className="kpi-value">{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  )
}

function Tank({ label, current, capacity, product, compact = false }: {
  label: string; current: number; capacity: number; product: string; compact?: boolean
}) {
  const percent = Math.round((current / capacity) * 100)
  return (
    <div className={`tank-card ${compact ? 'compact' : ''}`}>
      <div className="tank-visual">
        <div className="tank-fill" style={{ height: `${percent}%` }} />
        <strong>{percent}%</strong>
      </div>
      <div className="tank-meta">
        <span className="eyebrow">{label}</span>
        <strong>{current.toLocaleString('fr-FR')} L</strong>
        <small>{product} · capacité {capacity.toLocaleString('fr-FR')} L</small>
      </div>
    </div>
  )
}

function PageHeader({ eyebrow, title, description, action }: {
  eyebrow: string; title: React.ReactNode; description: string; action?: React.ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow orange">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  )
}

function Dashboard({ role, onOpenMission }: { role: Role; onOpenMission: () => void }) {
  if (role === 'Pompiste') return <PompisteHome />
  const direction = role === 'Direction'
  return (
    <>
      <PageHeader
        eyebrow={direction ? 'Vue consolidée du réseau' : 'Station Abidjan · Cocody'}
        title={<>MAÎTRISEZ VOS <em>OPÉRATIONS</em></>}
        description={direction ? 'Une vue en temps réel sur vos stocks, missions et anomalies.' : 'Votre situation opérationnelle du vendredi 25 septembre.'}
        action={<button className="primary-btn" onClick={onOpenMission}>Voir la mission active <ArrowRight size={16} /></button>}
      />
      <section className="kpi-grid">
        <KpiCard icon={Fuel} label="Stock réseau" value={direction ? '128 450 L' : '43 920 L'} detail={direction ? '3 stations actives' : '72 % de capacité'} />
        <KpiCard icon={Truck} label="Missions en cours" value="01" detail="TR-458 · vers Cocody" tone="blue" />
        <KpiCard icon={AlertTriangle} label="Alertes ouvertes" value="02" detail="1 alerte critique" tone="red" />
        <KpiCard icon={CircleGauge} label="Écart moyen" value="-0,27 %" detail="7 derniers jours" tone="green" />
      </section>
      <section className="dashboard-grid">
        <article className="panel mission-live">
          <div className="panel-head">
            <div><span className="eyebrow">Mission en direct</span><h2>GESTOCI → Cocody</h2></div>
            <StatusBadge tone="info">En transit</StatusBadge>
          </div>
          <div className="route-map">
            <div className="map-road road-one" />
            <div className="map-road road-two" />
            <MapPin className="origin-pin" size={30} />
            <div className="truck-pin"><Truck size={18} /></div>
            <MapPin className="station-pin" size={30} />
            <span className="map-label origin">GESTOCI Vridi</span>
            <span className="map-label station">Station Cocody</span>
          </div>
          <div className="live-stats">
            <div><span>Volume au départ</span><strong>45 000 L</strong></div>
            <div><span>Volume actuel</span><strong>44 880 L</strong></div>
            <div><span>Distance restante</span><strong>7,4 km</strong></div>
          </div>
          <button className="secondary-btn full" onClick={onOpenMission}>Ouvrir le suivi détaillé <ArrowRight size={15} /></button>
        </article>
        <div className="stack">
          <article className="panel">
            <div className="panel-head">
              <div><span className="eyebrow">Niveaux de cuves</span><h2>Station Cocody</h2></div>
              <Link to="/stations">Tout voir</Link>
            </div>
            <Tank label="CUVE 01" current={18200} capacity={20000} product="Gasoil" compact />
            <Tank label="CUVE 02" current={13120} capacity={20000} product="Super" compact />
          </article>
          <article className="panel alert-panel">
            <div className="alert-icon"><ShieldAlert size={22} /></div>
            <div><span className="eyebrow">Anomalie détectée</span><h3>Variation de 120 L</h3><p>Hors zone autorisée · Boulevard de Marseille · 10:32</p></div>
            <Link to="/alertes"><ArrowRight size={18} /></Link>
          </article>
        </div>
      </section>
    </>
  )
}

function PompisteHome() {
  const navigate = useNavigate()
  return (
    <>
      <PageHeader eyebrow="Vacation du matin · 05:30–14:00" title={<>BONJOUR, <em>KOFFI</em></>} description="Deux relevés d’ouverture sont attendus avant le début des ventes." />
      <article className="shift-card">
        <div className="shift-top"><div><span className="eyebrow">Tâche prioritaire</span><h2>Relever les index d’ouverture</h2></div><StatusBadge tone="warning">2 à faire</StatusBadge></div>
        <div className="pump-row"><Fuel /><div><strong>Pompe P01 · Gasoil</strong><span>Pistes 1 et 2</span></div><button onClick={() => navigate('/pompes')}>Saisir <ArrowRight size={16} /></button></div>
        <div className="pump-row"><Fuel /><div><strong>Pompe P02 · Super</strong><span>Pistes 3 et 4</span></div><button onClick={() => navigate('/pompes')}>Saisir <ArrowRight size={16} /></button></div>
      </article>
      <div className="identity-note"><UserRound size={20} /><div><strong>Vos saisies sont identifiées</strong><span>Connecté en tant que Koffi N’Guessan · Pompiste · Station Cocody</span></div></div>
    </>
  )
}

function Missions({ onCreate, onOpen }: { onCreate: () => void; onOpen: () => void }) {
  return (
    <>
      <PageHeader eyebrow="Traçabilité de bout en bout" title={<>MISSIONS DE <em>RAVITAILLEMENT</em></>} description="Suivez chaque litre de l’enlèvement GESTOCI jusqu’à la cuve de destination." action={<button className="primary-btn" onClick={onCreate}><Plus size={17} /> Nouvelle mission</button>} />
      <div className="filter-bar">
        <button className="filter active">Toutes <span>12</span></button><button className="filter">En cours <span>1</span></button><button className="filter">À réceptionner <span>1</span></button><button className="filter">Terminées <span>10</span></button>
      </div>
      <section className="mission-list">
        <article className="mission-row featured" onClick={onOpen}>
          <div className="mission-symbol"><Truck /></div>
          <div className="mission-main"><div><strong>MS-2026-0918</strong><StatusBadge tone="info">En transit</StatusBadge></div><span>GESTOCI Vridi <ArrowRight size={13} /> Station Cocody</span><small>Camion TR-458 · Yao Kouassi</small></div>
          <div className="mission-volume"><span>Volume déclaré</span><strong>45 000 L</strong><small>5 compartiments</small></div>
          <div className="mission-time"><span>Arrivée estimée</span><strong>11:45</strong><small>dans 38 min</small></div>
          <button className="icon-btn"><ArrowRight size={18} /></button>
        </article>
        <article className="mission-row" onClick={onOpen}>
          <div className="mission-symbol success"><PackageCheck /></div>
          <div className="mission-main"><div><strong>MS-2026-0917</strong><StatusBadge tone="success">Terminée</StatusBadge></div><span>GESTOCI Vridi <ArrowRight size={13} /> Station Marcory</span><small>Camion TR-214 · Bakary Koné</small></div>
          <div className="mission-volume"><span>Volume déclaré</span><strong>36 000 L</strong><small>4 compartiments</small></div>
          <div className="mission-time"><span>Écart final</span><strong className="success-text">-42 L</strong><small>-0,12 %</small></div>
          <button className="icon-btn"><ArrowRight size={18} /></button>
        </article>
        <article className="mission-row" onClick={onOpen}>
          <div className="mission-symbol success"><PackageCheck /></div>
          <div className="mission-main"><div><strong>MS-2026-0916</strong><StatusBadge tone="success">Terminée</StatusBadge></div><span>GESTOCI Vridi <ArrowRight size={13} /> Station Yopougon</span><small>Camion TR-458 · Yao Kouassi</small></div>
          <div className="mission-volume"><span>Volume déclaré</span><strong>45 000 L</strong><small>5 compartiments</small></div>
          <div className="mission-time"><span>Écart final</span><strong className="danger-text">-318 L</strong><small>-0,71 %</small></div>
          <button className="icon-btn"><ArrowRight size={18} /></button>
        </article>
      </section>
    </>
  )
}

function MissionDetail({ step, setStep }: { step: MissionStep; setStep: (step: MissionStep) => void }) {
  const navigate = useNavigate()
  const current = steps.findIndex((item) => item.id === step)
  const [arrivalValues, setArrivalValues] = useState(initialCompartments.map((c) => c.measured))
  const totalArrival = arrivalValues.reduce((a, b) => a + b, 0)
  const gap = totalArrival - 45000
  const next = () => setStep(steps[Math.min(current + 1, steps.length - 1)].id)
  return (
    <>
      <button className="back-btn" onClick={() => navigate('/missions')}><ArrowLeft size={16} /> Retour aux missions</button>
      <div className="mission-titlebar">
        <div><div className="mission-id"><span>MS-2026-0918</span><StatusBadge tone={step === 'completed' ? 'success' : step === 'arrived' ? 'warning' : 'info'}>{step === 'completed' ? 'Terminée' : step === 'arrived' ? 'À réceptionner' : step === 'draft' ? 'Brouillon' : step === 'loaded' ? 'Chargée' : 'En transit'}</StatusBadge></div><h1>GESTOCI Vridi → Station Cocody</h1><p>Camion TR-458 · Chauffeur Yao Kouassi · 25 sept. 2026</p></div>
        <div className="mission-total"><span>Volume déclaré</span><strong>45 000 L</strong></div>
      </div>
      <nav className="stepper">
        {steps.map((item, index) => (
          <button key={item.id} className={`${index < current ? 'done' : ''} ${index === current ? 'active' : ''}`} onClick={() => index <= current && setStep(item.id)}>
            <span>{index < current ? <Check size={16} /> : item.short}</span><strong>{item.label}</strong>
          </button>
        ))}
      </nav>
      {step === 'draft' && <MissionSetup onNext={next} />}
      {step === 'loaded' && <LoadingStep onNext={next} />}
      {step === 'transit' && <TransitStep onNext={next} />}
      {step === 'arrived' && <ArrivalStep values={arrivalValues} setValues={setArrivalValues} total={totalArrival} gap={gap} onNext={next} />}
      {step === 'completed' && <Reconciliation total={totalArrival} gap={gap} />}
    </>
  )
}

function MissionSetup({ onNext }: { onNext: () => void }) {
  return (
    <section className="workflow-grid">
      <article className="panel form-panel">
        <span className="eyebrow orange">Étape 01</span><h2>Informations de la mission</h2><p>Associez les acteurs et les équipements avant le chargement.</p>
        <div className="form-grid">
          <label>Station de destination<select defaultValue="cocody"><option value="cocody">Station Cocody</option><option>Station Marcory</option></select></label>
          <label>Camion-citerne<select defaultValue="tr458"><option value="tr458">TR-458 · 45 000 L</option><option>TR-214 · 36 000 L</option></select></label>
          <label>Chauffeur<select defaultValue="yao"><option value="yao">Yao Kouassi</option><option>Bakary Koné</option></select></label>
          <label>Date d’enlèvement<input type="date" defaultValue="2026-09-25" /></label>
        </div>
        <label>Référence du bon GESTOCI<input defaultValue="BC-GES-250926-1842" /></label>
        <div className="upload-zone"><Upload /><div><strong>Bon de chargement joint</strong><span>bon_gestoci_1842.pdf · 1,2 Mo</span></div><CheckCircle2 className="success-text" /></div>
      </article>
      <aside className="workflow-summary"><div className="summary-icon"><ShieldAlert /></div><span className="eyebrow">Contrôle d’identité</span><h3>Opération attribuée</h3><p>Cette mission sera tracée au nom de l’utilisateur connecté.</p><div className="user-chip"><UserRound /><div><strong>Awa Diarra</strong><span>Superviseure · Station Cocody</span></div></div></aside>
      <div className="workflow-actions"><span>Les champs peuvent être modifiés dans ce prototype.</span><button className="primary-btn" onClick={onNext}>Valider la mission <ArrowRight size={16} /></button></div>
    </section>
  )
}

function Compartments({ live = false }: { live?: boolean }) {
  return (
    <div className="compartments">
      {initialCompartments.map((c, index) => {
        const percent = live && index === 3 ? 96 : 99
        return <div className="compartment" key={c.id}><div className="comp-fill" style={{ height: `${percent}%` }} /><span>C{c.id}</span><strong>{live && index === 3 ? '8 950' : c.measured.toLocaleString('fr-FR')} L</strong><small>{c.product}</small></div>
      })}
    </div>
  )
}

function LoadingStep({ onNext }: { onNext: () => void }) {
  return (
    <section className="workflow-grid">
      <article className="panel form-panel">
        <div className="panel-head"><div><span className="eyebrow orange">Étape 02</span><h2>Chargement GESTOCI</h2></div><StatusBadge tone="success">Bon contrôlé</StatusBadge></div>
        <p>Confirmez la répartition déclarée sur le bon de chargement.</p>
        <div className="table-wrap"><table><thead><tr><th>Compartiment</th><th>Produit</th><th>Capacité</th><th>Volume déclaré</th></tr></thead><tbody>{initialCompartments.map((c) => <tr key={c.id}><td><b>C{c.id}</b></td><td>{c.product}</td><td>9 000 L</td><td><input type="number" defaultValue={c.expected} /> L</td></tr>)}</tbody><tfoot><tr><td colSpan={3}>TOTAL CHARGÉ</td><td>45 000 L</td></tr></tfoot></table></div>
      </article>
      <aside className="workflow-summary dark"><span className="eyebrow">Visualisation citerne</span><h3>TR-458</h3><Compartments /><div className="sensor-line"><span><CircleGauge size={17} /> Sondes connectées</span><StatusBadge tone="success">5 / 5</StatusBadge></div></aside>
      <div className="workflow-actions"><span>Le départ horodaté lance le suivi des volumes et de la position.</span><button className="primary-btn" onClick={onNext}>Confirmer le départ <Truck size={16} /></button></div>
    </section>
  )
}

function TransitStep({ onNext }: { onNext: () => void }) {
  return (
    <section className="workflow-grid">
      <article className="panel form-panel">
        <div className="panel-head"><div><span className="eyebrow orange">Étape 03 · Temps réel</span><h2>Suivi du trajet</h2></div><StatusBadge tone="info">Position actualisée</StatusBadge></div>
        <div className="route-map large">
          <div className="map-road road-one" /><div className="map-road road-two" /><MapPin className="origin-pin" size={30} /><div className="truck-pin"><Truck size={18} /></div><MapPin className="station-pin" size={30} />
          <span className="map-label origin">GESTOCI Vridi</span><span className="map-label station">Station Cocody</span>
        </div>
        <div className="timeline">
          <div className="done"><Check /><div><strong>Chargement confirmé</strong><span>GESTOCI Vridi · 09:54 · 45 000 L</span></div><time>09:54</time></div>
          <div className="alert"><AlertTriangle /><div><strong>Variation de volume détectée</strong><span>Bd. de Marseille · -120 L hors zone autorisée</span></div><time>10:32</time></div>
          <div className="current"><Truck /><div><strong>Véhicule en mouvement</strong><span>Vitesse 38 km/h · 7,4 km restants</span></div><time>11:07</time></div>
        </div>
      </article>
      <aside className="workflow-summary dark"><span className="eyebrow">Volumes en direct</span><h3>44 880 L</h3><p className="loss">-120 L depuis le départ</p><Compartments live /><div className="alert-box"><AlertTriangle /><div><strong>Compartiment C4</strong><span>Variation anormale de 50 L</span></div></div></aside>
      <div className="workflow-actions"><span>Pour tester le parcours, simulez maintenant l’arrivée à la station.</span><button className="primary-btn" onClick={onNext}>Simuler l’arrivée <MapPin size={16} /></button></div>
    </section>
  )
}

function ArrivalStep({ values, setValues, total, gap, onNext }: {
  values: number[]; setValues: (v: number[]) => void; total: number; gap: number; onNext: () => void
}) {
  const update = (index: number, value: string) => setValues(values.map((v, i) => i === index ? Number(value) : v))
  return (
    <section className="workflow-grid">
      <article className="panel form-panel">
        <div className="panel-head"><div><span className="eyebrow orange">Étape 04</span><h2>Réception & dépotage</h2></div><StatusBadge tone="warning">Validation requise</StatusBadge></div>
        <p>Saisissez ou confirmez la mesure reçue pour chaque compartiment.</p>
        <div className="table-wrap"><table><thead><tr><th>Compartiment</th><th>Produit</th><th>Départ</th><th>Mesure à l’arrivée</th><th>Écart</th></tr></thead><tbody>{initialCompartments.map((c, i) => { const itemGap = values[i] - c.expected; return <tr key={c.id}><td><b>C{c.id}</b></td><td>{c.product}</td><td>{c.expected.toLocaleString('fr-FR')} L</td><td><input aria-label={`Mesure compartiment C${c.id}`} type="number" value={values[i]} onChange={(e) => update(i, e.target.value)} /> L</td><td className={itemGap < -30 ? 'danger-text' : ''}>{itemGap} L</td></tr> })}</tbody><tfoot><tr><td colSpan={2}>TOTAL REÇU</td><td>45 000 L</td><td>{total.toLocaleString('fr-FR')} L</td><td className="danger-text">{gap} L</td></tr></tfoot></table></div>
        <label>Cuve de destination<select defaultValue="cuve1"><option value="cuve1">CUVE 01 · Gasoil</option><option>CUVE 02 · Super</option></select></label>
        <label>Observation<textarea defaultValue="Scellés contrôlés à l'arrivée. Dépotage supervisé par Awa Diarra." /></label>
      </article>
      <aside className="workflow-summary"><span className="eyebrow">Contrôle instantané</span><h3>{total.toLocaleString('fr-FR')} L reçus</h3><div className="comparison"><div><span>Déclaré</span><strong>45 000 L</strong></div><ArrowRight /><div><span>Reçu</span><strong>{total.toLocaleString('fr-FR')} L</strong></div></div><div className="gap-card"><span>Écart provisoire</span><strong>{gap.toLocaleString('fr-FR')} L</strong><small>{((gap / 45000) * 100).toFixed(2)} %</small></div><div className="user-chip"><UserRound /><div><strong>Awa Diarra</strong><span>Réception identifiée · 11:43</span></div></div></aside>
      <div className="workflow-actions"><span>Modifiez une mesure pour voir le rapprochement se recalculer.</span><button className="primary-btn" onClick={onNext}>Valider le dépotage <Check size={16} /></button></div>
    </section>
  )
}

function Reconciliation({ total, gap }: { total: number; gap: number }) {
  const navigate = useNavigate()
  const percent = (gap / 45000) * 100
  return (
    <section className="reconciliation">
      <div className="success-hero"><div className="success-mark"><CheckCircle2 /></div><span className="eyebrow">Mission clôturée · 11:58</span><h2>Rapprochement terminé</h2><p>Chaque étape est horodatée et associée aux intervenants.</p></div>
      <div className="flow-values">
        <div><span className="eyebrow">01 · GESTOCI</span><strong>45 000 L</strong><small>Bon de chargement</small></div><ArrowRight />
        <div><span className="eyebrow">02 · EN ROUTE</span><strong>44 880 L</strong><small>Dernière télémétrie</small></div><ArrowRight />
        <div><span className="eyebrow">03 · STATION</span><strong>{total.toLocaleString('fr-FR')} L</strong><small>Mesure de réception</small></div>
      </div>
      <div className="result-grid">
        <article className="result-main"><span className="eyebrow">Écart final constaté</span><strong>{gap.toLocaleString('fr-FR')} L</strong><em>{percent.toFixed(2)} %</em><p className={Math.abs(percent) > 0.5 ? 'danger-text' : 'success-text'}>{Math.abs(percent) > 0.5 ? 'Écart supérieur au seuil autorisé de 0,50 %' : 'Écart dans la tolérance autorisée'}</p></article>
        <article className="trace-card"><span className="eyebrow">Piste d’audit</span><div><Check /> Création · Awa Diarra · 09:18</div><div><Check /> Chargement · K. Traoré · 09:54</div><div><AlertTriangle /> Alerte route · automatique · 10:32</div><div><Check /> Réception · Awa Diarra · 11:43</div></article>
        <article className="trace-card"><span className="eyebrow">Documents</span><div><FileText /> Bon GESTOCI · PDF</div><div><FileText /> Bon de livraison · PDF</div><div><FileText /> Rapport de rapprochement · PDF</div></article>
      </div>
      <div className="completion-actions"><button className="secondary-btn" onClick={() => navigate('/missions')}>Retour aux missions</button><button className="primary-btn"><FileText size={16} /> Voir le rapport</button></div>
    </section>
  )
}

function Stations() {
  return (
    <>
      <PageHeader eyebrow="Stocks station" title={<>CITERNES & <em>CUVES</em></>} description="Visualisez les niveaux mesurés et les dernières jauges de contrôle." action={<button className="primary-btn"><Plus size={16} /> Nouvelle jauge</button>} />
      <div className="station-banner"><div><Building2 /><div><span className="eyebrow">Station sélectionnée</span><strong>Abidjan · Cocody</strong><small>3 cuves · 2 produits · dernière synchronisation il y a 2 min</small></div></div><button>Changer de station <ChevronDown size={15} /></button></div>
      <section className="tank-grid">
        <Tank label="CUVE 01" current={18200} capacity={20000} product="Gasoil" />
        <Tank label="CUVE 02" current={13120} capacity={20000} product="Super" />
        <Tank label="CUVE 03" current={12600} capacity={20000} product="Gasoil" />
      </section>
      <article className="panel history-table"><div className="panel-head"><div><span className="eyebrow">Historique</span><h2>Dernières jauges</h2></div><StatusBadge tone="success">3 sondes en ligne</StatusBadge></div><table><thead><tr><th>Heure</th><th>Cuve</th><th>Mesure sonde</th><th>Mesure manuelle</th><th>Écart</th><th>Opérateur</th></tr></thead><tbody><tr><td>06:02</td><td>CUVE 01</td><td>18 200 L</td><td>18 195 L</td><td className="success-text">+5 L</td><td>Awa Diarra</td></tr><tr><td>06:04</td><td>CUVE 02</td><td>13 120 L</td><td>13 110 L</td><td>+10 L</td><td>Awa Diarra</td></tr><tr><td>00:01</td><td>CUVE 03</td><td>12 600 L</td><td>12 610 L</td><td>-10 L</td><td>Jean Kouamé</td></tr></tbody></table></article>
    </>
  )
}

function Pumps() {
  const [saved, setSaved] = useState<string[]>([])
  const pumps = [{ id: 'P01', product: 'Gasoil', last: '128 430,2', suggested: '128 592,7' }, { id: 'P02', product: 'Super', last: '89 214,8', suggested: '89 341,5' }]
  return (
    <>
      <PageHeader eyebrow="Vacation du matin" title={<>INDEX DES <em>POMPES</em></>} description="Relevez les totalisateurs à l’ouverture et à la clôture de la vacation." />
      <section className="pump-grid">{pumps.map((pump) => <article className={`pump-card ${saved.includes(pump.id) ? 'saved' : ''}`} key={pump.id}><div className="pump-card-head"><div className="pump-icon"><Fuel /></div><div><span className="eyebrow">{pump.id}</span><h2>{pump.product}</h2></div>{saved.includes(pump.id) ? <StatusBadge tone="success">Enregistré</StatusBadge> : <StatusBadge tone="warning">À relever</StatusBadge>}</div><div className="previous-index"><span>Dernier index de clôture</span><strong>{pump.last} L</strong><small>Hier · 22:03 · par Mariam Koné</small></div><label>Index d’ouverture<input defaultValue={pump.suggested} inputMode="decimal" /><span className="input-unit">litres</span></label><label className="photo-field"><Upload size={18} /><span>Ajouter une photo du totalisateur</span></label><button className={saved.includes(pump.id) ? 'saved-btn' : 'primary-btn full'} onClick={() => setSaved([...saved, pump.id])}>{saved.includes(pump.id) ? <><CheckCircle2 /> Index enregistré</> : <>Enregistrer l’index <ArrowRight size={16} /></>}</button></article>)}</section>
      {saved.length === 2 && <div className="success-toast"><CheckCircle2 /><div><strong>Ouverture terminée</strong><span>Les deux index ont été enregistrés à votre nom.</span></div></div>}
    </>
  )
}

function Alerts() {
  return (
    <>
      <PageHeader eyebrow="Centre de contrôle" title={<>ALERTES & <em>ANOMALIES</em></>} description="Identifiez, qualifiez et clôturez chaque événement suspect." />
      <section className="alert-stats"><div><strong>2</strong><span>Alertes ouvertes</span></div><div><strong className="danger-text">1</strong><span>Critique</span></div><div><strong className="warning-text">1</strong><span>À qualifier</span></div><div><strong>8 min</strong><span>Temps moyen de traitement</span></div></section>
      <section className="alerts-list">
        <article className="alert-row critical"><div className="alert-icon"><ShieldAlert /></div><div className="alert-content"><div><StatusBadge tone="danger">Critique</StatusBadge><span>25 sept. · 10:32</span></div><h3>Baisse de volume hors zone autorisée</h3><p>Mission MS-2026-0918 · Camion TR-458 · variation de 120 L détectée.</p><span><MapPin size={14} /> Boulevard de Marseille, Abidjan</span></div><button className="secondary-btn">Analyser <ArrowRight size={15} /></button></article>
        <article className="alert-row"><div className="alert-icon warning"><Bell /></div><div className="alert-content"><div><StatusBadge tone="warning">Avertissement</StatusBadge><span>25 sept. · 08:14</span></div><h3>Sonde sans communication</h3><p>CUVE 03 · Station Yopougon · dernière donnée reçue il y a 2 h.</p><span><Clock3 size={14} /> Jauge manuelle de secours attendue</span></div><button className="secondary-btn">Traiter <ArrowRight size={15} /></button></article>
      </section>
    </>
  )
}

function Placeholder({ type }: { type: 'team' }) {
  return <><PageHeader eyebrow="Administration" title={<>ÉQUIPE & <em>PARC</em></>} description="Gérez les personnes, les véhicules et les droits d’accès." /><section className="kpi-grid"><KpiCard icon={Users} label="Utilisateurs" value="18" detail="4 profils d’accès" /><KpiCard icon={Truck} label="Camions" value="02" detail="2 actifs aujourd’hui" tone="blue" /><KpiCard icon={Building2} label="Stations" value="03" detail="Cocody, Marcory, Yopougon" tone="green" /></section></>
}

function NewMissionModal({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className="modal" onMouseDown={(e) => e.stopPropagation()}><button className="modal-close" onClick={onClose}><X /></button><span className="eyebrow orange">Nouveau ravitaillement</span><h2>Créer une mission</h2><p>Le prototype préremplit les données afin de tester immédiatement le parcours.</p><div className="form-grid"><label>Station<select><option>Station Cocody</option></select></label><label>Camion<select><option>TR-458 · 45 000 L</option></select></label><label>Chauffeur<select><option>Yao Kouassi</option></select></label><label>Date<input type="date" defaultValue="2026-09-25" /></label></div><button className="primary-btn full" onClick={onCreate}>Créer et préparer la mission <ArrowRight size={16} /></button></div></div>
}

export default function App() {
  const [role, setRole] = useState<Role>('Direction')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [modal, setModal] = useState(false)
  const [missionStep, setMissionStep] = useState<MissionStep>('transit')
  const location = useLocation()
  const navigate = useNavigate()
  const menus = roleMenus[role]
  const title = useMemo(() => menus.find((m) => m.path === location.pathname)?.label ?? (location.pathname.includes('/missions/') ? 'Détail mission' : 'ProFuel'), [location.pathname, menus])
  const openMission = () => navigate('/missions/MS-2026-0918')
  const createMission = () => { setModal(false); setMissionStep('draft'); openMission() }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <Brand />
        <button className="mobile-close" onClick={() => setMobileOpen(false)}><X /></button>
        <div className="station-selector"><Building2 size={18} /><div><span>ESPACE ACTIF</span><strong>{role === 'Direction' ? 'Toutes les stations' : 'Station Cocody'}</strong></div><ChevronDown size={15} /></div>
        <nav>{menus.map(({ path, label, icon: Icon }) => <Link onClick={() => setMobileOpen(false)} key={path + label} to={path} className={(location.pathname === path || (path === '/missions' && location.pathname.startsWith('/missions/'))) ? 'active' : ''}><Icon size={19} /><span>{label}</span>{label === 'Alertes' && <b>2</b>}</Link>)}</nav>
        <div className="sidebar-bottom"><Link to="#"><Settings size={19} /> Paramètres</Link><div className="support-card"><ShieldAlert /><strong>Besoin d’aide ?</strong><span>Contactez le support SUD CONTRACTORS.</span><button>Contacter le support</button></div></div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu /></button>
          <img className="topbar-logo" src="/logo-sud-contractors.png" alt="SUD CONTRACTORS" />
          <div><span className="top-eyebrow">Pro<i>Fuel</i></span><strong>{title}</strong></div>
          <div className="top-actions">
            <div className="prototype-switch"><span>MODE PROTOTYPE</span><label>Tester en tant que<select value={role} onChange={(e) => { setRole(e.target.value as Role); navigate('/') }}><option>Direction</option><option>Gérant station</option><option>Superviseur</option><option>Pompiste</option></select></label></div>
            <button className="notification"><Bell /><span>2</span></button>
            <div className="avatar">AD</div><div className="user-meta"><strong>Awa Diarra</strong><span>{role}</span></div>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard role={role} onOpenMission={openMission} />} />
            <Route path="/missions" element={role === 'Pompiste' ? <Navigate to="/" /> : <Missions onCreate={() => setModal(true)} onOpen={openMission} />} />
            <Route path="/missions/:id" element={role === 'Pompiste' ? <Navigate to="/" /> : <MissionDetail step={missionStep} setStep={setMissionStep} />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/pompes" element={<Pumps />} />
            <Route path="/alertes" element={<Alerts />} />
            <Route path="/equipe" element={<Placeholder type="team" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
      {modal && <NewMissionModal onClose={() => setModal(false)} onCreate={createMission} />}
    </div>
  )
}
