import { useNavigate } from 'react-router-dom'
import { MessageSquare, TrendingUp, AlertTriangle, Lightbulb, Database, Brain, ChevronRight, FlaskConical, Zap, Package, Wrench } from 'lucide-react'

function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FA' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #1C3668 60%, #2E558F 100%)',
        padding: '56px 48px 48px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />

        <div style={{ position: 'relative', maxWidth: '860px' }}>
          {/* Demo badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(193,95,60,0.18)', border: '1px solid rgba(193,95,60,0.4)',
            borderRadius: '20px', padding: '4px 12px', marginBottom: '20px'
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C15F3C' }} />
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#E8956D', letterSpacing: '0.06em' }}>
              DEMO PLATFORM — NovaChem, Grangemouth
            </span>
          </div>

          <h1 style={{
            margin: '0 0 16px', fontSize: '36px', fontWeight: '700',
            color: '#FFFFFF', lineHeight: '1.15', letterSpacing: '-0.02em'
          }}>
            Manufacturing Intelligence<br />
            <span style={{ color: '#7BAFD4' }}>and Optimization</span>
          </h1>

          <p style={{
            margin: '0 0 28px', fontSize: '16px', color: '#A8C4DE',
            lineHeight: '1.65', maxWidth: '620px'
          }}>
            This is a working demonstration of how this AI platform operates in a chemical
            manufacturing environment. It is built on real operational data patterns from a typical batch
            chemical plant — represented here as NovaChem, Grangemouth — and runs live AI agents against
            a Microsoft Fabric Lakehouse.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/data-agent')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#C15F3C', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '11px 22px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer'
              }}
            >
              <MessageSquare size={15} />
              Start with the Data Agent
            </button>
            <button
              onClick={() => navigate('/tier1-analytical-agents')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px', padding: '11px 22px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer'
              }}
            >
              Explore AI Agents
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '48px 32px' }}>

        {/* ── What is this ── */}
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '32px',
          border: '1px solid #E5E9F0', marginBottom: '32px'
        }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#0A1628' }}>
            What is this platform?
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4B5563', lineHeight: '1.7' }}>
            This platform demonstrates how AI agents — built on Claude and grounded in live manufacturing data via
            Microsoft Fabric — can replace static dashboards with reasoning systems that explain what is happening,
            why it is happening, and what to do about it. It covers the full operational picture for a chemical
            plant: production scheduling, asset health, energy, inventory, and quality.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { icon: FlaskConical, label: 'NovaChem, Grangemouth', sub: 'Specialty solvents & cleaners manufacturer' },
              { icon: Database, label: 'Microsoft Fabric Lakehouse', sub: 'Live SQL analytics endpoint — real data' },
              { icon: Brain, label: 'Claude Sonnet 4.6', sub: 'Anthropic AI — reasoning, not pattern matching' },
              { icon: Zap, label: 'Agentic architecture', sub: 'Agents call tools, query data, and reason' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px', background: '#F8FAFC', borderRadius: '8px',
                border: '1px solid #E5E9F0'
              }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'rgba(46,85,143,0.1)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon size={16} color="#2E558F" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#0A1628', marginBottom: '2px' }}>{label}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: '1.4' }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 3-Tier Architecture ── */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', color: '#0A1628' }}>
            How the AI agent tiers work
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6B7280', lineHeight: '1.6' }}>
            Agents are not chatbots. Each one has a defined role, calls live data tools, and reasons over the
            results before responding. Tier 3 agents orchestrate Tier 1 and 2 agents to produce comprehensive
            recommendations — a full agent-to-agent reasoning chain.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {/* Tier 1 */}
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '24px',
              border: '1px solid #E5E9F0', borderTop: '3px solid #4A7AB5'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: '#EBF1FB', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <TrendingUp size={14} color="#4A7AB5" />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#4A7AB5', letterSpacing: '0.06em' }}>TIER 1</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Analytical Agents</div>
                </div>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#4B5563', lineHeight: '1.6' }}>
                Explain what is happening and why the numbers look the way they do. Query live data,
                calculate KPIs, and translate metrics into plain language.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['Performance Analyst', 'Data Quality & Trust', 'Line Operations'].map(a => (
                  <div key={a} style={{
                    fontSize: '11px', color: '#374151', padding: '5px 10px',
                    background: '#F0F4FA', borderRadius: '5px', fontWeight: '500'
                  }}>{a}</div>
                ))}
              </div>
            </div>

            {/* Tier 2 */}
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '24px',
              border: '1px solid #E5E9F0', borderTop: '3px solid #C15F3C'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: '#FBF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AlertTriangle size={14} color="#C15F3C" />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#C15F3C', letterSpacing: '0.06em' }}>TIER 2</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Diagnostic & RCA</div>
                </div>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#4B5563', lineHeight: '1.6' }}>
                Identify root causes, not just symptoms. Structured causal analysis for downtime,
                CIP overruns, changeover delays, and throughput constraints.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['Downtime RCA', 'Bottleneck & Constraint'].map(a => (
                  <div key={a} style={{
                    fontSize: '11px', color: '#374151', padding: '5px 10px',
                    background: '#FBF3F0', borderRadius: '5px', fontWeight: '500'
                  }}>{a}</div>
                ))}
              </div>
            </div>

            {/* Tier 3 */}
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '24px',
              border: '1px solid #E5E9F0', borderTop: '3px solid #1C7A4A'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: '#EBF5F0', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Lightbulb size={14} color="#1C7A4A" />
                </div>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#1C7A4A', letterSpacing: '0.06em' }}>TIER 3</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628' }}>Predictive & Prescriptive</div>
                </div>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#4B5563', lineHeight: '1.6' }}>
                Orchestrate Tier 1 and 2 agents to produce ranked recommendations and executive-ready
                briefings. Agent-to-agent reasoning chains — not a single prompt.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {['Operations Recommendations', 'Executive Briefing'].map(a => (
                  <div key={a} style={{
                    fontSize: '11px', color: '#374151', padding: '5px 10px',
                    background: '#EEF7F2', borderRadius: '5px', fontWeight: '500'
                  }}>{a}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Flow arrow */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', marginTop: '16px', padding: '12px',
            background: '#fff', borderRadius: '8px', border: '1px solid #E5E9F0'
          }}>
            <span style={{ fontSize: '11px', color: '#6B7280', fontWeight: '500' }}>Fabric Lakehouse (SQL endpoint)</span>
            <ChevronRight size={13} color="#9CA3AF" />
            <span style={{ fontSize: '11px', color: '#4A7AB5', fontWeight: '600' }}>Tier 1 agents query live data</span>
            <ChevronRight size={13} color="#9CA3AF" />
            <span style={{ fontSize: '11px', color: '#C15F3C', fontWeight: '600' }}>Tier 2 diagnoses root causes</span>
            <ChevronRight size={13} color="#9CA3AF" />
            <span style={{ fontSize: '11px', color: '#1C7A4A', fontWeight: '600' }}>Tier 3 synthesises recommendations</span>
          </div>
        </div>

        {/* ── Domain coverage ── */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', color: '#0A1628' }}>
            Platform coverage
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#6B7280' }}>
            Each domain has dedicated analytics pages and AI agents grounded in NovaChem's operational data.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { icon: TrendingUp, label: 'Operations', sub: 'Production scheduling, performance analysis, RCA, recommendations', color: '#4A7AB5', path: '/production-intelligence' },
              { icon: Wrench, label: 'Asset Health', sub: 'OT data, process insights, maintenance orders, anomaly detection', color: '#7B5EA7', path: '/ot-data-insights' },
              { icon: Zap, label: 'Energy', sub: 'Consumption analysis, peak demand AI, energy per batch', color: '#C15F3C', path: '/energy-dashboard' },
              { icon: Package, label: 'Inventory', sub: 'Stock levels, material replenishment, demand forecasting', color: '#2E8B57', path: '/stock-overview' },
              { icon: FlaskConical, label: 'Quality', sub: 'Batch quality, CIP efficiency, yield tracking', color: '#B8860B', path: '/quality-dashboard' },
              { icon: Database, label: 'Platform', sub: 'Data explorer, AI trust & control, agent fleet management', color: '#374151', path: '/data-explorer' },
            ].map(({ icon: Icon, label, sub, color, path }) => (
              <div
                key={label}
                onClick={() => navigate(path)}
                style={{
                  background: '#fff', borderRadius: '10px', padding: '18px',
                  border: '1px solid #E5E9F0', cursor: 'pointer',
                  transition: 'border-color 0.15s, box-shadow 0.15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = color
                  e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.06)`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E5E9F0'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: `${color}18`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', marginBottom: '10px'
                }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0A1628', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: '1.5' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Where to start ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0A1628 0%, #1C3668 100%)',
          borderRadius: '12px', padding: '32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '24px', flexWrap: 'wrap'
        }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '700', color: '#fff' }}>
              Where to start
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#A8C4DE', maxWidth: '480px', lineHeight: '1.6' }}>
              The Data Agent is the best entry point — ask it anything about NovaChem's operations in plain
              English and it will query the Fabric Lakehouse and reason over the results. Then explore the
              Performance Analysis agents to see structured AI reasoning in action.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => navigate('/data-agent')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#C15F3C', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '11px 22px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              <MessageSquare size={15} />
              Open Data Agent
            </button>
            <button
              onClick={() => navigate('/tier1-analytical-agents')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px', padding: '11px 22px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap'
              }}
            >
              <TrendingUp size={15} />
              Performance Analysis
            </button>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '16px' }}>
          <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0, lineHeight: '1.6' }}>
            NovaChem is a fictional company used to demonstrate real operational AI capabilities.
            &nbsp;Data patterns are representative of real chemical manufacturing environments.
          </p>
        </div>

      </div>
    </div>
  )
}

export default Home
